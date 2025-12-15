# =============================================================================
# ReportBurster Server Dockerfile
# Multi-stage build optimized for caching and clean builds
# =============================================================================
# 
# BUILD MODES:
# 
# 1. DEVELOPMENT BUILD (uses cache, fast rebuilds):
#    docker build -t flowkraft/reportburster-server:dev .
#
# 2. RELEASE BUILD (100% clean, no cache):
#    docker build --no-cache --build-arg BUILD_DATE=$(date -u +%Y%m%d%H%M%S) \
#                 -t flowkraft/reportburster-server:X.Y.Z .
#
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Maven Dependencies (cached unless pom.xml changes)
# -----------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-17-alpine AS maven-deps

# Build date arg - change this to bust cache for release builds
ARG BUILD_DATE=dev

WORKDIR /app

# Install custom jar that's not in Maven Central (rarely changes, cache it)
COPY ./xtra-tools/bild/common-scripts/maven/lib-repository/burst/pherialize-1.2.1.jar /tmp/
RUN mvn install:install-file \
    -Dfile=/tmp/pherialize-1.2.1.jar \
    -DgroupId=de.ailis.pherialize \
    -DartifactId=pherialize \
    -Dversion=1.2.1 \
    -Dpackaging=jar \
    -P docker && \
    rm /tmp/pherialize-1.2.1.jar

# Copy ONLY pom.xml files first (for dependency caching)
COPY ./pom.xml ./pom.xml
COPY ./xtra-tools/bild/common-scripts/maven/pom.xml ./xtra-tools/bild/common-scripts/maven/pom.xml
COPY ./bkend/common/pom.xml ./bkend/common/pom.xml
COPY ./bkend/update/pom.xml ./bkend/update/pom.xml
COPY ./bkend/reporting/pom.xml ./bkend/reporting/pom.xml
COPY ./bkend/server/pom.xml ./bkend/server/pom.xml

# Download all dependencies (this layer is cached until pom.xml changes)
RUN mvn dependency:go-offline -B -P docker || true

# -----------------------------------------------------------------------------
# STAGE 2: Build Java Backend
# -----------------------------------------------------------------------------
FROM maven-deps AS backend-build

# Now copy source code (changes frequently, not cached)
COPY ./bkend/common/src ./bkend/common/src
COPY ./bkend/update/src ./bkend/update/src
COPY ./bkend/reporting/src ./bkend/reporting/src
COPY ./bkend/server/src ./bkend/server/src

# Build all modules
RUN mvn clean install -DskipTests -P docker

# Copy dependencies for burst library
RUN mvn dependency:copy-dependencies -P docker

# -----------------------------------------------------------------------------
# STAGE 3: Build Angular Frontend (parallel with backend in BuildKit)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS frontend-build

# Build date arg for cache busting
ARG BUILD_DATE=dev

WORKDIR /app/frend

# Copy package files first (for npm cache)
COPY ./frend/reporting/package*.json ./

# Install dependencies (cached unless package.json changes)
RUN npm install -g @angular/cli && npm install --force

# Copy source code and build
COPY ./frend/reporting .

# Build Angular for web deployment
RUN npm run custom:release-web && npm prune --production --force

# -----------------------------------------------------------------------------
# STAGE 4: Runtime Image
# -----------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine

# Metadata
LABEL maintainer="FlowKraft" \
      version="10.2.0" \
      description="ReportBurster Server - Document Processing & Distribution"

# Install runtime dependencies
RUN apk --no-cache add \
    curl \
    docker-cli \
    docker-cli-compose \
    bash

# Set working directory
WORKDIR /app

# Copy template folder structure (rarely changes)
COPY ./asbl/src/main/external-resources/db-template/ ./
COPY ./asbl/src/main/external-resources/db-server-template/ ./
COPY ./bkend/reporting/src/main/external-resources/template/ ./

# Configure default settings for Docker environment
RUN cp /app/config/burst/settings.xml /app/config/_defaults/settings.xml && \
    cp /app/config/burst/settings.xml /app/config/samples/split-only/settings.xml && \
    cp /app/config/burst/settings.xml /app/config/samples/split-two-times/settings.xml && \
    sed -i 's|<reportdistribution>true</reportdistribution>|<reportdistribution>false</reportdistribution>|g' /app/config/samples/split-two-times/settings.xml && \
    sed -i 's|<split2ndtime>false</split2ndtime>|<split2ndtime>true</split2ndtime>|g' /app/config/samples/split-two-times/settings.xml && \
    sed -i 's|<host>localhost</host>|<host>mailhog</host>|g' /app/config/burst/settings.xml && \
    sed -i 's|<weburl>http://localhost:8025</weburl>|<weburl>http://mailhog:8025</weburl>|g' /app/config/burst/settings.xml && \
    cp /app/config/_internal/license.xml /app/config/_defaults/license.xml

# Copy built artifacts from build stages
COPY --from=frontend-build /app/frend/dist /app/lib/frend
COPY --from=backend-build /app/bkend/reporting/target/dependencies /app/lib/burst
COPY --from=backend-build /app/bkend/reporting/target/rb-reporting.jar /app/lib/burst/rb-reporting.jar
COPY --from=backend-build /app/bkend/server/target/rb-server.jar /app/lib/server/rb-server.jar

# Generate reportburster.sh script (matches .bat functionality with dynamic args)
RUN cat > ./reportburster.sh << 'EOF'
#!/bin/sh
# ReportBurster CLI - matches Windows .bat behavior
# Passes all arguments dynamically to the Java process

# Build argument string for Ant
ARGS=""
COUNT=1
for ARG in "$@"; do
    ARGS="$ARGS -Darg$COUNT=\"$ARG\""
    COUNT=$((COUNT + 1))
done

# Execute with all arguments
eval java -DDOCUMENTBURSTER_HOME="$(pwd)" \
    -cp "lib/burst/ant-launcher*.jar" \
    org.apache.tools.ant.launch.Launcher \
    -buildfile config/_internal/documentburster.xml \
    $ARGS \
    -emacs >> logs/reportburster.sh.log 2>&1
EOF
RUN chmod +x ./reportburster.sh

# Generate test email server scripts
RUN echo '#!/bin/sh' > ./tools/test-email-server/startTestEmailServer.sh && \
    echo 'docker start mailhog' >> ./tools/test-email-server/startTestEmailServer.sh && \
    chmod +x ./tools/test-email-server/startTestEmailServer.sh

RUN echo '#!/bin/sh' > ./tools/test-email-server/shutTestEmailServer.sh && \
    echo 'docker stop mailhog' >> ./tools/test-email-server/shutTestEmailServer.sh && \
    chmod +x ./tools/test-email-server/shutTestEmailServer.sh

# Create the docker-entrypoint.sh script
RUN cat > /usr/local/bin/docker-entrypoint.sh << 'ENTRYPOINT_EOF'
#!/bin/bash
set -e

# =============================================================================
# ReportBurster Docker Entrypoint
# Handles API key generation and server startup
# =============================================================================

PORTABLE_EXECUTABLE_DIR_PATH=/app
FRONTEND_PATH=/app/lib/frend
POLLING_PATH=/app/poll
API_KEY_FILE=/app/config/_internal/api-key.txt
CONFIG_JSON_FILE=/app/lib/frend/assets/config.json
SERVER_PORT=${SERVER_PORT:-9090}

# -----------------------------------------------------------------------------
# Function: Generate or load API key
# Mirrors the behavior of startRbsjServer.bat on Windows
# -----------------------------------------------------------------------------
setup_api_key() {
    # Check if API_KEY is provided via environment variable
    if [ -n "$API_KEY" ]; then
        echo "Using API key from environment variable"
        CURRENT_API_KEY="$API_KEY"
    elif [ -f "$API_KEY_FILE" ]; then
        # Read existing API key from file (persisted via volume)
        CURRENT_API_KEY=$(cat "$API_KEY_FILE" | tr -d '[:space:]')
        echo "Loaded existing API key from $API_KEY_FILE"
    else
        # Generate new API key (32 bytes = 256 bits, base64 encoded)
        CURRENT_API_KEY=$(head -c 32 /dev/urandom | base64 | tr -d '=+/' | head -c 43)
        echo "Generated new API key"
    fi
    
    # Ensure config directory exists
    mkdir -p "$(dirname "$API_KEY_FILE")"
    mkdir -p "$(dirname "$CONFIG_JSON_FILE")"
    
    # Write API key to file for backend to read
    echo -n "$CURRENT_API_KEY" > "$API_KEY_FILE"
    
    # Write config.json for Angular frontend (matches startRbsjServer.bat behavior)
    cat > "$CONFIG_JSON_FILE" << EOF
{
  "apiKey": "$CURRENT_API_KEY"
}
EOF
    
    echo "API key configured for both backend and frontend"
}

# -----------------------------------------------------------------------------
# Main: Route based on first argument
# -----------------------------------------------------------------------------
if [ "$1" = "reportburster.sh" ]; then
    # CLI mode: run reportburster.sh with remaining arguments
    shift
    exec ./reportburster.sh "$@"
else
    # Server mode: start the Spring Boot server
    echo "Starting ReportBurster Server..."
    
    # Setup API key authentication
    setup_api_key
    
    # Export environment variables
    export PORTABLE_EXECUTABLE_DIR_PATH
    export FRONTEND_PATH
    export POLLING_PATH
    export SERVE_WEB=true
    
    # Mark that we're running inside Docker - used by Java code to adjust hostnames
    # for connecting to sibling containers via host.docker.internal
    export RUNNING_IN_DOCKER=true
    
    # Clean up temp files (like Windows bat does)
    find /app/temp -type f ! -name "*progress*" -delete 2>/dev/null || true
    
    # Start the Spring Boot server
    exec java \
        -Dserver.port=$SERVER_PORT \
        -DPORTABLE_EXECUTABLE_DIR=$PORTABLE_EXECUTABLE_DIR_PATH \
        -DUID=$SERVER_PORT \
        -DAPI_KEY="$CURRENT_API_KEY" \
        -Dspring.resources.add-mappings=true \
        -Dspring.web.resources.static-locations=file:///$FRONTEND_PATH \
        -Dspring.mvc.static-path-pattern="/**" \
        -DPOLLING_PATH=$POLLING_PATH \
        -jar /app/lib/server/rb-server.jar
fi
ENTRYPOINT_EOF

# Make entrypoint executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create required directories
RUN mkdir -p /app/temp /app/logs /app/poll /app/output /app/quarantine /app/backup

# Expose port
EXPOSE 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:9090/api/jobman/system/version || exit 1

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

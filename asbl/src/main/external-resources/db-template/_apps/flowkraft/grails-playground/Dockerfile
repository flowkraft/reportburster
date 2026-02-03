# FlowKraft Unified App - Grails 7 Application
# Multi-stage build for smaller final image

# ===== Stage 1: Build =====
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Install Gradle (matching wrapper version)
RUN apk add --no-cache curl unzip && \
    curl -L https://services.gradle.org/distributions/gradle-8.14.3-bin.zip -o gradle.zip && \
    unzip gradle.zip && \
    mv gradle-8.14.3 /opt/gradle && \
    rm gradle.zip

ENV PATH="/opt/gradle/bin:${PATH}"

# Copy build files first for better caching
COPY build.gradle settings.gradle gradle.properties ./
COPY gradle ./gradle

# Download dependencies (cached layer)
RUN gradle dependencies --no-daemon || true

# Copy source code
COPY grails-app ./grails-app
COPY src ./src

# Build the application and prepare the executable WAR
RUN gradle assemble --no-daemon && \
    find /build/build/libs -name "*.war" ! -name "*-plain.war" -exec cp {} /build/build/libs/app.war \;

# ===== Stage 2: Runtime =====
FROM eclipse-temurin:21-jre-alpine

LABEL maintainer="FlowKraft Team"
LABEL description="FlowKraft Unified Admin + Portal Application"
LABEL version="1.0.0"

# Create non-root user for security
RUN addgroup -g 1000 flowkraft && \
    adduser -u 1000 -G flowkraft -s /bin/sh -D flowkraft

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy the built WAR from builder stage
COPY --from=builder /build/build/libs/app.war app.war

# Create directories for data and logs
RUN mkdir -p /app/data /app/logs && \
    chown -R flowkraft:flowkraft /app

# Switch to non-root user
USER flowkraft

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM options for container environment
ENV JAVA_OPTS="-Xmx512m -Xms256m \
    -XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -Djava.security.egd=file:/dev/./urandom"

# Run the application
ENTRYPOINT ["java", "-jar", "app.war"]

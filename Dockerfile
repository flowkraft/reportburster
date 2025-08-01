# Start with a base image containing Java runtime and Maven
FROM maven:3.9.6-eclipse-temurin-11-alpine as build

# Install Node.js
RUN apk add --update nodejs npm

# Set the working directory in the container to /app
WORKDIR /app

# Copy the pom.xml files and source code of the modules that are dependencies for other modules
COPY ./xtra-tools/build/common-scripts/maven/pom.xml ./xtra-tools/build/common-scripts/maven/pom.xml

COPY ./pom.xml ./pom.xml

COPY ./backend/common/pom.xml ./backend/common/pom.xml
COPY ./backend/common/src ./backend/common/src

# Copy the pom.xml files and source code of the modules that are dependencies for other modules
COPY ./backend/update/pom.xml ./backend/update/pom.xml
COPY ./backend/update/src ./backend/update/src

# Copy the pom.xml files of the dependent modules
COPY ./backend/reporting/pom.xml ./backend/reporting/pom.xml
COPY ./backend/reporting/src ./backend/reporting/src

# Copy the source code of the dependent modules
COPY ./backend/server/pom.xml ./backend/server/pom.xml
COPY ./backend/server/src ./backend/server/src

COPY ./backend/server/src ./backend/server/src

# Install on the local maven repository either
# 1. jars which are not available on public maven repositories or
# 2. jars which are old on the public maven repositories
COPY ./xtra-tools/build/common-scripts/maven/lib-repository/burst/pherialize-1.2.1.jar /tmp/

RUN mvn install:install-file -Dfile=/tmp/pherialize-1.2.1.jar -DgroupId=de.ailis.pherialize -DartifactId=pherialize -Dversion=1.2.1 -Dpackaging=jar -P docker && \
    rm /tmp/pherialize-1.2.1.jar

# Build and install the modules that are dependencies for other modules

RUN mvn clean install -DskipTests -P docker
# RUN mvn clean install -DskipTests -P docker -pl backend/common -am
# RUN mvn clean install -DskipTests -P docker -pl backend/update -am

# List the contents of the directory where the rb-common-maven-configuration:pom:1 artifact should be stored
# RUN ls -la /root/.m2/repository/com/sourcekraft/documentburster

# Download dependencies of the dependent modules
# RUN mvn dependency:go-offline -B -P docker -pl backend/reporting,backend/server -X

# Build the dependent modules
# RUN mvn clean install -DskipTests -P docker -pl backend/reporting,backend/server

#RUN mvn -pl backend/reporting dependency:copy-dependencies -P docker -X
RUN mvn dependency:copy-dependencies -P docker -X

# List the contents of the target/dependencies directory
# RUN ls -la /app/backend/reporting/target/dependencies/

# Start a new stage to build the frontend
FROM build as frontend

# Set the working directory in the container to /app/frend
WORKDIR /app/frend

# Copy the package.json and package-lock.json
COPY ./frontend/reporting/package*.json ./

# Install Angular CLI and the application's dependencies
RUN npm install -g @angular/cli && npm install --force

# Copy the rest of your application to the working directory
COPY ./frontend/reporting .

# Build the application using the custom:release-web script
RUN npm run custom:release-web && npm prune --production --force

# Start a new stage for the final image
FROM eclipse-temurin:11-jre-alpine

# Install curl and Docker CLI
RUN apk --no-cache add \
    curl \
    docker-cli

# Set the working directory
WORKDIR /app

# Copy the "templated" folder structure
COPY ./asbl/src/main/external-resources/db-template/ ./
COPY ./asbl/src/main/external-resources/db-server-template/ ./
COPY ./backend/reporting/src/main/external-resources/template/ ./

RUN cp /app/config/burst/settings.xml /app/config/_defaults/settings.xml && \
    cp /app/config/burst/settings.xml /app/config/samples/split-only/settings.xml && \
    cp /app/config/burst/settings.xml /app/config/samples/split-two-times-split-only/settings.xml && \
    sed -i 's|<reportdistribution>true</reportdistribution>|<reportdistribution>false</reportdistribution>|g' /app/config/samples/split-two-times-split-only/settings.xml && \
    sed -i 's|<split2ndtime>false</split2ndtime>|<split2ndtime>true</split2ndtime>|g' /app/config/samples/split-two-times-split-only/settings.xml && \
    sed -i 's|<host>localhost</host>|<host>mailhog</host>|g' /app/config/burst/settings.xml && \
    sed -i 's|<weburl>http://localhost:8025</weburl>|<weburl>http://mailhog:8025</weburl>|g' /app/config/burst/settings.xml && \
    cp /app/config/_internal/license.xml /app/config/_defaults/license.xml

# Copy the frontend build output from the frontend stage
COPY --from=frontend /app/frend/dist /app/lib/frend

# Copy the jar file from the build stage
COPY --from=build /app/backend/reporting/target/dependencies /app/lib/burst

COPY --from=build /app/backend/reporting/target/rb-reporting.jar /app/lib/burst/rb-reporting.jar

COPY --from=build /app/backend/server/target/rb-server.jar /app/lib/server/rb-server.jar

# Generate the reportburster.sh script
RUN echo '#!/bin/sh' > ./reportburster.sh && \
    echo 'java -DDOCUMENTBURSTER_HOME="$(pwd)" -cp lib/burst/ant-launcher*.jar org.apache.tools.ant.launch.Launcher -buildfile config/_internal/documentburster.xml -Darg1="$1" -Darg2="$2" -Darg3="$3" -Darg4="$4" -Darg5="$5" -Darg6="$6" -Darg7="$7" -emacs > logs/documentburster.bat.log' >> ./reportburster.sh && \
    chmod +x ./reportburster.sh

# Generate the startTestEmailServer.bat script
RUN echo '#!/bin/sh' > ./tools/test-email-server/startTestEmailServer.sh && \
    echo 'docker start mailhog' >> ./tools/test-email-server/startTestEmailServer.sh && \
    chmod +x ./tools/test-email-server/startTestEmailServer.sh

# Generate the shutTestEmailServer.sh script
RUN echo '#!/bin/sh' > ./tools/test-email-server/shutTestEmailServer.sh && \
    echo 'docker stop mailhog' >> ./tools/test-email-server/shutTestEmailServer.sh && \
    chmod +x ./tools/test-email-server/shutTestEmailServer.sh

# RUN ls -la /app
# RUN ls -la /app/lib/frend
# RUN ls -la /app/lib/burst
# RUN ls -la /app/lib/server
# Run the jar file

# Generate the docker-entrypoint.sh script
RUN echo '#!/bin/sh' > /usr/local/bin/docker-entrypoint.sh && \
    echo 'if [ "$1" = "reportburster.sh" ]; then' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    shift' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    exec ./reportburster.sh "$@"' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'else' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    export PORTABLE_EXECUTABLE_DIR_PATH=/app' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    export FRONTEND_PATH=/app/lib/frend' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    export POLLING_PATH=/app/poll' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '    exec java -Dserver.port=9090 -DPORTABLE_EXECUTABLE_DIR=$PORTABLE_EXECUTABLE_DIR_PATH -DUID=9090 -Dspring.resources.static-locations=file:///$FRONTEND_PATH -DPOLLING_PATH=$POLLING_PATH -jar /app/lib/server/rb-server.jar -serve' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'fi' >> /usr/local/bin/docker-entrypoint.sh

# Print the contents of the file to check if it's created correctly
RUN cat /usr/local/bin/docker-entrypoint.sh

# Make the script executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set the ENTRYPOINT
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

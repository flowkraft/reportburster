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

RUN mvn install:install-file -Dfile=/tmp/pherialize-1.2.1.jar -DgroupId=de.ailis.pherialize -DartifactId=pherialize -Dversion=1.2.1 -Dpackaging=jar && \
    rm /tmp/pherialize-1.2.1.jar -P docker

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

# Start a new stage to build the frontend
FROM build as frontend

# Set the working directory in the container to /app/frontend
WORKDIR /app/frontend

# Copy the package.json and package-lock.json
COPY ./frontend/reporting/package*.json ./

# Install Angular CLI and the application's dependencies
RUN npm install -g @angular/cli && npm install

# Copy the rest of your application to the working directory
COPY ./frontend/reporting .

# Build the application using the custom:release-web script
RUN npm run custom:release-web

# Start a new stage for the final image
FROM eclipse-temurin:11-jre-alpine

# Install curl
RUN apk --no-cache add curl

# Set the working directory
WORKDIR /app

# Copy the jar file from the build stage
COPY --from=build /app/target/*.jar ./app.jar

# Copy the frontend build output from the frontend stage
COPY --from=frontend /app/frontend/dist ./static

COPY ./backend/reporting/src/main/external-resources/template .
COPY ./assembly/src/main/external-resources/db-template .
COPY ./assembly/src/main/external-resources/db-server-template .

RUN echo '#!/bin/sh' > ./reportburster.sh && \
    echo 'java -DDOCUMENTBURSTER_HOME="$(pwd)" -cp lib/burst/ant-launcher.jar org.apache.tools.ant.launch.Launcher -buildfile config/_internal/documentburster.xml -Darg1="$1" -Darg2="$2" -Darg3="$3" -Darg4="$4" -Darg5="$5" -Darg6="$6" -Darg7="$7" -emacs > logs/documentburster.bat.log' >> ./reportburster.sh && \
    chmod +x ./reportburster.sh

# Set the necessary environment variables
ENV PORTABLE_EXECUTABLE_DIR_PATH=/app
ENV FRONTEND_PATH=/app/static
ENV POLLING_PATH=/app/poll
ENV ELECTRON_PID=

# Run the jar file 
CMD java -Dserver.port=9090 -DPORTABLE_EXECUTABLE_DIR=$PORTABLE_EXECUTABLE_DIR_PATH -DUID=9090 -Dspring.resources.static-locations=file:///$FRONTEND_PATH -DPOLLING_PATH=$POLLING_PATH -DELECTRON_PID=$ELECTRON_PID -jar app.jar -serve
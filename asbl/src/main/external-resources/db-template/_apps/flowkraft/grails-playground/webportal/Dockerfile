# Build stage
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy Gradle wrapper first (rarely changes - cached)
COPY ./_apps/flowkraft/grails-playground/webportal/gradlew ./_apps/flowkraft/grails-playground/webportal/gradlew.bat ./
COPY ./_apps/flowkraft/grails-playground/webportal/gradle/ gradle/
RUN chmod +x gradlew && ./gradlew --version

# Copy build files and download dependencies (cached unless build.gradle changes)
COPY ./_apps/flowkraft/grails-playground/webportal/build.gradle ./_apps/flowkraft/grails-playground/webportal/gradle.properties ./
RUN ./gradlew dependencies --no-daemon || true

# Copy source code (changes frequently)
COPY ./_apps/flowkraft/grails-playground/webportal/ .

# Build and prepare the executable WAR
RUN ./gradlew assemble --no-daemon && \
    find /app/build/libs -name "*.war" ! -name "*-plain.war" -exec cp {} /app/build/libs/app.war \;

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/build/libs/app.war app.war

COPY ./db /app/db
COPY ./config/_internal /app/config

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.war"]
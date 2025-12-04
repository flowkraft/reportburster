# Build stage
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy Gradle wrapper first (rarely changes - cached)
COPY gradlew gradlew.bat ./
COPY gradle/ gradle/
RUN chmod +x gradlew && ./gradlew --version

# Copy build files and download dependencies (cached unless build.gradle changes)
COPY build.gradle gradle.properties ./
RUN ./gradlew dependencies --no-daemon || true

# Copy source code (changes frequently)
COPY . .

# Build and prepare the executable WAR
RUN ./gradlew assemble --no-daemon && \
    find /app/build/libs -name "*.war" ! -name "*-plain.war" -exec cp {} /app/build/libs/app.war \;

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/app.war app.war
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.war"]
# Build stage (optional, if you build inside Docker)
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
RUN ./gradlew assemble --no-daemon

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
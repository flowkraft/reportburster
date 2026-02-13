# Build stage
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy Maven wrapper first and download Maven distribution (rarely changes)
COPY mvnw mvnw.cmd ./
COPY .mvn/ .mvn/
RUN ./mvnw --version

# Copy build files and download dependencies
COPY pom.xml ./
RUN ./mvnw dependency:go-offline -B || true

# Now copy the rest of the source code
COPY . .

# Build the application
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

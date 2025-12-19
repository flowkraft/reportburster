# Build stage
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy Maven wrapper first and download Maven distribution (rarely changes)
COPY ./_apps/flowkraft/bkend-boot-groovy-playground/mvnw ./_apps/flowkraft/bkend-boot-groovy-playground/mvnw.cmd ./
COPY ./_apps/flowkraft/bkend-boot-groovy-playground/.mvn/ .mvn/
RUN ./mvnw --version

# Copy build files and download dependencies
COPY ./_apps/flowkraft/bkend-boot-groovy-playground/pom.xml ./
RUN ./mvnw dependency:go-offline -B || true

# Now copy the rest of the source code
COPY ./_apps/flowkraft/bkend-boot-groovy-playground/ .

# Build the application
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

COPY ./db /app/db
COPY ./config/_internal /app/config

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
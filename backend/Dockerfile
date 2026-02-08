# Build stage
FROM --platform=linux/amd64 eclipse-temurin:17-jdk AS build

WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY src ./src

# Install Maven and build
RUN apt-get update && apt-get install -y maven && \
    mvn clean package -DskipTests

# Runtime stage
FROM --platform=linux/amd64 eclipse-temurin:17-jre

WORKDIR /app

# Copy the built JAR
COPY --from=build /app/target/*.jar app.jar

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

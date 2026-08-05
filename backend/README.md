# Investment Guidance Backend

## Prerequisites
- Java 21
- Maven
- PostgreSQL

## Configuration
Edit `src/main/resources/application.properties` to configure database and ML service URL:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/investment_guidance
spring.datasource.username=postgres
spring.datasource.password=your_password
```

## Run
```bash
mvn spring-boot:run
```

## API Documentation
Visit http://localhost:8081/swagger-ui.html after starting the backend.

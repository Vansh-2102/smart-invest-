# Investment Guidance Platform (FYP)

An AI-powered investment guidance platform comprising three microservices:
1. **Frontend**: React application built with Vite, Tailwind CSS, and NGINX proxy.
2. **Backend**: Spring Boot Java 21 REST API with JWT security and Supabase PostgreSQL integration.
3. **ML Service**: Python FastAPI application for AI recommendations, risk assessment, market analysis, and vector retrieval.

---

## 🚀 Running with Docker Compose (Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Quick Start

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd FYP
   ```

2. **Build and Start All Services**:
   ```bash
   docker compose up --build
   ```

3. **Access Services**:
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8081](http://localhost:8081)
   - **Backend Swagger UI**: [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
   - **ML Service API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

4. **Stop Services**:
   ```bash
   docker compose down
   ```

---

## 🛠️ Individual Service Setup (Local Development)

### 1. Backend (`/backend`)
- **Prerequisites**: Java 21 SDK, Maven.
- **Run**:
  ```bash
  cd backend
  ./mvnw spring-boot:run
  ```
- Application starts on port `8081`.

### 2. ML Service (`/ml`)
- **Prerequisites**: Python 3.10+
- **Run**:
  ```bash
  cd ml
  pip install -r requirements.txt
  uvicorn api.main:app --reload --port 8000
  ```
- Service runs on port `8000`.

### 3. Frontend (`/frontend`)
- **Prerequisites**: Node.js 18+
- **Run**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- App runs on port `3000`.

---

## 📦 Project Structure

```
.
├── backend/            # Spring Boot REST API
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
├── frontend/           # React + Vite UI
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── ml/                 # Python FastAPI AI/ML engine
│   ├── Dockerfile
│   ├── requirements.txt
│   └── api/
├── docker-compose.yml  # Multi-container orchestrator
└── README.md
```

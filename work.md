# InvestIQ — Complete Project Working & System Documentation

**Project Title:** InvestIQ: AI-Powered Smart Investment Guidance and Conversational Portfolio Advisory Platform  
**Repository:** [smart-invest-](https://github.com/Vansh-2102/smart-invest-.git)  
**Architecture:** 3-Tier Containerized Microservices (Frontend, Backend, ML/AI Microservice)  
**Primary Tech Stack:** React 19, Spring Boot 3, FastAPI, PostgreSQL (Supabase), XGBoost, Groq LLM, Docker

---

## 1. Executive Summary & Vision

**InvestIQ** is an end-to-end, algorithmic wealth management and financial advisory platform. The system bridges the gap between complex financial markets and everyday investors by leveraging Machine Learning (ML), Modern Portfolio Theory (MPT), and Retrieval-Augmented Generation (RAG). 

Unlike traditional static platforms that offer generic advice or fixed portfolio splits, InvestIQ:
1. Dynamically assesses individual investor psychology and risk tolerance using an **XGBoost Classifier (89.3% accuracy)**.
2. Formulates custom, multi-asset allocation strategies optimized via **Modern Portfolio Theory (MPT)** across 5 asset classes (Equities, Mutual Funds, Fixed Deposits, Government Bonds, and Gold).
3. Provides quantitative technical analysis (RSI, MACD, Moving Averages) and news sentiment classification (FinBERT / DistilRoBERTa).
4. Features an AI-powered conversational financial advisor with **ChatGPT/Gemini-style word-by-word typewriter streaming** and seamless profile context injection.

---

## 2. System Architecture & Component Interactions

The platform is designed around a decoupled, 3-tier microservices architecture orchestrated via Docker Compose:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT TIER (PORT 3000)                                 │
│      React 19 + Vite + Tailwind CSS + Chart.js + Lucide Icons (Served via Nginx)       │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ REST API Calls (JWT / JSON)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION TIER (PORT 8081)                              │
│       Spring Boot 3 (Java 21) REST Core API + Spring Security + Spring Data JPA        │
└─────────────────────┬───────────────────────────────────────────────────┬──────────────┘
                      │                                                   │
                      │ JDBC Connection                                   │ HTTP Proxy REST
                      ▼                                                   ▼
┌──────────────────────────────────────────┐    ┌────────────────────────────────────────┐
│              DATABASE TIER               │    │             ML & AI ENGINE             │
│         Supabase PostgreSQL (AWS)        │    │         FastAPI (Python 3.11)          │
│   Users, Profiles, Portfolios, History   │    │  XGBoost, MPT Engine, Groq LLM RAG     │
└──────────────────────────────────────────┘    └────────────────────────────────────────┘
```

### Microservice Breakdown:
1. **Frontend Service (`/frontend` — Port 3000):**
   * Built on **React 19**, **Vite**, and **Tailwind CSS**.
   * Responsive modern UI supporting real-time **Dark Mode** and **Light Mode** styling overrides.
   * Interactive Notification Center with unread badges and routing.
   * Word-by-word streaming typewriter animation (`▊`) with native Markdown table rendering.
   * Production multi-stage Docker build served via **Nginx reverse proxy**.

2. **Backend Service (`/backend` — Port 8081):**
   * Built on **Spring Boot 3** and **Java 21**.
   * Implements **JWT (JSON Web Token)** stateless authentication and role-based access control.
   * Manages user profiles, financial survey responses, and portfolio persistence via **Spring Data JPA**.
   * Proxies analytical and prediction requests to the Python ML microservice via `RestTemplate`.
   * Secure credential segregation via `.env` and `application.properties.example`.

3. **Machine Learning Microservice (`/ml` — Port 8000):**
   * Built on **FastAPI** and **Uvicorn** (Python 3.11).
   * Houses the risk classification pipeline, portfolio allocation engine, technical analysis indicators, news sentiment transformer, and RAG chatbot.
   * Optimized Docker image using **PyTorch CPU-only wheels**, cutting image build size by **~90%** (saving ~3.5 GB of CUDA packages).

---

## 3. End-to-End User Journey & Platform Workflow

The platform guides a user through a structured 7-step algorithmic pipeline:

```
Step 1: User Signup & Authentication (JWT Secure Session)
   │
   ▼
Step 2: Financial Profile Questionnaire (Age, Income, Goals, Horizon, Debt)
   │
   ▼
Step 3: ML Risk Classification (XGBoost computes Risk Tier & Confidence %)
   │
   ▼
Step 4: MPT Portfolio Recommendation (Asset split across FD, Bonds, MF, Stocks, Gold)
   │
   ▼
Step 5: Interactive Asset Exploration ("What is this & How it works" modal)
   │
   ▼
Step 6: "Ask AI" Context Handoff (Profile + Asset details injected into Chatbot)
   │
   ▼
Step 7: Macro Market Tracking & News Sentiment (Live Indices, RSI/MACD, Sentiment)
```

### Detailed Step Walkthrough:

### Step 1: User Registration & Authentication
* Users register with name, email, and password.
* Spring Boot generates a secure 256-bit HMAC SHA-256 JWT token with 24-hour expiration (`jwt.expiration=86400000`).
* All subsequent API calls pass the token in the `Authorization: Bearer <token>` header.

### Step 2: Financial Profiling
* The user completes an interactive 7-point financial survey:
  1. **Age:** Numerical integer (18 to 75).
  2. **Annual Income:** Supports any range (e.g., ₹50,000 to ₹10,00,000+).
  3. **Investment Experience:** Beginner, Intermediate, Advanced, Expert.
  4. **Stated Risk Tolerance:** Conservative, Moderate, Aggressive.
  5. **Investment Goal:** Wealth Growth, Retirement, Education, Home Purchase, Emergency Fund, Tax Saving.
  6. **Time Horizon:** Number of years (1 to 30 years).
  7. **Debt-to-Income (DTI) Ratio:** Monthly debt obligations divided by gross monthly income (0.05 to 1.0).

### Step 3: Machine Learning Risk Assessment
* Frontend posts survey data to `/api/v1/risk/predict`.
* The ML engine applies **log-transformation** to income ($x_{\text{scaled}} = \ln(1 + \text{income})$) to prevent high-income skew.
* The **XGBoost Classifier** predicts the user's true risk category (`Conservative`, `Moderate`, or `Aggressive`) with exact probability distribution (e.g., 82% Moderate, 14% Conservative, 4% Aggressive).
* Prevents psychological bias where users claim to be aggressive but have high debt and 1-year horizons.

### Step 4: Multi-Asset Recommendation Engine (MPT)
* Based on the predicted risk tier and total investment capital, the recommendation engine calculates:
  * **Asset Category Allocation Percentage:**
    * *Conservative:* 40% Banking FDs, 30% Bonds, 15% Mutual Funds, 10% Gold, 5% Equities.
    * *Moderate:* 25% Mutual Funds, 25% Equities, 20% Bonds, 20% Banking FDs, 10% Gold.
    * *Aggressive:* 40% Equities, 30% Mutual Funds, 15% Gold, 10% Bonds, 5% Banking FDs.
  * **Exact Rupee Split:**
    $$\text{Allocation (₹)} = \text{Total Capital} \times \left( \frac{\text{Allocation \%}}{100} \right)$$
  * **1-Year Projected Profit:**
    $$\text{Projected Profit (₹)} = \text{Allocation (₹)} \times \left( \frac{\text{Expected Return \%}}{100} \right)$$
  * **Weighted Annual Return (CAGR):**
    $$\text{Overall Expected Return \%} = \frac{\sum \text{Projected Profit}}{\text{Total Capital}} \times 100$$

### Step 5: Interactive Asset Modal
* In `Recommendations.jsx`, each asset card contains a **"What is this & How it works"** button.
* Clicking opens a modal detailing:
  * Full asset profile, risk level, and historical return.
  * Plain-English explanation of compounding mechanics.
  * Investment safety rationale (e.g., DICGC insurance on bank deposits, sovereign backing for RBI bonds).

### Step 6: "Ask AI" Context Handoff & Word Streaming
* Clicking **"Ask AI"** on any recommendation card or modal triggers an automated handoff:
  1. The existing conversation history in `AIChatbot.jsx` is cleared.
  2. A structured financial context prompt is constructed:
     * User's age, income, investment goal, risk score, and capital.
     * Selected instrument details (name, ticker, category, ₹ allocation, expected return, projected profit).
  3. The chatbot initiates **word-by-word typewriter streaming** (~20ms per token) with an animated blinking cursor (`▊`).
  4. Returns a professional markdown analysis with formatted HTML comparison tables.

### Step 7: Market Dashboard & Real-Time Monitoring
* **Macro Indices:** Tracks live prices for Indian benchmarks (NIFTY 50, SENSEX, Bank NIFTY, NIFTY Midcap) and US benchmarks (S&P 500, NASDAQ, Dow Jones).
* **Sector Performance:** Real-time percentage heatmap of 12 sectors (IT, Banking, Energy, FMCG, Auto, Metal, Pharma, etc.).
* **Market Breadth:** Advances, Declines, A/D Ratio, 52-Week Highs/Lows, and Delivery percentage.
* **Asset Tracking Pages:** Dedicated dashboards for Stocks, Mutual Funds, Banking FDs, Gold (SGB/ETFs), and Cryptocurrencies.
* **News Sentiment:** Scrapes live financial headlines and classifies market sentiment into Positive, Neutral, or Negative using a transformer model.

---

## 4. Key Engineering Milestones & Fixes Completed

| Area | Challenge / Bug Encountered | Technical Solution Implemented |
| :--- | :--- | :--- |
| **ML Inference** | Label Inversion: Conservative users were classified as "Aggressive" due to alphabetical sorting in `LabelEncoder`. | Replaced implicit indices with explicit class mapping (`0: aggressive, 1: conservative, 2: moderate`). Retrained XGBoost on 5,000 stratified samples. |
| **Data Scaling** | High-income users (₹1 Crore+) distorted standard scaler distributions. | Applied log-transformation: $x_{\text{scaled}} = \ln(1 + \text{income})$ prior to standard scaling. |
| **Recommendations** | Recommendations previously showed static 16.67% equal splits across mock assets. | Rebuilt engine with dynamic Modern Portfolio Theory (MPT) logic across 5 real asset classes with exact ₹ profit formulas. |
| **Docker Build** | Building ML image took 20+ minutes and downloaded ~3.5 GB CUDA PyTorch package. | Configured `ml/Dockerfile` with `--extra-index-url https://download.pytorch.org/whl/cpu` to install CPU-only PyTorch, cutting build time by 90%. |
| **Chatbot UX** | Chatbot previously had cold loading spinners and lacked context from recommendations. | Implemented word-by-word streaming typewriter animation, auto-scroll, clear chat button, and automated financial context injection. |
| **Navbar UI** | Theme toggle (Sun/Moon) and Notification Bell were static and non-interactive. | Added complete Light Mode stylesheet rules in `index.css` and interactive notifications popover with read/clear actions. |
| **Security** | Raw database passwords and Supabase secret keys were exposed in `application.properties`. | Replaced secrets with environment variable placeholders `${...}`, added `.env` to `.gitignore`, and committed safe `.example` templates. |

---

## 5. Technology Stack Reference

| Tier | Component | Technology / Library | Version |
| :--- | :--- | :--- | :--- |
| **Frontend** | Framework | React | 19.2.7 |
| | Build Tool | Vite | 8.1.4 |
| | Styling | Tailwind CSS | 3.4.19 |
| | Charts | Chart.js & React-Chartjs-2 | 4.5.1 / 5.3.1 |
| | Icons | Lucide React | 1.24.0 |
| | HTTP Client | Axios | 1.18.1 |
| | Production Server | Nginx Alpine | 1.25+ |
| **Backend** | Framework | Spring Boot | 3.3.x |
| | Runtime | Java JDK | 21 (LTS) |
| | Database | PostgreSQL (Supabase) | 15.x |
| | Security | Spring Security + JJWT | 0.11.5 |
| | Documentation | SpringDoc OpenAPI / Swagger | 2.5.0 |
| **ML / AI** | API Framework | FastAPI + Uvicorn | 0.110+ |
| | Core Language | Python | 3.11 |
| | Machine Learning | XGBoost & Scikit-learn | 2.0.3 / 1.4.1 |
| | Deep Learning | PyTorch (CPU) | 2.2.0+cpu |
| | NLP Transformers | HuggingFace Transformers | 4.38.0 |
| | LLM Orchestration | LangChain & ChatGroq | 0.1.12 |
| | LLM Engine | Groq LPU (Llama 3.3 70B / GPT-OSS 120B) | Cloud API |
| | Market Data | yfinance & Requests | 0.2.36 |
| **DevOps** | Containerization | Docker & Docker Compose | Compose v2 |

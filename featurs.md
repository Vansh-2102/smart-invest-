# InvestIQ — Comprehensive Project Features & System Catalog

**Project Name:** InvestIQ: AI-Powered Smart Investment Guidance and Conversational Portfolio Advisory Platform  
**Repository:** [smart-invest-](https://github.com/Vansh-2102/smart-invest-.git)  
**Architecture:** 3-Tier Containerized Microservices (`Frontend`, `Backend`, `ML/AI Microservice`)  
**Core Technologies:** React 19, Spring Boot 3 (Java 21), FastAPI (Python 3.11), PostgreSQL (Supabase), XGBoost, Groq LLM (Llama 3), Docker  

---

## Table of Contents
1. [Platform Overview & Executive Summary](#1-platform-overview--executive-summary)
2. [User Authentication & Security Module](#2-user-authentication--security-module)
3. [Investor Profiling & Financial Assessment](#3-investor-profiling--financial-assessment)
4. [Machine Learning Risk Assessment Engine](#4-machine-learning-risk-assessment-engine)
5. [Multi-Asset Portfolio Recommendation Engine (MPT)](#5-multi-asset-portfolio-recommendation-engine-mpt)
6. [Banking & Fixed Income Module](#6-banking--fixed-income-module)
7. [Gold & Precious Metals Advisory Module](#7-gold--precious-metals-advisory-module)
8. [Cryptocurrency & Virtual Digital Assets (VDA) Module](#8-cryptocurrency--virtual-digital-assets-vda-module)
9. [Stocks & Equities Technical Screener](#9-stocks--equities-technical-screener)
10. [Mutual Funds & AMFI Discovery Engine](#10-mutual-funds--amfi-discovery-engine)
11. [Market Dashboard & Macroeconomic Heatmaps](#11-market-dashboard--macroeconomic-heatmaps)
12. [Financial News Sentiment Analysis (NLP Engine)](#12-financial-news-sentiment-analysis-nlp-engine)
13. [AI Financial Advisor & Conversational Chatbot](#13-ai-financial-advisor--conversational-chatbot)
14. [Notification, Alert & Monitoring Center](#14-notification-alert--monitoring-center)
15. [Central Executive Dashboard](#15-central-executive-dashboard)
16. [DevOps, Architecture & Infrastructure Matrix](#16-devops-architecture--infrastructure-matrix)

---

## 1. Platform Overview & Executive Summary

**InvestIQ** is an end-to-end, algorithmic wealth management and intelligent financial advisory ecosystem designed to democratize institutional-grade financial guidance for retail investors.

### Key Value Propositions
* **Dynamic Intelligence vs. Static Rules:** Unlike traditional platforms that use static questionnaires and one-size-fits-all asset splits, InvestIQ continuously links individual investor psychology, empirical risk models (XGBoost), quantitative portfolio optimization (Modern Portfolio Theory), and live market feeds.
* **Context-Aware Advisory:** The AI chatbot does not give generic textbook answers; it automatically ingests the user's financial profile (income, debts, risk appetite, horizon) to provide tailored guidance.
* **Unified Multi-Asset Coverage:** Integrates 5 major asset classes—Direct Equities, Mutual Funds, Fixed Deposits/Bonds, Gold (SGB/ETF/Physical), and Cryptocurrencies—all with Indian regulatory and taxation considerations (Post-Budget 2024 LTCG/STCG, Section 115BBH VDA tax, RBI DICGC rules).

---

## 2. User Authentication & Security Module

**Routes:** `/login`, `/register`, `/profile`, `/settings`  
**Components:** `AuthContext.jsx`, `Login.jsx`, `Register.jsx`, `UserProfile.jsx`, `Settings.jsx`  
**Backend:** `AuthController.java`, `AuthService.java`, `JwtTokenProvider.java`, `SecurityConfig.java`

* **JWT Stateless Authentication:** Generates cryptographically signed HMAC-SHA256 Bearer tokens valid for secure session management.
* **Password Hashing:** Utilizes BCrypt with high-entropy salt generation to prevent rainbow-table and brute-force attacks.
* **Role-Based Access Control (RBAC):** Supports granular roles (`ROLE_USER`, `ROLE_ADMIN`) governing endpoint accessibility.
* **Protected Client Routing:** React Router `ProtectedRoute` wrappers intercept unauthenticated navigation and preserve target redirection paths.
* **Theme & Security Customization:** Includes system-wide Dark / Light mode toggle persisted via `ThemeContext` and local storage, alongside password change and security setting management.

---

## 3. Investor Profiling & Financial Assessment

**Route:** `/financial-profile`  
**Components:** `FinancialProfileForm.jsx`, `useFinancialProfile.js`  
**Backend:** `FinancialProfileController.java`, `FinancialProfileService.java`, `FinancialProfile.java`

An interactive 3-step wizard capturing quantitative and psychological attributes:

1. **Step 1: Personal & Demographic Information**
   * Age (minimum 18 validation)
   * Employment category and income frequency
2. **Step 2: Financial Metrics & Health Check**
   * Annual Income (₹)
   * Monthly Expenses & Monthly Net Savings
   * Existing Liquid Investments & Cash Reserves
   * Total Outstanding Liabilities / Debt
   * **Automated Debt-to-Income (DTI) Ratio Calculation:** Flags high debt burden if DTI > 40%.
3. **Step 3: Investment Objectives & Time Horizon**
   * **Primary Goal Selection:** Wealth Accumulation, Retirement Planning, Child Education, Emergency Fund, Home Purchase, Capital Preservation.
   * **Investment Horizon:** Short-term (< 3 years), Medium-term (3–7 years), Long-term (7–15+ years).
   * **Self-Reported Risk Tolerance:** Low, Medium, High, Aggressive.
4. **Data Persistence & State Synchronization:** Automatically persists data to Supabase PostgreSQL and pushes updates to the ML Microservice for instant model recalibration.

---

## 4. Machine Learning Risk Assessment Engine

**Route:** `/risk-assessment`  
**Components:** `RiskAssessment.jsx`, `RiskGauge.jsx`, `Badge.jsx`  
**ML Engine:** `ml/src/risk_assessment/` (`model.py`, `train.py`, `risk_assessment_model.joblib`)

* **Model Architecture:** **XGBoost (Extreme Gradient Boosting) Classifier** trained on high-dimensional investor behavioral data.
* **Classification Accuracy:** **89.3% validation accuracy** with multi-class log-loss optimization.
* **Investor Classifications:**
  * **Low / Conservative:** Capital preservation priority, low tolerance for drawdowns. Recommended: FDs, Sovereign Gold Bonds, Liquid Debt Funds.
  * **Medium / Moderate (Balanced):** Balances growth and capital protection. Recommended: Blue-Chip Equities, Large-Cap Index Funds, Hybrid Funds, Corporate Bonds.
  * **High / Growth:** Capital appreciation priority, comfortable with market cycles. Recommended: Mid-Cap Funds, Flexi-Cap Funds, Direct Equities.
  * **Very High / Aggressive:** High-alpha seeker with multi-year horizon. Recommended: Small-Cap Funds, Direct Equities, Sectoral Themes, Crypto (< 5%).
* **Feature Importance & Scoring Breakdown:**
  * Age Factor: **25%**
  * Stated Risk Appetite: **20%**
  * Investment Experience: **20%**
  * Investment Time Horizon: **20%**
  * Debt-to-Income & Free Cashflow: **15%**
* **Visual Risk Meter:** Dynamic animated SVG gauge with color gradient (Emerald $\rightarrow$ Yellow $\rightarrow$ Orange $\rightarrow$ Red) displaying calculated risk score and model confidence level.

---

## 5. Multi-Asset Portfolio Recommendation Engine (MPT)

**Route:** `/recommendations`  
**Components:** `Recommendations.jsx`, `AllocationChart.jsx`, `useRecommendations.js`  
**ML / Optimization Engine:** `ml/src/investment_recommendation/optimizer.py`, `recommendation_engine.py`  
**Backend:** `RecommendationController.java`, `RecommendationService.java`

* **Modern Portfolio Theory (MPT) Optimization:** Solves for the Markowitz Efficient Frontier to maximize Sharpe Ratio for a given risk tolerance while minimizing portfolio variance.
* **Dynamic Capital Allocation:** Users input any target investment amount (e.g., ₹1,00,000 to ₹1,00,00,000+), and the engine outputs exact rupee allocation per asset.
* **5 Target Asset Classes:**
  1. **Direct Equities / Stocks:** Blue-chip and high-growth stocks.
  2. **Mutual Funds:** Index funds, Large/Mid/Small cap funds, ELSS.
  3. **Banking & Fixed Income:** High-yield Fixed Deposits and Recurring Deposits.
  4. **Precious Metals:** Gold ETFs and Sovereign Gold Bonds (SGB).
  5. **Government Bonds:** Long-dated sovereign and state development loans (SDLs).
* **Interactive Donut & Distribution Charts:** Visual representation of portfolio weightings.
* **Detailed Asset Breakdown Modals:** Inspect expected CAGR, historical volatility, lock-in period, risk rating, liquidity status, and taxation impact for each recommendation.
* **"Ask AI" Bridge:** Seamless one-click button next to each asset to query the AI chatbot with exact allocation numbers pre-filled.

---

## 6. Banking & Fixed Income Module

**Route:** `/banking`  
**Components:** `BankingModule.jsx`, `useMarket.js`  
**Data Sources:** RBI Banking Rate benchmarks, Bank APIs, Static Verified Tables

* **Interactive FD Compound Interest Calculator:**
  * Calculates quarterly compounding maturity amounts: $A = P \times (1 + r/4)^{4n}$
  * Displays Total Interest Earned, Maturity Amount, and Effective Annual Yield.
  * One-click "Ask AI" integration to simulate tax-adjusted returns based on income slabs.
* **Comprehensive Bank FD Comparison Table:**
  * Compares leading Public, Private, and Small Finance Banks: SBI, HDFC Bank, ICICI Bank, Kotak Mahindra Bank, Axis Bank, Bank of Baroda, Unity Small Finance Bank, Suryoday Bank.
  * Displays Regular vs. **Senior Citizen Extra Rates** (+0.50% to +0.75% premium).
  * Direct tenure matching (1 Year, 3 Years, 5 Years).
* **Government Small Savings Schemes Analysis:**
  * **Public Provident Fund (PPF):** 7.1% interest, 15-year tenure, triple tax-exempt (EEE under Section 80C).
  * **Sukanya Samriddhi Yojana (SSY):** 8.2% guaranteed return for girl child education.
  * **Senior Citizen Savings Scheme (SCSS):** 8.2% quarterly paid interest for retirees.
  * **National Savings Certificate (NSC):** 7.7% return with Section 80C tax deduction.
  * **Post Office Monthly Income Scheme (POMIS):** 7.4% monthly cashflow payout.
* **Regulatory & Tax Safeguards:**
  * Details **RBI DICGC Insurance** covering up to ₹5,00,000 per depositor per bank (principal + interest).
  * Outlines TDS thresholds: ₹40,000 for regular depositors and ₹50,000 for senior citizens (Section 80TTB).
  * Explains Section 80C 5-Year Tax Saver Fixed Deposit rules.

---

## 7. Gold & Precious Metals Advisory Module

**Route:** `/gold`  
**Components:** `Gold.jsx`, `PerformanceChart.jsx`, `useMarket.js`

* **Live Market Tickers:** Real-time 24K (99.9% purity) and 22K (91.6% purity) spot gold prices in ₹/10 grams with 24-hour change tracking.
* **Historical Performance Charts:** Interactive timeframe chart (1M, 6M, 1Y, 5Y, All) showing gold price trajectory and inflation correlation.
* **4-Way Investment Mechanism Comparison:**
  1. **Physical Gold (Jewelry, Coins, Bars):** Cultural appeal and tangible security vs. 3% GST, 8–25% making charges, and storage risk.
  2. **Gold ETFs (Exchange Traded Funds):** Traded on NSE/BSE, 99.5% purity backed, 0.4–0.8% expense ratio, high liquidity, 12.5% LTCG after 12 months.
  3. **Sovereign Gold Bonds (SGB):** Issued by RBI, guaranteed 2.50% annual coupon paid semi-annually, **100% tax-free capital gains** upon 8-year maturity.
  4. **Digital Gold (Fintech / MMTC-PAMP / Augmont):** Micro-investments from ₹1 via UPI, but subject to 3% GST, 3–5% spread, and lacks statutory SEBI regulation.
* **Portfolio Allocation Guidelines:** Explains the strategic 5–10% gold rule as a non-correlated hedge against equity drawdowns and currency depreciation.
* **Macroeconomic Quick Prompts:** Pre-configured AI prompt chips analyzing central bank gold reserves, global inflation, and rupee depreciation.

---

## 8. Cryptocurrency & Virtual Digital Assets (VDA) Module

**Route:** `/crypto`  
**Components:** `Crypto.jsx`, `PerformanceChart.jsx`, `useMarket.js`, `marketApi.js`

* **Live Cryptocurrency Tickers:** Real-time tracking of top digital assets: Bitcoin (BTC), Ethereum (ETH), Solana (SOL), Binance Coin (BNB), Ripple (XRP), Dogecoin (DOGE), Cardano (ADA).
* **Metrics Tracked:** Live Price in INR / USD, 24h Change (%), 24h High/Low, Market Capitalization, 24h Trading Volume.
* **Interactive Price Charts:** Historical candle and line charts for technical movement evaluation.
* **Token Deep-Dive Modal:** Detailed breakdown of underlying blockchain architecture, consensus algorithm (Proof of Work vs. Proof of Stake), circulating vs. maximum supply, and all-time highs.
* **Indian Crypto Tax Compliance Guide:**
  * **Section 115BBH:** Flat 30% tax (+ 4% health & education cess = 31.2%) on all net profits.
  * **Strict Loss Prohibition:** No set-off or carry-forward of crypto losses against other crypto gains or business/salary income.
  * **Section 194S:** 1% TDS deducted on every transfer/sell transaction above statutory thresholds.
* **Risk & Custody Framework:**
  * Outlines the conservative **< 5% liquid wealth allocation rule**.
  * Compares self-custody cold storage hardware wallets (Ledger, Trezor) vs. custodial FIU-IND registered Indian exchanges vs. offshore platforms.

---

## 9. Stocks & Equities Technical Screener

**Route:** `/stocks`  
**Components:** `Stocks.jsx`, `PerformanceChart.jsx`, `marketApi.js`

* **Extensive Ticker Coverage:**
  * **Indian Equities (NSE/BSE):** Reliance Industries, TCS, HDFC Bank, Infosys, ICICI Bank, State Bank of India, ITC, Zomato, and more.
  * **Global Technology Giants:** Apple (AAPL), Microsoft (MSFT), Nvidia (NVDA), Tesla (TSLA).
* **Live Search & Dynamic Symbol Lookup:** Debounced auto-complete search retrieving market data on demand.
* **Sector-Wise Filtering:** Categorizes stocks into IT, Banking, Energy, Finance, Infrastructure, Auto, and Technology.
* **Sorting Capabilities:** Sort by Market Capitalization, Current Price, or Daily % Gain/Loss.
* **Technical & Fundamental Metrics:**
  * Price-to-Earnings (P/E) Ratio
  * 52-Week High and 52-Week Low
  * Trading Volume & Market Capitalization Tier (Large-Cap / Mid-Cap / Small-Cap)
  * Day High & Day Low
* **Interactive Charting:** Dynamic canvas charts with historical timeframe toggles.
* **"Analyze Stock with AI":** Sends ticker fundamentals to the AI financial advisor for immediate quantitative appraisal.

---

## 10. Mutual Funds & AMFI Discovery Engine

**Route:** `/mutual-funds`  
**Components:** `MutualFunds.jsx`, `PerformanceChart.jsx`, `marketApi.js`

* **AMFI Real-Time Fund Search:** Connects to Indian mutual fund databases to search across thousands of active direct and regular mutual fund schemes.
* **Comprehensive Category Spectrum:**
  * **Large Cap Funds:** Blue-chip market leaders (e.g., SBI Bluechip, ICICI Prudential Bluechip).
  * **Mid Cap & Small Cap Funds:** High-alpha compounders (e.g., Quant Small Cap, HDFC Mid Cap).
  * **Flexi Cap Funds:** Dynamic multi-cap allocation (e.g., Parag Parikh Flexi Cap).
  * **ELSS (Equity Linked Savings Scheme):** 3-year lock-in tax saving funds under Section 80C.
  * **Index Funds:** Low-cost market trackers (Nifty 50, Nifty Next 50).
  * **Debt & Hybrid Funds:** Capital preservation and balanced advantage funds.
* **Multi-Metric Sorting:** Sort by 1-Year, 3-Year, 5-Year CAGR returns, AUM (Assets Under Management), or Expense Ratio.
* **Fund Deep-Dive Modal:**
  * Current NAV (Net Asset Value)
  * Fund House / AMC (Asset Management Company)
  * Expense Ratio & Exit Load structure
  * SEBI Riskometer Rating (Moderate, High, Very High)
  * Benchmark Index comparison
* **AI Fund Evaluation:** Direct button to analyze scheme portfolio overlap, manager track record, and suitability for the user's risk profile.

---

## 11. Market Dashboard & Macroeconomic Heatmaps

**Route:** `/market`  
**Components:** `MarketDashboard.jsx`, `useMarket.js`

* **Flagship Benchmark Indices:**
  * **NIFTY 50 (NSE):** India's premier 50 blue-chip benchmark.
  * **SENSEX (BSE):** Historic 30 blue-chip market barometer.
  * **NIFTY Bank:** Banking sector bellwether (12 major private and public banks).
  * **NIFTY Midcap 100:** Emerging high-growth mid-sized companies.
  * **S&P 500 & NASDAQ 100:** Global benchmark indicators for tech and US equities.
* **Index Intelligence Modals:** Detailed summaries of constituent count, top heavyweights, free-float market cap methodology, and key macroeconomic drivers (RBI repo rate, FII/DII institutional flows, inflation).
* **Sectoral Heatmap:** Visual green/red performance matrix across IT, Banking, Pharma, Auto, FMCG, Energy, Metal, and Realty sectors.
* **Market Movers:** Real-time ranking of **Top Gainers** and **Top Losers** with traded volume.
* **Market Breadth & Volatility:** Advance/Decline ratio and India VIX (Volatility Index) tracking market fear/greed sentiment.

---

## 12. Financial News Sentiment Analysis (NLP Engine)

**Route:** `/news`  
**Components:** `NewsSentiment.jsx`, `useMarket.js`  
**ML Engine:** `ml/src/news_sentiment/` (FinBERT / DistilRoBERTa pipeline)

* **Real-Time News Aggregation:** Ingests live financial headlines from premier Indian and global business publications (Economic Times, Livemint, Moneycontrol, Reuters).
* **Transformer NLP Classification:**
  * Deep Learning model classifies articles into **Bullish (Positive)**, **Bearish (Cautionary)**, or **Neutral (Balanced)**.
  * Assigns confidence scores to sentiment classifications.
* **Sentiment Distribution Bar Chart:** Visualizes weekly sentiment distribution across Bullish, Bearish, and Neutral news flows.
* **Category Filtering:** Filter news by Macroeconomics, Banking, IT, Auto, Pharma, Gold, Crypto, and Regulations.
* **Actionable Sentiment Insights:** Pre-configured prompts analyzing how current news mood impacts upcoming Nifty movements and systematic SIP strategies.

---

## 13. AI Financial Advisor & Conversational Chatbot

**Route:** `/chatbot`  
**Components:** `AIChatbot.jsx`, `useChat.js`  
**ML / LLM Engine:** `ml/src/chatbot/` (Groq API, Llama-3-70b / Mixtral-8x7b)  
**Backend Proxy:** `ChatController.java`, `ChatService.java`, `ChatMessage.java`

* **Ultra-Low Latency LLM:** Powered by Groq LPU hardware running Llama 3 models for near-instant responses.
* **Word-by-Word Typewriter Streaming:** Smooth real-time token streaming UX that renders text dynamically as the LLM generates tokens.
* **Dynamic Profile Context Injection:**
  * Automatically injects the user's financial profile into the system prompt:
    ```
    User Profile: Age 28, Income ₹12,00,000, Goal: Wealth Accumulation,
    Horizon: 10 Years, Risk Tolerance: Growth, DTI: 15%
    ```
  * Ensures that answers consider tax slabs, risk tolerance, and time horizon without the user having to re-type their background.
* **Rich Markdown & Table Formatting:** Renders clean data tables, bulleted action items, bold highlights, and disclaimers.
* **Session Memory & Persistence:** Stores conversation history in PostgreSQL so users can reference past advisory sessions.
* **Quick Prompt Suggestions:** One-tap starter questions for beginner investors, SIP vs. Lumpsum calculations, and tax queries.

---

## 14. Notification, Alert & Monitoring Center

**Components:** `Navbar.jsx`, `NotificationContext`  
**Backend:** `NotificationController.java`, `NotificationService.java`, `Notification.java`

* **Notification Bell with Badge Count:** Real-time badge counter on the top navigation bar alerting users to unread updates.
* **Alert Categories:**
  * **AI Portfolio Plan Ready:** Triggers when new MPT asset allocations are generated.
  * **Risk Profile Verified:** Alerts when risk model classification is recalculated.
  * **Market Rally / Volatility Alert:** Flags significant index swings (> 1.5% in Nifty / S&P 500).
  * **Banking Rates Changes:** Notifies users of changes in repo rates or bank FD offerings.
* **Direct Route Navigation:** Clicking any notification routes directly to the relevant module.
* **Lifecycle Management:** Supports individual dismissal, mark-all-as-read, and automatic persistence.

---

## 15. Central Executive Dashboard

**Route:** `/dashboard`  
**Components:** `Dashboard.jsx`, `StatCard`, `AllocationChart.jsx`, `RiskGauge.jsx`

The unified command center aggregating all platform capabilities:
* **Dynamic Time-Based Greeting:** Adapts to the user's local time (Good Morning / Afternoon / Evening).
* **Key Metric Stat Cards:**
  * Net Monthly Savings
  * Projected Annualized Returns
  * Total Portfolio Capital
  * Overall Financial Health Score
* **Side-by-Side Visualizations:**
  * Mini Risk Gauge showing current ML risk classification.
  * Asset Allocation Donut Chart showing current capital distribution.
* **Top Recommended Assets Table:** Instant preview of top allocations across stocks, mutual funds, gold, and fixed deposits.
* **Quick Access Navigation Tiles:** Fast jump cards to Market, Stocks, Mutual Funds, Banking, Gold, Crypto, and Chatbot.

---

## 16. DevOps, Architecture & Infrastructure Matrix

### 3-Tier Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│       React 19 SPA + Tailwind CSS + Lucide + Chart.js       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST / SSE Streaming
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                      │
│            Port 80/443, SSL Termination, Gzip               │
└──────────────┬───────────────────────────────┬──────────────┘
               │ /api/*                        │ /ml/*
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   Spring Boot 3 Backend      │ │     FastAPI ML Service     │
│   (Java 21, Port 8080)       │ │    (Python 3.11, Port 8000)│
│  - JWT Security & Users      │ │  - XGBoost Classifier      │
│  - Financial Profiles        │ │  - MPT Portfolio Optimizer │
│  - Recommendations Service   │ │  - FinBERT News Sentiment  │
│  - Notifications & Chat Logs │ │  - Groq LLM Token Streamer │
└──────────────┬───────────────┘ └─────────────┬──────────────┘
               │ JPA / Hibernate               │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│               PostgreSQL Database (Supabase)                │
│    Tables: users, financial_profiles, recommendations,      │
│            notifications, chat_messages                     │
└─────────────────────────────────────────────────────────────┘
```

### Docker Compose Services
* **`fyp-frontend`:** Node/Nginx container serving optimized React 19 production bundle.
* **`fyp-backend`:** Eclipse Temurin Java 21 container running Spring Boot 3.4 with HikariCP connection pooling.
* **`fyp-ml-service`:** Python 3.11 slim container running FastAPI, Uvicorn, XGBoost, Scikit-Learn, and Groq SDK.
* **`fyp-network`:** Isolated internal Docker bridge network facilitating zero-trust inter-service communication.

---

## Summary Checklist of All Modules

| Module | Route | Primary Technology | Core Functionality |
| :--- | :--- | :--- | :--- |
| **Authentication** | `/login`, `/register` | Spring Security, JWT, BCrypt | Secure user signup, login, session tokens |
| **User Profile** | `/profile`, `/settings` | React 19, Tailwind CSS | Profile management, password reset, dark/light theme |
| **Financial Profile** | `/financial-profile` | Spring Boot JPA, PostgreSQL | 3-step financial data collection, DTI ratio check |
| **Risk Assessment** | `/risk-assessment` | **XGBoost Classifier (89.3%)** | 4-tier risk classification, animated SVG risk gauge |
| **Recommendations** | `/recommendations` | **Modern Portfolio Theory (MPT)** | 5-asset allocation, custom capital input, asset modals |
| **Banking & FDs** | `/banking` | Financial Compounding Math | FD calculator, bank comparisons, PPF/SSY, DICGC info |
| **Gold Advisory** | `/gold` | Live Commodities Feeds | 24K/22K rates, SGB vs ETF vs Physical comparison |
| **Crypto Assets** | `/crypto` | Real-time Crypto APIs | BTC/ETH prices, charts, 30% tax & 1% TDS guide |
| **Stocks Screener** | `/stocks` | NSE/BSE & Global Feeds | P/E ratio, 52W high/low, sector filters, AI analysis |
| **Mutual Funds** | `/mutual-funds` | Dynamic AMFI API | Category filtering, NAV, expense ratio, riskometer |
| **Market Dashboard**| `/market` | Market Index Feeds | NIFTY, SENSEX, sector heatmaps, gainers & losers |
| **News Sentiment** | `/news` | **FinBERT / DistilRoBERTa** | NLP headline sentiment scoring, market mood trends |
| **AI Advisor** | `/chatbot` | **Groq LLM (Llama 3)** | Typewriter streaming, profile context injection |
| **Notifications** | Navbar Bell | Spring Boot JPA, REST | System updates, market alerts, unread badge counter |
| **Dashboard** | `/dashboard` | Integrated UI Components | Holistic financial summary, charts, quick links |

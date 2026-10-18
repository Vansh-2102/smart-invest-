# InvestIQ — Comprehensive Project Features & System Catalog

> **Note:** This file mirrors [features.md](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/features.md). Please refer to [features.md](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/features.md) for the complete up-to-date documentation.

**Project Name:** InvestIQ: AI-Powered Smart Investment Guidance and Conversational Portfolio Advisory Platform  
**Repository:** [smart-invest-](https://github.com/Vansh-2102/smart-invest-.git)  
**Architecture:** 3-Tier Containerized Microservices (`Frontend`, `Backend`, `ML/AI Microservice`)  
**Core Technologies:** React 19, Spring Boot 3 (Java 21), FastAPI (Python 3.11), PostgreSQL (Supabase), XGBoost, Groq LLM (Llama 3), Docker  

---

## Quick Feature Directory

1. **User Authentication & Security:** JWT tokens, BCrypt encryption, RBAC, theme switcher.
2. **Investor Profiling:** 3-step wizard, income/expense tracking, Debt-to-Income (DTI) ratio.
3. **Machine Learning Risk Assessment:** **XGBoost Classifier (89.3% accuracy)** with animated SVG risk gauge and 4 investor tiers.
4. **Portfolio Recommendations:** **Modern Portfolio Theory (MPT)** optimization distributing capital across 5 asset classes (Equities, Mutual Funds, Fixed Deposits, Gold, Bonds).
5. **Banking & Fixed Income:** Compound interest FD calculator, Bank comparison table (SBI, HDFC, ICICI, SFBs), Senior Citizen rates, Government Schemes (PPF, SSY, SCSS, NSC, POMIS), RBI DICGC insurance (₹5 Lakh), and tax rules.
6. **Gold & Precious Metals:** Live 24K/22K spot prices, historical charts, 4-way comparison matrix (Physical vs. Gold ETF vs. Sovereign Gold Bond SGB vs. Digital Gold).
7. **Cryptocurrency & VDAs:** Live BTC/ETH/SOL prices, 24h metrics, interactive charts, Indian 30% tax (Section 115BBH) & 1% TDS (Section 194S) guidance, and custody rules.
8. **Stocks & Equities:** Indian Blue-chips (Nifty/Sensex) & Global Tech (AAPL, MSFT, NVDA), P/E ratio, 52-week High/Low, sector filters, AI analysis.
9. **Mutual Funds:** AMFI real-time search across thousands of funds, category filters (Large, Mid, Small, Flexi, ELSS, Debt), NAV, expense ratios, riskometer.
10. **Market Dashboard:** NIFTY 50, SENSEX, NIFTY Bank, NIFTY Midcap 100, S&P 500, NASDAQ, Sector Heatmap, Top Gainers/Losers, India VIX.
11. **Financial News Sentiment:** **FinBERT / DistilRoBERTa NLP pipeline** classifying news headlines into Bullish, Bearish, and Neutral with sentiment trend charts.
12. **AI Financial Advisor:** **Groq LLM (Llama 3)** with word-by-word typewriter streaming, profile context injection, and rich markdown tables.
13. **Notifications & Alerts:** In-app notification center for portfolio plans, risk recalibration, market alerts, and banking updates.
14. **Central Executive Dashboard:** Unified overview with stat cards, donut allocation chart, risk gauge, and quick module links.
15. **DevOps & Containers:** Docker Compose microservices architecture with isolated bridge network and Nginx reverse proxy.

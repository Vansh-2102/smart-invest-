# Datasets for AI Investment Guidance Platform

## Overview
This document lists all datasets needed to train and run each module.

---

## 1. Risk Assessment Model
**Purpose**: Train model to predict user risk tolerance
**Models**: XGBoost
**Required CSV Columns**:
```
age, income, investment_experience, risk_tolerance, investment_goal, time_horizon, debt_to_income, risk_level
```

### Dataset Sources:
1. **Survey of Consumer Finances (SCF)**
   - Link: https://www.federalreserve.gov/econres/scfindex.htm
   - Description: U.S. household financial survey, includes risk tolerance questions

2. **Customer Personality Analysis (Kaggle)**
   - Link: https://www.kaggle.com/datasets/imakash3011/customer-personality-analysis
   - Description: Customer demographics and purchase behavior

3. **Synthetic Data (Built-in)**
   - The `create_sample_data()` method generates synthetic data for testing

### Training Instructions:
```bash
# Use synthetic data
python src/risk_assessment/train.py

# Use real CSV data
python src/risk_assessment/train.py --dataset /path/to/your/dataset.csv
```

---

## 2. Investment Recommendation Engine
**Purpose**: Generate personalized investment recommendations
**Data Sources**:
1. **Yahoo Finance (via yfinance)**
   - Built-in integration, no API key needed for historical data
   - Provides stock/ETF prices, volume, etc.

2. **Alpha Vantage**
   - Link: https://www.alphavantage.co/
   - Description: Real-time & historical market data, technical indicators
   - API Key Required

3. **S&P 500 Stock Data (Kaggle)**
   - Link: https://www.kaggle.com/datasets/camnugent/sandp500
   - Description: Historical S&P 500 prices

---

## 3. News Sentiment Analysis
**Purpose**: Analyze financial news sentiment
**Models**: DistilRoBERTa (pre-trained on financial data)

### Dataset Sources for Fine-Tuning:
1. **Financial PhraseBank**
   - Link: https://www.researchgate.net/publication/251260751_FinancialPhraseBank-v10
   - Description: Annotated financial news sentences (100% working)

2. **Financial Sentiment Analysis (Kaggle)**
   - Link: https://www.kaggle.com/datasets/sbhatti/financial-sentiment-analysis
   - Description: 5,842 sentences annotated with positive/negative/neutral (WORKING)

3. **Twitter Financial News Sentiment (Kaggle)**
   - Link: https://www.kaggle.com/datasets/ankurzing/aspect-based-sentiment-analysis-for-financial-news
   - Description: Financial news with aspect-based sentiment (WORKING)

4. **HuggingFace Datasets**
   - Link: https://huggingface.co/datasets/financial_phrasebank
   - Description: Pre-downloaded Financial PhraseBank ready to use (CORRECT LINK)

---

## 4. Financial Chatbot (RAG)
**Purpose**: Answer financial questions using RAG
**Knowledge Base Sources**:
1. **Investopedia Articles**
   - Description: Financial education content
   - Note: You'll need to scrape articles with permission

2. **SEC EDGAR Filings**
   - Link: https://www.sec.gov/edgar
   - Description: Corporate filings (10-K, 10-Q, etc.)

3. **Financial Q&A on HuggingFace**
   - Link: https://huggingface.co/datasets/rajpurkar/squad
   - Description: General QA (can filter for finance-related questions)

4. **Finance Bench QA (HuggingFace)**
   - Link: https://huggingface.co/datasets/financebench/financebench
   - Description: Financial QA benchmark (WORKING)

---

## 5. Market Analysis Engine
**Purpose**: Technical analysis of stocks/ETFs
**Data Sources**:
1. **Yahoo Finance (via yfinance)**
   - Built-in integration

2. **EOD Historical Data**
   - Link: https://eodhd.com/
   - Description: End-of-day and real-time market data

3. **Quandl**
   - Link: https://www.quandl.com/
   - Description: Financial, economic, and alternative data

---

## Quick Start
For testing, you can use the built-in synthetic data and pre-trained models!

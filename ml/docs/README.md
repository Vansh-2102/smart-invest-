# AI Investment Guidance Platform - ML Module

## Overview
This module provides AI/ML services for the Investment Guidance Platform.

## Modules
1. **Risk Assessment** - Uses XGBoost to assess user risk tolerance
2. **Investment Recommendation Engine** - Generates personalized investment recommendations
3. **News Sentiment Analysis** - Analyzes financial news sentiment using HuggingFace
4. **Financial Chatbot** - RAG-based chatbot with Qdrant vector DB
5. **Market Analysis** - Technical analysis of stocks/ETFs

## Installation
```bash
cd ml
pip install -r requirements.txt
```

## Environment Setup
Copy `.env.example` to `.env` and fill in your API keys:
- GROQ_API_KEY
- QDRANT_URL

## Running the API
```bash
python -m api.main
```

## API Documentation
Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Training the Risk Model
```bash
python src/risk_assessment/train.py
```

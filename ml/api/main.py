from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from pathlib import Path
import sys
import os
import traceback

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.risk_assessment import RiskAssessmentModel
from src.investment_recommendation import InvestmentRecommendationEngine
from src.market_analysis import MarketAnalysisEngine
from src.chatbot import FinancialChatbot

app = FastAPI(
    title="AI Investment Guidance Platform - ML API",
    description="Machine Learning and AI services for investment guidance",
    version="1.0.0"
)

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

risk_model = None
recommendation_engine = InvestmentRecommendationEngine()
market_analyzer = MarketAnalysisEngine()
chatbot = None

def load_risk_model():
    global risk_model
    model_path = Path(__file__).parent.parent / "models" / "risk_assessment_model.joblib"
    if os.path.exists(model_path):
        risk_model = RiskAssessmentModel(str(model_path))
    else:
        risk_model = RiskAssessmentModel()
        risk_model.train()
        risk_model.save_model(str(model_path))

def load_chatbot():
    global chatbot
    try:
        chatbot = FinancialChatbot()
        print("Chatbot loaded successfully")
    except Exception as e:
        print(f"Warning: Failed to load chatbot: {e}")
        chatbot = None

@app.on_event("startup")
async def startup_event():
    load_risk_model()
    load_chatbot()

class UserRiskProfile(BaseModel):
    age: int
    income: float
    investment_experience: str = "BEGINNER"
    risk_tolerance: str = "MODERATE"
    investment_goal: str = "WEALTH_GROWTH"
    time_horizon: int = 10
    debt_to_income: float = 0.3

class InvestmentRequest(BaseModel):
    risk_level: str
    investment_amount: float = 10000

class ChatRequest(BaseModel):
    query: str

@app.get("/")
async def root():
    return {
        "message": "AI Investment Guidance Platform ML API",
        "endpoints": {
            "risk_assessment": "/api/risk/assess",
            "investment_recommendations": "/api/investment/recommend",
            "market_analysis": "/api/market/analyze/{ticker}"
        }
    }

@app.post("/api/risk/assess")
async def assess_risk(profile: UserRiskProfile):
    try:
        print("Received profile:", profile.model_dump())
        result = risk_model.predict(profile.model_dump())
        if "risk_level" in result:
            result["riskLevel"] = result["risk_level"].upper()
        return {"success": True, "data": result}
    except Exception as e:
        print("Error in assess_risk:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/investment/recommend")
async def get_recommendations(request: InvestmentRequest):
    try:
        result = recommendation_engine.generate_recommendations(
            request.risk_level, 
            request.investment_amount
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        if chatbot is None:
            raise HTTPException(status_code=503, detail="Chatbot is temporarily unavailable")
        result = chatbot.chat(request.query)
        return {"success": True, "data": result}
    except Exception as e:
        print("Error in chat:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/analyze/{ticker}")
async def analyze_market(ticker: str, period: str = "1y"):
    try:
        result = market_analyzer.analyze_ticker(ticker, period)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/stocks")
async def get_top_stocks():
    try:
        stocks = market_analyzer.get_top_stocks()
        return {"success": True, "data": stocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/stocks/{symbol}/chart")
async def get_stock_chart(symbol: str, period: str = "1mo"):
    try:
        chart_data = market_analyzer.get_stock_chart(symbol, period)
        if "error" in chart_data:
            raise HTTPException(status_code=404, detail=chart_data["error"])
        return {"success": True, "data": chart_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/indices")
async def get_market_indices():
    try:
        indices = market_analyzer.get_indices()
        return {"success": True, "data": indices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/gold")
async def get_gold_data():
    try:
        gold_data = market_analyzer.get_gold_data()
        return {"success": True, "data": gold_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/crypto")
async def get_crypto_market():
    try:
        crypto_data = market_analyzer.get_crypto_market()
        return {"success": True, "data": crypto_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/crypto/{symbol}/chart")
async def get_crypto_chart(symbol: str, period: str = "1mo"):
    try:
        chart_data = market_analyzer.get_crypto_chart(symbol, period)
        if chart_data is None:
            raise HTTPException(status_code=404, detail="Chart data not found")
        return {"success": True, "data": chart_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/mutual-funds")
async def get_mutual_funds():
    try:
        funds = market_analyzer.get_mutual_funds()
        return {"success": True, "data": funds}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

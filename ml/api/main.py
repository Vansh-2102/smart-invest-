from fastapi import FastAPI, HTTPException  # pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware  # pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from pathlib import Path
import sys
import os
import traceback

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.risk_assessment import RiskAssessmentModel, check_volatility_drift
from src.investment_recommendation import (
    InvestmentRecommendationEngine, 
    calculate_post_tax_returns,
    optimize_portfolio
)
from src.market_analysis import MarketAnalysisEngine, get_confirmed_signal
from src.chatbot import FinancialChatbot


app = FastAPI(
    title="AI Investment Guidance Platform - ML API",
    description="Machine Learning and AI services for investment guidance",
    version="1.0.0"
)

# Add CORS middleware to allow requests from frontend
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in allowed_origins else allowed_origins,
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
            "health": "/health",
            "risk_assessment": "/api/risk/assess",
            "investment_recommendations": "/api/investment/recommend",
            "market_analysis": "/api/market/analyze/{ticker}"
        }
    }

@app.get("/health")
@app.get("/healthz")
@app.get("/api/health")
async def health_check():
    return {
        "status": "UP",
        "service": "investiq-ml-service",
        "risk_model_loaded": risk_model is not None,
        "chatbot_loaded": chatbot is not None
    }

@app.post("/api/risk/assess")
async def assess_risk(profile: UserRiskProfile):
    try:
        print("Received profile:", profile.model_dump())
        result = risk_model.predict(profile.model_dump())
        if "risk_level" in result:
            result["riskLevel"] = result["risk_level"].upper()
        if "top_risk_drivers" not in result:
            result["top_risk_drivers"] = []
        return {"success": True, "data": result}
    except Exception as e:
        print("Error in assess_risk:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/investment/recommend")
async def get_recommendations(request: InvestmentRequest):
    try:
        # Check for volatility drift prior to portfolio optimization (Paper 1)
        drift_info = check_volatility_drift(request.risk_level)
        effective_risk = drift_info["effective_risk_tier"]
        
        result = recommendation_engine.generate_recommendations(
            effective_risk, 
            request.investment_amount
        )
        result["volatility_drift"] = drift_info
        result["base_risk_tier"] = request.risk_level
        result["effective_risk_tier"] = effective_risk
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/volatility-drift")
async def get_volatility_drift(risk_tier: str = "moderate"):
    try:
        return {"success": True, "data": check_volatility_drift(risk_tier)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/investment/optimize-portfolio/{risk_tier}")
async def get_portfolio_optimization(risk_tier: str):
    try:
        return {"success": True, "data": optimize_portfolio(risk_tier)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RebalanceConsentRequest(BaseModel):
    consent_granted: bool
    effective_tier: str
    base_risk_tier: Optional[str] = "moderate"
    investment_amount: Optional[float] = 100000.0

@app.post("/api/investment/rebalance/consent")
async def rebalance_consent(request: RebalanceConsentRequest):
    try:
        final_tier = request.effective_tier if request.consent_granted else (request.base_risk_tier or "moderate")
        result = recommendation_engine.generate_recommendations(
            final_tier,
            request.investment_amount
        )
        return {
            "success": True,
            "consent_granted": request.consent_granted,
            "effective_tier": final_tier,
            "base_risk_tier": request.base_risk_tier,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TaxCalculationRequest(BaseModel):
    equity_gain: Optional[float] = 0.0
    crypto_gain: Optional[float] = 0.0
    fd_gain: Optional[float] = 0.0
    sgb_gain: Optional[float] = 0.0
    bonds_gain: Optional[float] = 0.0

@app.post("/api/investment/post-tax-calculate")
async def post_tax_calculate(request: TaxCalculationRequest):
    try:
        result = calculate_post_tax_returns(request.model_dump())
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

class ConfirmedSignalRequest(BaseModel):
    ticker: str
    rsi: Optional[float] = 50.0
    macd: Optional[float] = 0.0
    signal_line: Optional[float] = 0.0
    sentiment_score: Optional[float] = 0.0

@app.get("/api/market/analyze/{ticker}")
async def analyze_market(ticker: str, period: str = "1y", sentiment_score: Optional[float] = None):
    try:
        result = market_analyzer.analyze_ticker(ticker, period, sentiment_score=sentiment_score)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/market/confirmed-signal")
async def post_confirmed_signal(request: ConfirmedSignalRequest):
    try:
        price_data = {
            "RSI": request.rsi,
            "MACD": request.macd,
            "Signal_Line": request.signal_line
        }
        result = get_confirmed_signal(request.ticker, price_data, request.sentiment_score)
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

@app.get("/api/market/stocks/search")
async def search_stocks(q: str):
    try:
        stocks = market_analyzer.search_stocks(q)
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

@app.get("/api/market/mutual-funds/search")
async def search_mutual_funds(q: str):
    try:
        funds = market_analyzer.search_mutual_funds(q)
        return {"success": True, "data": funds}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn  # pyrefly: ignore [missing-import]
    uvicorn.run(app, host="0.0.0.0", port=8000)

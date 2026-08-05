import pandas as pd
import numpy as np
from typing import List, Dict
import yfinance as yf

class InvestmentRecommendationEngine:
    def __init__(self):
        self.assets = {
            'conservative': [
                {'ticker': 'SPY', 'name': 'S&P 500 ETF', 'type': 'etf', 'risk': 'low'},
                {'ticker': 'BND', 'name': 'Total Bond Market ETF', 'type': 'etf', 'risk': 'low'},
                {'ticker': 'GLD', 'name': 'Gold ETF', 'type': 'etf', 'risk': 'low'},
                {'ticker': 'JNJ', 'name': 'Johnson & Johnson', 'type': 'stock', 'risk': 'low'},
                {'ticker': 'PG', 'name': 'Procter & Gamble', 'type': 'stock', 'risk': 'low'},
            ],
            'moderate': [
                {'ticker': 'SPY', 'name': 'S&P 500 ETF', 'type': 'etf', 'risk': 'medium'},
                {'ticker': 'QQQ', 'name': 'Nasdaq 100 ETF', 'type': 'etf', 'risk': 'medium'},
                {'ticker': 'BND', 'name': 'Total Bond Market ETF', 'type': 'etf', 'risk': 'low'},
                {'ticker': 'AAPL', 'name': 'Apple Inc.', 'type': 'stock', 'risk': 'medium'},
                {'ticker': 'MSFT', 'name': 'Microsoft Corp.', 'type': 'stock', 'risk': 'medium'},
                {'ticker': 'VTI', 'name': 'Total Stock Market ETF', 'type': 'etf', 'risk': 'medium'},
            ],
            'aggressive': [
                {'ticker': 'QQQ', 'name': 'Nasdaq 100 ETF', 'type': 'etf', 'risk': 'high'},
                {'ticker': 'SMH', 'name': 'Semiconductor ETF', 'type': 'etf', 'risk': 'high'},
                {'ticker': 'ARKK', 'name': 'Innovation ETF', 'type': 'etf', 'risk': 'high'},
                {'ticker': 'NVDA', 'name': 'NVIDIA Corp.', 'type': 'stock', 'risk': 'high'},
                {'ticker': 'TSLA', 'name': 'Tesla Inc.', 'type': 'stock', 'risk': 'high'},
                {'ticker': 'AMD', 'name': 'AMD', 'type': 'stock', 'risk': 'high'},
            ]
        }
    
    def get_asset_allocations(self, risk_level: str) -> Dict:
        allocations = {
            'conservative': {
                'stocks': 30,
                'bonds': 50,
                'cash': 10,
                'gold': 10
            },
            'moderate': {
                'stocks': 55,
                'bonds': 30,
                'cash': 10,
                'gold': 5
            },
            'aggressive': {
                'stocks': 80,
                'bonds': 10,
                'cash': 5,
                'gold': 5
            }
        }
        return allocations.get(risk_level, allocations['moderate'])
    
    def fetch_market_data(self, tickers: List[str]) -> pd.DataFrame:
        data = {}
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(period='1y')
                if not hist.empty:
                    data[ticker] = {
                        'current_price': hist['Close'].iloc[-1],
                        '1y_return': ((hist['Close'].iloc[-1] / hist['Close'].iloc[0]) - 1) * 100,
                        'volatility': hist['Close'].pct_change().std() * np.sqrt(252) * 100
                    }
            except Exception as e:
                print(f"Error fetching data for {ticker}: {e}")
        return pd.DataFrame(data).T
    
    def generate_recommendations(self, risk_level: str, investment_amount: float = 10000) -> Dict:
        assets = self.assets.get(risk_level, self.assets['moderate'])
        allocations = self.get_asset_allocations(risk_level)
        
        tickers = [asset['ticker'] for asset in assets]
        market_data = self.fetch_market_data(tickers)
        
        recommendations = []
        
        per_asset = investment_amount / len(assets)
        
        for asset in assets:
            ticker = asset['ticker']
            market_info = market_data.loc[ticker] if ticker in market_data.index else None
            
            recommendations.append({
                'ticker': ticker,
                'name': asset['name'],
                'type': asset['type'],
                'risk': asset['risk'],
                'allocation_percent': round(100 / len(assets), 2),
                'allocation_amount': round(per_asset, 2),
                'current_price': round(market_info['current_price'], 2) if market_info is not None else None,
                '1y_return_percent': round(market_info['1y_return'], 2) if market_info is not None else None,
                'volatility_percent': round(market_info['volatility'], 2) if market_info is not None else None,
                'estimated_shares': round(per_asset / market_info['current_price'], 2) if market_info is not None else None
            })
        
        return {
            'risk_level': risk_level,
            'total_investment': investment_amount,
            'asset_class_allocations': allocations,
            'recommendations': recommendations
        }

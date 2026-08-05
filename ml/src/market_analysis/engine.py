import yfinance as yf
import pandas as pd
import numpy as np
import requests
from pathlib import Path
from typing import Dict, List, Optional

class MarketAnalysisEngine:
    def __init__(self):
        cache_dir = Path(__file__).resolve().parents[2] / ".cache" / "yfinance"
        cache_dir.mkdir(parents=True, exist_ok=True)
        yf.set_tz_cache_location(str(cache_dir))
        self.top_indian_stocks = [
            {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "sector": "Energy"},
            {"symbol": "TCS.NS", "name": "Tata Consultancy", "sector": "IT"},
            {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "sector": "Banking"},
            {"symbol": "INFY.NS", "name": "Infosys", "sector": "IT"},
            {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "sector": "Banking"},
            {"symbol": "WIPRO.NS", "name": "Wipro", "sector": "IT"},
            {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "sector": "Finance"},
            {"symbol": "HCLTECH.NS", "name": "HCL Technologies", "sector": "IT"},
            {"symbol": "AXISBANK.NS", "name": "Axis Bank", "sector": "Banking"},
            {"symbol": "LT.NS", "name": "Larsen & Toubro", "sector": "Infra"},
        ]
        self.top_indices = [
            {"ticker": "^NSEI", "name": "NIFTY 50"},
            {"ticker": "^BSESN", "name": "SENSEX"},
            {"ticker": "^NSEBANK", "name": "NIFTY Bank"},
            {"ticker": "^NSEIT", "name": "NIFTY IT"},
            {"ticker": "^NSMIDCP", "name": "NIFTY Mid"},
            {"ticker": "^GSPC", "name": "S&P 500"},
            {"ticker": "^IXIC", "name": "NASDAQ"},
            {"ticker": "^DJI", "name": "DOW JONES"},
        ]
        self.top_crypto = [
            {"id": "bitcoin", "symbol": "BTC", "name": "Bitcoin"},
            {"id": "ethereum", "symbol": "ETH", "name": "Ethereum"},
            {"id": "binancecoin", "symbol": "BNB", "name": "BNB"},
            {"id": "solana", "symbol": "SOL", "name": "Solana"},
            {"id": "ripple", "symbol": "XRP", "name": "Ripple"},
            {"id": "dogecoin", "symbol": "DOGE", "name": "Dogecoin"},
            {"id": "cardano", "symbol": "ADA", "name": "Cardano"},
            {"id": "avalanche-2", "symbol": "AVAX", "name": "Avalanche"},
        ]
        self.top_mutual_funds = [
            {"scheme_code": 120586, "name": "ICICI Prudential Large Cap Fund", "category": "Large Cap", "risk": "Medium"},
            {"scheme_code": 118989, "name": "HDFC Mid Cap Fund", "category": "Mid Cap", "risk": "High"},
            {"scheme_code": 122639, "name": "Parag Parikh Flexi Cap Fund", "category": "Flexi Cap", "risk": "Medium"},
            {"scheme_code": 125354, "name": "Axis Small Cap Fund", "category": "Small Cap", "risk": "Very High"},
            {"scheme_code": 120377, "name": "ICICI Prudential Balanced Advantage Fund", "category": "Hybrid", "risk": "Medium"},
            {"scheme_code": 135781, "name": "Mirae Asset ELSS Tax Saver Fund", "category": "ELSS", "risk": "High"},
            {"scheme_code": 119759, "name": "Kotak Gilt Fund", "category": "Debt", "risk": "Low"},
            {"scheme_code": 120716, "name": "UTI Nifty 50 Index Fund", "category": "Index", "risk": "Medium"},
        ]
    
    def calculate_moving_averages(self, data: pd.DataFrame, windows: List[int] = [20, 50, 200]) -> pd.DataFrame:
        df = data.copy()
        for window in windows:
            df[f'MA{window}'] = df['Close'].rolling(window=window).mean()
        return df
    
    def calculate_rsi(self, data: pd.DataFrame, window: int = 14) -> pd.DataFrame:
        df = data.copy()
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        return df
    
    def calculate_macd(self, data: pd.DataFrame) -> pd.DataFrame:
        df = data.copy()
        df['EMA12'] = df['Close'].ewm(span=12, adjust=False).mean()
        df['EMA26'] = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = df['EMA12'] - df['EMA26']
        df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()
        df['Histogram'] = df['MACD'] - df['Signal_Line']
        return df
    
    def get_top_stocks(self) -> List[Dict]:
        stocks_data = []
        for stock_info in self.top_indian_stocks:
            try:
                ticker = stock_info["symbol"]
                stock = yf.Ticker(ticker)
                hist = stock.history(period="10d")
                valid_hist = hist.dropna(subset=["Close"])
                if len(valid_hist) < 2:
                    continue
                
                latest_close = float(valid_hist["Close"].iloc[-1])
                prev_close = float(valid_hist["Close"].iloc[-2])
                change_pct = ((latest_close - prev_close) / prev_close) * 100
                
                if np.isnan(latest_close) or np.isnan(prev_close) or np.isnan(change_pct):
                    continue
                
                info = stock.info
                mcap = info.get("marketCap")
                pe = info.get("trailingPE")
                
                if pe is not None and np.isnan(pe):
                    pe = None
                
                stocks_data.append({
                    "symbol": stock_info["symbol"].replace(".NS", ""),
                    "name": stock_info["name"],
                    "price": round(latest_close, 2),
                    "change": round(change_pct, 2),
                    "sector": stock_info["sector"],
                    "mcap": self._format_mcap(mcap) if mcap is not None else "N/A",
                    "pe": round(pe, 1) if pe is not None else "N/A"
                })
            except Exception as e:
                print(f"Error fetching {stock_info['symbol']}: {e}")
                continue
        return stocks_data
    
    def get_stock_chart(self, ticker: str, period: str = "1mo") -> Dict:
        if not ticker.endswith(".NS"):
            ticker = f"{ticker}.NS"
        
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)
        valid_hist = hist.dropna(subset=["Close"])
        
        if valid_hist.empty:
            return {"error": "No data available"}
        
        labels = valid_hist.index.strftime("%d %b").tolist()
        prices = [round(float(x), 2) for x in valid_hist["Close"].tolist()]
        
        return {
            "labels": labels,
            "prices": prices
        }
    
    def get_indices(self) -> List[Dict]:
        indices_data = []
        for idx in self.top_indices:
            try:
                ticker = yf.Ticker(idx["ticker"])
                hist = ticker.history(period="10d")
                valid_hist = hist.dropna(subset=["Close"])
                if len(valid_hist) < 2:
                    continue
                latest = float(valid_hist["Close"].iloc[-1])
                prev = float(valid_hist["Close"].iloc[-2])
                change = ((latest - prev) / prev) * 100
                change_amt = latest - prev
                indices_data.append({
                    "name": idx["name"],
                    "value": round(latest, 2),
                    "change": round(change, 2),
                    "changeAmt": round(change_amt, 2)
                })
            except Exception as e:
                print(f"Error fetching index {idx['name']}: {e}")
                continue
        return indices_data

    def get_gold_data(self) -> Dict:
        try:
            # Use yfinance for gold (GC=F) and MCX Gold if available
            gold_ticker = yf.Ticker("GC=F")
            hist = gold_ticker.history(period="1mo")
            valid_hist = hist.dropna(subset=["Close"])
            if valid_hist.empty:
                return {
                    "spot": 70000.0,
                    "change": 0.0,
                    "changeAmt": 0.0,
                    "labels": [],
                    "prices": [],
                    "sgbRate": 6700.0,
                    "sgbInterest": 2.5,
                    "etfOptions": [
                        {"name": "SBI Gold ETF", "nav": 67.0, "expense": 0.5},
                        {"name": "HDFC Gold ETF", "nav": 67.5, "expense": 0.6},
                        {"name": "Nippon Gold ETF", "nav": 66.9, "expense": 0.8},
                        {"name": "Kotak Gold ETF", "nav": 67.2, "expense": 0.55}
                    ]
                }
            
            latest = float(valid_hist["Close"].iloc[-1])
            prev = float(valid_hist["Close"].iloc[-2]) if len(valid_hist) > 1 else latest
            change = ((latest - prev) / prev) * 100
            change_amt = latest - prev
            
            # Convert from USD/oz to INR/10g approx (using simple estimate, or we could use USDINR=X)
            try:
                usdinr = yf.Ticker("INR=X").history(period="1d")["Close"].iloc[-1]
            except Exception:
                usdinr = 85.0
            spot_inr = round(latest * usdinr / 31.1035 * 10, 2)  # per 10 grams
            
            labels = valid_hist.index.strftime("%d %b").tolist()
            prices = [round(float(x) * usdinr / 31.1035 * 10, 2) for x in valid_hist["Close"].tolist()]
            
            return {
                "spot": spot_inr,
                "change": round(change, 2),
                "changeAmt": round(change_amt * usdinr / 31.1035 * 10, 2),
                "labels": labels,
                "prices": prices,
                "sgbRate": round(spot_inr * 0.95, 2),
                "sgbInterest": 2.5,
                "etfOptions": [
                    {"name": "SBI Gold ETF", "nav": round(spot_inr / 1000, 2), "expense": 0.5},
                    {"name": "HDFC Gold ETF", "nav": round(spot_inr / 1000 + 0.1, 2), "expense": 0.6},
                    {"name": "Nippon Gold ETF", "nav": round(spot_inr / 1000 - 0.05, 2), "expense": 0.8},
                    {"name": "Kotak Gold ETF", "nav": round(spot_inr / 1000 + 0.02, 2), "expense": 0.55}
                ]
            }
        except Exception as e:
            print(f"Error fetching gold data: {e}")
            return {
                "spot": 70000.0,
                "change": 0.0,
                "changeAmt": 0.0,
                "labels": [],
                "prices": [],
                "sgbRate": 66500.0,
                "sgbInterest": 2.5,
                "etfOptions": [
                    {"name": "SBI Gold ETF", "nav": 67.0, "expense": 0.5},
                    {"name": "HDFC Gold ETF", "nav": 67.5, "expense": 0.6},
                    {"name": "Nippon Gold ETF", "nav": 66.9, "expense": 0.8},
                    {"name": "Kotak Gold ETF", "nav": 67.2, "expense": 0.55}
                ]
            }

    def get_crypto_market(self) -> List[Dict]:
        crypto_data = []
        try:
            # Use CoinGecko free API (no key needed)
            ids = ",".join([c["id"] for c in self.top_crypto])
            url = f"https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&ids={ids}&order=market_cap_desc&per_page=50&page=1&sparkline=false"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            for coin in data:
                crypto_data.append({
                    "symbol": coin["symbol"].upper(),
                    "name": coin["name"],
                    "price": coin["current_price"],
                    "change24h": coin["price_change_percentage_24h"],
                    "mcap": self._format_crypto_mcap(coin["market_cap"]),
                    "volume": self._format_crypto_mcap(coin["total_volume"]),
                    "high24h": coin["high_24h"],
                    "low24h": coin["low_24h"]
                })
        except Exception as e:
            print(f"Error fetching crypto data: {e}")
        return crypto_data

    def get_crypto_chart(self, symbol: str, period: str = "1mo") -> Optional[Dict]:
        try:
            # Find the coingecko id from symbol
            id_map = {c["symbol"].lower(): c["id"] for c in self.top_crypto}
            cg_id = id_map.get(symbol.lower())
            if not cg_id:
                return None
            
            # Get days from period
            days = "30" if period == "1mo" else "14"
            url = f"https://api.coingecko.com/api/v3/coins/{cg_id}/market_chart?vs_currency=inr&days={days}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            prices = data.get("prices", [])
            labels = []
            price_values = []
            for p in prices[-30:]:  # Last 30 points
                dt = pd.to_datetime(p[0], unit="ms")
                labels.append(dt.strftime("%d %b"))
                price_values.append(round(p[1], 2))
            
            return {"labels": labels, "prices": price_values}
        except Exception as e:
            print(f"Error fetching crypto chart for {symbol}: {e}")
            return None

    def get_mutual_funds(self) -> List[Dict]:
        funds_data = []
        for fund in self.top_mutual_funds:
            try:
                response = requests.get(
                    f"https://api.mfapi.in/mf/{fund['scheme_code']}",
                    timeout=20,
                )
                response.raise_for_status()
                payload = response.json()
                nav_history = payload.get("data", [])
                if not nav_history:
                    continue

                latest_nav = self._parse_nav_entry(nav_history[0])
                nav_1y = self._find_nav_before_days(nav_history, 365)
                nav_3y = self._find_nav_before_days(nav_history, 365 * 3)
                if latest_nav is None or nav_1y is None or nav_3y is None:
                    continue

                funds_data.append({
                    "name": fund["name"],
                    "category": fund["category"],
                    "nav": round(latest_nav, 2),
                    "returns1y": round(((latest_nav - nav_1y) / nav_1y) * 100, 2),
                    "returns3y": round(((latest_nav - nav_3y) / nav_3y) * 100, 2),
                    "aum": "N/A",
                    "risk": fund["risk"],
                })
            except Exception as e:
                print(f"Error fetching mutual fund {fund['scheme_code']}: {e}")
                continue
        return funds_data

    def _format_mcap(self, mcap: float) -> str:
        if mcap is None or np.isnan(mcap):
            return "N/A"
        if mcap >= 1e12:
            return f"{mcap / 1e12:.1f}T"
        elif mcap >= 1e9:
            return f"{mcap / 1e9:.1f}L Cr"
        elif mcap >= 1e6:
            return f"{mcap / 1e6:.1f}Cr"
        else:
            return f"{mcap}"

    def _format_crypto_mcap(self, mcap: Optional[float]) -> str:
        if mcap is None:
            return "N/A"
        if mcap >= 1e12:
            return f"{mcap / 1e12:.1f}T"
        elif mcap >= 1e9:
            return f"{mcap / 1e9:.1f}B"
        elif mcap >= 1e6:
            return f"{mcap / 1e6:.1f}M"
        else:
            return f"{mcap:.0f}"

    def _parse_nav_entry(self, entry: Dict) -> Optional[float]:
        nav = entry.get("nav")
        if nav is None:
            return None
        return float(nav)

    def _find_nav_before_days(self, nav_history: List[Dict], days: int) -> Optional[float]:
        target_date = pd.Timestamp.today().normalize() - pd.Timedelta(days=days)
        for entry in nav_history:
            entry_date = pd.to_datetime(entry.get("date"), format="%d-%m-%Y", errors="coerce")
            if pd.isna(entry_date):
                continue
            if entry_date <= target_date:
                return self._parse_nav_entry(entry)
        return None
    
    def analyze_ticker(self, ticker: str, period: str = '1y') -> Dict:
        if not ticker.endswith(".NS"):
            ticker = f"{ticker}.NS"
        
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)
        
        if hist.empty:
            return {'error': 'No data available for this ticker'}
        
        hist = self.calculate_moving_averages(hist)
        hist = self.calculate_rsi(hist)
        hist = self.calculate_macd(hist)
        
        latest = hist.iloc[-1]
        
        indicators = {
            'current_price': float(latest['Close']),
            'MA20': float(latest.get('MA20', np.nan)),
            'MA50': float(latest.get('MA50', np.nan)),
            'MA200': float(latest.get('MA200', np.nan)),
            'RSI': float(latest.get('RSI', np.nan)),
            'MACD': float(latest.get('MACD', np.nan)),
            'Signal_Line': float(latest.get('Signal_Line', np.nan)),
            'Histogram': float(latest.get('Histogram', np.nan)),
            '52_week_high': float(hist['High'].max()),
            '52_week_low': float(hist['Low'].min()),
            'YTD_return': float(((latest['Close'] / hist['Close'].iloc[0]) - 1) * 100),
            'volatility': float(hist['Close'].pct_change().std() * np.sqrt(252) * 100)
        }
        
        signals = []
        if not np.isnan(indicators['RSI']):
            if indicators['RSI'] > 70:
                signals.append({'indicator': 'RSI', 'signal': 'overbought', 'value': indicators['RSI']})
            elif indicators['RSI'] < 30:
                signals.append({'indicator': 'RSI', 'signal': 'oversold', 'value': indicators['RSI']})
        
        if not np.isnan(indicators['MACD']) and not np.isnan(indicators['Signal_Line']):
            if indicators['MACD'] > indicators['Signal_Line']:
                signals.append({'indicator': 'MACD', 'signal': 'bullish_crossover', 'value': indicators['MACD']})
            elif indicators['MACD'] < indicators['Signal_Line']:
                signals.append({'indicator': 'MACD', 'signal': 'bearish_crossover', 'value': indicators['MACD']})
        
        return {
            'ticker': ticker,
            'indicators': indicators,
            'signals': signals,
            'last_updated': hist.index[-1].isoformat()
        }

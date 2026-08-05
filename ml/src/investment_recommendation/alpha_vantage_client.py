import os
import requests
from dotenv import load_dotenv
from typing import Dict, Optional

load_dotenv()

class AlphaVantageClient:
    def __init__(self):
        self.api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        self.base_url = "https://www.alphavantage.co/query"
        
    def get_daily_data(self, symbol: str, outputsize: str = "compact") -> Optional[Dict]:
        """Get daily time series data"""
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "apikey": self.api_key,
            "outputsize": outputsize
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching Alpha Vantage data: {e}")
            return None
    
    def get_quote(self, symbol: str) -> Optional[Dict]:
        """Get latest price quote"""
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            if "Global Quote" in data:
                return data["Global Quote"]
            return None
        except Exception as e:
            print(f"Error fetching quote: {e}")
            return None

import pandas as pd
import numpy as np
from typing import List, Dict
import yfinance as yf

class InvestmentRecommendationEngine:
    def __init__(self):
        # Master asset universe categorized across all major financial asset classes
        self.asset_catalog = {
            'conservative': {
                'banking': [
                    {
                        'ticker': 'HDFC_FD',
                        'name': 'HDFC Bank Fixed Deposit',
                        'type': 'banking',
                        'category': 'banking',
                        'category_label': 'Fixed Deposits & Banking',
                        'risk': 'low',
                        'expected_return': 7.25,
                        'current_price': 1000.0,
                        'description': 'Leading private bank fixed deposit offering sovereign-grade security with guaranteed interest compounding.',
                        'how_it_works': 'Funds are locked for 1-3 years at a fixed contracted interest rate of 7.25% p.a., with RBI DICGC insurance cover up to ₹5,00,000.',
                        'why_recommended': 'Provides total capital preservation and immune against equity market crashes.'
                    },
                    {
                        'ticker': 'SBI_FD',
                        'name': 'SBI Term Deposit',
                        'type': 'banking',
                        'category': 'banking',
                        'category_label': 'Fixed Deposits & Banking',
                        'risk': 'low',
                        'expected_return': 7.00,
                        'current_price': 1000.0,
                        'description': 'India\'s largest public sector bank offering guaranteed government-backed fixed returns.',
                        'how_it_works': 'Deposit principal is 100% safe with quarterly compounding interest paid out or reinvested at maturity.',
                        'why_recommended': 'Solid foundation for capital preservation with zero market risk.'
                    }
                ],
                'bonds': [
                    {
                        'ticker': 'BND',
                        'name': 'Total Bond Market ETF',
                        'type': 'bonds',
                        'category': 'bonds',
                        'category_label': 'Bonds & Fixed Income',
                        'risk': 'low',
                        'expected_return': 6.80,
                        'current_price': 72.0,
                        'description': 'Investment-grade government and high-quality corporate bonds basket.',
                        'how_it_works': 'Pools institutional capital into sovereign treasuries and AAA corporate debentures delivering regular coupon income.',
                        'why_recommended': 'Offers higher yield than standard savings with low volatility.'
                    }
                ],
                'stocks': [
                    {
                        'ticker': 'JNJ',
                        'name': 'Johnson & Johnson',
                        'type': 'stock',
                        'category': 'stocks',
                        'category_label': 'Blue-Chip Equities',
                        'risk': 'low',
                        'expected_return': 11.50,
                        'current_price': 275.0,
                        'description': 'AAA credit-rated global healthcare giant with 60+ consecutive years of rising dividends.',
                        'how_it_works': 'Generates recession-proof cash flow from life-saving pharmaceuticals and medical technology.',
                        'why_recommended': 'High dividend yield and low market beta for defensive equity growth.'
                    },
                    {
                        'ticker': 'PG',
                        'name': 'Procter & Gamble',
                        'type': 'stock',
                        'category': 'stocks',
                        'category_label': 'Blue-Chip Equities',
                        'risk': 'low',
                        'expected_return': 10.80,
                        'current_price': 170.0,
                        'description': 'World\'s top consumer staples conglomerate (Gillette, Tide, Oral-B, Pampers).',
                        'how_it_works': 'Sells everyday essential household goods with massive pricing power and consistent operating margins.',
                        'why_recommended': 'Provides steady wealth compounding with minimal drawdown in bear markets.'
                    }
                ],
                'mutual_funds': [
                    {
                        'ticker': 'SPY',
                        'name': 'S&P 500 Index Fund',
                        'type': 'etf',
                        'category': 'mutual_funds',
                        'category_label': 'Index & Mutual Funds',
                        'risk': 'medium',
                        'expected_return': 12.20,
                        'current_price': 770.0,
                        'description': 'Tracks the 500 largest profitable companies in the United States.',
                        'how_it_works': 'Self-cleansing index that continuously holds top global economic leaders at minimal expense ratio (0.03%).',
                        'why_recommended': 'Global standard for diversified equity compounding.'
                    }
                ],
                'gold': [
                    {
                        'ticker': 'GLD',
                        'name': 'Sovereign Gold Bond / Gold ETF',
                        'type': 'gold',
                        'category': 'gold',
                        'category_label': 'Precious Metals & Gold',
                        'risk': 'low',
                        'expected_return': 9.50,
                        'current_price': 406.0,
                        'description': '99.9% purity physical bullion backed security with zero storage and making charges.',
                        'how_it_works': 'Direct exposure to international gold spot prices, acting as an inflation shield.',
                        'why_recommended': 'Proven historical hedge against rupee depreciation and inflation.'
                    }
                ]
            },
            'moderate': {
                'banking': [
                    {
                        'ticker': 'HDFC_FD',
                        'name': 'HDFC Bank Fixed Deposit',
                        'type': 'banking',
                        'category': 'banking',
                        'category_label': 'Fixed Deposits & Banking',
                        'risk': 'low',
                        'expected_return': 7.25,
                        'current_price': 1000.0,
                        'description': 'High-yield term deposit providing a stable cash flow anchor for your balanced portfolio.',
                        'how_it_works': 'Locked fixed interest with quarterly reinvestment, yielding ₹72,500 annually per ₹10,00,000 deposited.',
                        'why_recommended': 'Provides capital safety so you can take strategic growth risks in equity.'
                    }
                ],
                'bonds': [
                    {
                        'ticker': 'BND',
                        'name': 'Total Bond Market ETF',
                        'type': 'bonds',
                        'category': 'bonds',
                        'category_label': 'Bonds & Fixed Income',
                        'risk': 'low',
                        'expected_return': 6.80,
                        'current_price': 72.0,
                        'description': 'Diversified sovereign and corporate bond portfolio paying regular distributions.',
                        'how_it_works': 'Tracks benchmark bond indices, counterbalancing stock market pullbacks.',
                        'why_recommended': 'Reduces portfolio volatility while delivering steady yields.'
                    }
                ],
                'stocks': [
                    {
                        'ticker': 'AAPL',
                        'name': 'Apple Inc.',
                        'type': 'stock',
                        'category': 'stocks',
                        'category_label': 'Equities & Stocks',
                        'risk': 'medium',
                        'expected_return': 16.50,
                        'current_price': 320.0,
                        'description': 'Global consumer technology giant with 2.2+ billion active installed devices and high-margin services.',
                        'how_it_works': 'Generates immense operating cash flows from iPhone, Mac, Cloud, App Store, and AI subscriptions.',
                        'why_recommended': 'Unmatched customer loyalty, massive annual share buybacks, and reliable long-term capital growth.'
                    },
                    {
                        'ticker': 'MSFT',
                        'name': 'Microsoft Corp.',
                        'type': 'stock',
                        'category': 'stocks',
                        'category_label': 'Equities & Stocks',
                        'risk': 'medium',
                        'expected_return': 15.80,
                        'current_price': 415.0,
                        'description': 'Dominant enterprise cloud (Azure), productivity software (Office 365), and AI leader.',
                        'how_it_works': 'Mission-critical enterprise B2B recurring subscription contracts across 95% of Fortune 500 companies.',
                        'why_recommended': 'Monopoly-like moat in software and cloud computing with strong financial fortress.'
                    }
                ],
                'mutual_funds': [
                    {
                        'ticker': 'SPY',
                        'name': 'S&P 500 Index Fund',
                        'type': 'etf',
                        'category': 'mutual_funds',
                        'category_label': 'Index & Mutual Funds',
                        'risk': 'medium',
                        'expected_return': 12.50,
                        'current_price': 770.0,
                        'description': 'Broad-market equity ETF tracking the 500 most profitable market leaders.',
                        'how_it_works': 'Diversified across tech, healthcare, financials, and consumer goods.',
                        'why_recommended': 'Historical 10-12% CAGR over 30+ years with instant diversification.'
                    },
                    {
                        'ticker': 'QQQ',
                        'name': 'Nasdaq 100 Index Fund',
                        'type': 'etf',
                        'category': 'mutual_funds',
                        'category_label': 'Index & Mutual Funds',
                        'risk': 'medium',
                        'expected_return': 17.50,
                        'current_price': 718.0,
                        'description': 'Top 100 large-cap non-financial innovators listed on Nasdaq.',
                        'how_it_works': 'Focused heavy allocation to high-growth tech, cloud, and digital platforms.',
                        'why_recommended': 'Captures secular technology outperformance with institutional risk management.'
                    }
                ],
                'gold': [
                    {
                        'ticker': 'GLD',
                        'name': 'Gold ETF / SGB',
                        'type': 'gold',
                        'category': 'gold',
                        'category_label': 'Precious Metals & Gold',
                        'risk': 'low',
                        'expected_return': 9.80,
                        'current_price': 406.0,
                        'description': 'Pure bullion hedge that rises when currency depreciates or markets experience volatility.',
                        'how_it_works': 'Physical gold vault custodian backed notes trading real-time on stock exchanges.',
                        'why_recommended': 'Essential 10% portfolio shock-absorber for geopolitical and inflationary uncertainty.'
                    }
                ]
            },
            'aggressive': {
                'banking': [
                    {
                        'ticker': 'HDFC_FD',
                        'name': 'High-Yield Bank Deposit',
                        'type': 'banking',
                        'category': 'banking',
                        'category_label': 'Liquid Cash & Banking',
                        'risk': 'low',
                        'expected_return': 7.25,
                        'current_price': 1000.0,
                        'description': 'Minimal liquidity buffer for emergency opportunistic market dip buying.',
                        'how_it_works': 'Readily accessible sweep account yielding guaranteed fixed return.',
                        'why_recommended': 'Dry powder ready to deploy into high-growth equity during market corrections.'
                    }
                ],
                'stocks': [
                    {
                        'ticker': 'NVDA',
                        'name': 'NVIDIA Corporation',
                        'type': 'stock',
                        'category': 'stocks',
                        'category_label': 'High-Growth Equities',
                        'risk': 'high',
                        'expected_return': 28.00,
                        'current_price': 230.0,
                        'description': 'Monopoly in generative AI GPUs, datacenter supercomputing, and CUDA software ecosystem.',
                        'how_it_works': 'Supplies the hardware engines powering ChatGPT, cloud AI training, and autonomous robotics.',
                        'why_recommended': 'Highest revenue and profit margin growth across global tech with massive secular tailwinds.'
                    },
                    {
                        'ticker': 'TSLA',
                        'name': 'Tesla Inc.',
                        'type': 'stock',
                        'category': 'stocks',
                        'category_label': 'High-Growth Equities',
                        'risk': 'high',
                        'expected_return': 24.00,
                        'current_price': 354.0,
                        'description': 'Global pioneer in electric vehicles, full self-driving (FSD), energy storage megapacks, and humanoid robotics.',
                        'how_it_works': 'Disrupting traditional automakers with software-defined vehicles, energy grid storage, and robotaxis.',
                        'why_recommended': 'Tremendous multi-year exponential upside potential for high risk tolerance investors.'
                    },
                    {
                        'ticker': 'AMD',
                        'name': 'Advanced Micro Devices',
                        'type': 'stock',
                        'category': 'stocks',
                        'category_label': 'High-Growth Equities',
                        'risk': 'high',
                        'expected_return': 22.00,
                        'current_price': 477.0,
                        'description': 'Key competitor in high-performance CPU architectures and MI300 series AI accelerator hardware.',
                        'how_it_works': 'Captures market share in enterprise datacenter servers and high-end gaming/PC processors.',
                        'why_recommended': 'High-beta momentum asset that compounds rapidly during semiconductor bull runs.'
                    }
                ],
                'mutual_funds': [
                    {
                        'ticker': 'QQQ',
                        'name': 'Nasdaq 100 ETF',
                        'type': 'etf',
                        'category': 'mutual_funds',
                        'category_label': 'Growth ETFs & Funds',
                        'risk': 'high',
                        'expected_return': 18.50,
                        'current_price': 718.0,
                        'description': 'Aggressive high-growth technology ETF concentrating top innovation leaders.',
                        'how_it_works': 'Liquid ETF providing leverage to mega-cap software and AI advances.',
                        'why_recommended': 'Consistently outperforms broader market benchmarks over multi-year horizons.'
                    },
                    {
                        'ticker': 'SMH',
                        'name': 'VanEck Semiconductor ETF',
                        'type': 'etf',
                        'category': 'mutual_funds',
                        'category_label': 'Growth ETFs & Funds',
                        'risk': 'high',
                        'expected_return': 25.00,
                        'current_price': 567.0,
                        'description': 'Pure-play basket of the world\'s top 25 semiconductor chip designers and foundries.',
                        'how_it_works': 'Holds NVIDIA, TSMC, ASML, Broadcom, and Qualcomm in a high-conviction basket.',
                        'why_recommended': 'Direct participation in the silicon infrastructure of the global digital economy.'
                    }
                ],
                'gold': [
                    {
                        'ticker': 'GLD',
                        'name': 'Gold ETF / SGB',
                        'type': 'gold',
                        'category': 'gold',
                        'category_label': 'Precious Metals & Gold',
                        'risk': 'low',
                        'expected_return': 9.50,
                        'current_price': 406.0,
                        'description': 'Strategic 5% gold hedge for wealth preservation.',
                        'how_it_works': 'Non-correlated asset providing portfolio stability when tech equities experience pullbacks.',
                        'why_recommended': 'Insurance policy protecting high-beta equity gains against market shocks.'
                    }
                ]
            }
        }
    
    def get_category_allocations(self, risk_level: str) -> Dict[str, float]:
        """Returns realistic asset class allocation percentages (summing to 100%)"""
        allocations = {
            'conservative': {
                'banking': 45.0,      # Fixed Deposits & Bank Savings
                'bonds': 15.0,        # Sovereign & Debt Bonds
                'stocks': 15.0,       # Defensive Blue-Chip Stocks
                'mutual_funds': 15.0, # Large-Cap Index Funds
                'gold': 10.0          # Gold / Sovereign Gold Bonds
            },
            'moderate': {
                'banking': 20.0,      # Fixed Deposits
                'bonds': 10.0,        # Debt Funds
                'stocks': 35.0,       # Core Equities (Blue-chips & Leaders)
                'mutual_funds': 25.0, # Broad Index ETFs (S&P 500 / Nasdaq)
                'gold': 10.0          # Gold Hedge
            },
            'aggressive': {
                'banking': 5.0,       # Emergency Cash
                'bonds': 5.0,         # Short-Term Yield
                'stocks': 55.0,       # High-Growth & Tech Stocks
                'mutual_funds': 30.0, # Sectoral & Innovation ETFs (Semiconductors / Tech)
                'gold': 5.0           # Tactical Gold
            }
        }
        return allocations.get(risk_level.lower(), allocations['moderate'])
    
    def fetch_live_market_data(self, tickers: List[str]) -> Dict[str, Dict]:
        """Fetches live quotes for tradable tickers with graceful fallback"""
        market_data = {}
        for ticker in tickers:
            if '_' in ticker: # Non-market assets like HDFC_FD, SBI_FD
                continue
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(period='1y')
                if not hist.empty and len(hist) > 5:
                    current_price = float(hist['Close'].iloc[-1])
                    one_year_return = float(((hist['Close'].iloc[-1] / hist['Close'].iloc[0]) - 1) * 100)
                    volatility = float(hist['Close'].pct_change().std() * np.sqrt(252) * 100)
                    market_data[ticker] = {
                        'current_price': round(current_price, 2),
                        '1y_return_percent': round(one_year_return, 2),
                        'volatility_percent': round(volatility, 2)
                    }
            except Exception as e:
                print(f"Warning fetching live data for {ticker}: {e}")
        return market_data
    
    def generate_recommendations(self, risk_level: str, investment_amount: float = 100000) -> Dict:
        norm_risk = risk_level.lower().strip()
        if norm_risk not in self.asset_catalog:
            norm_risk = 'moderate'
            
        category_splits = self.get_category_allocations(norm_risk)
        catalog = self.asset_catalog[norm_risk]
        
        # Collect tickers to fetch live market data
        tradable_tickers = [
            asset['ticker'] 
            for cat_assets in catalog.values() 
            for asset in cat_assets
            if '_' not in asset['ticker']
        ]
        live_data = self.fetch_live_market_data(tradable_tickers)
        
        recommendations = []
        category_summaries = {}
        total_projected_annual_profit = 0.0
        
        for category, cat_percent in category_splits.items():
            cat_amount = investment_amount * (cat_percent / 100.0)
            assets_in_cat = catalog.get(category, [])
            if not assets_in_cat:
                continue
                
            # Distribute category amount across items in this category
            cat_asset_count = len(assets_in_cat)
            per_asset_percent = round(cat_percent / cat_asset_count, 2)
            per_asset_amount = round(cat_amount / cat_asset_count, 2)
            
            cat_expected_returns = []
            
            for asset in assets_in_cat:
                t = asset['ticker']
                live_info = live_data.get(t, {})
                
                cur_price = live_info.get('current_price', asset.get('current_price', 100.0))
                ret_1y = live_info.get('1y_return_percent', asset.get('expected_return', 10.0))
                vol = live_info.get('volatility_percent', 15.0)
                
                exp_return = asset.get('expected_return', ret_1y)
                cat_expected_returns.append(exp_return)
                
                annual_profit = round(per_asset_amount * (exp_return / 100.0), 2)
                total_projected_annual_profit += annual_profit
                
                est_shares = round(per_asset_amount / cur_price, 2) if cur_price > 0 else 0
                
                recommendations.append({
                    'ticker': t,
                    'name': asset['name'],
                    'type': asset['type'],
                    'category': category,
                    'category_label': asset.get('category_label', category.replace('_', ' ').title()),
                    'risk': asset['risk'],
                    'allocation_percent': per_asset_percent,
                    'allocation_amount': per_asset_amount,
                    'expected_return_percent': exp_return,
                    'projected_annual_profit': annual_profit,
                    'current_price': cur_price,
                    '1y_return_percent': ret_1y,
                    'volatility_percent': vol,
                    'estimated_shares': est_shares,
                    'description': asset.get('description', ''),
                    'how_it_works': asset.get('how_it_works', ''),
                    'why_recommended': asset.get('why_recommended', '')
                })
            
            avg_cat_return = round(sum(cat_expected_returns) / len(cat_expected_returns), 2) if cat_expected_returns else 0.0
            cat_profit = round(cat_amount * (avg_cat_return / 100.0), 2)
            
            category_summaries[category] = {
                'category': category,
                'category_label': assets_in_cat[0].get('category_label', category.replace('_', ' ').title()),
                'allocation_percent': cat_percent,
                'allocation_amount': cat_amount,
                'expected_return_percent': avg_cat_return,
                'projected_annual_profit': cat_profit,
                'asset_count': cat_asset_count
            }
        
        overall_expected_return_percent = round((total_projected_annual_profit / investment_amount) * 100.0, 2) if investment_amount > 0 else 0.0
        
        # Format asset_class_allocations for chart compatibility
        chart_allocations = {
            'stocks': category_splits.get('stocks', 0),
            'bonds': category_splits.get('bonds', 0),
            'banking': category_splits.get('banking', 0),
            'mutualFunds': category_splits.get('mutual_funds', 0),
            'gold': category_splits.get('gold', 0)
        }
        
        return {
            'risk_level': norm_risk,
            'total_investment': investment_amount,
            'projected_annual_profit': round(total_projected_annual_profit, 2),
            'expected_return_percent': overall_expected_return_percent,
            'asset_class_allocations': chart_allocations,
            'category_summaries': category_summaries,
            'recommendations': recommendations
        }

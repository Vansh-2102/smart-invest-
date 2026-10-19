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

    def calculate_post_tax_returns(self, allocations: Dict) -> Dict:
        """Member method delegating to calculate_post_tax_returns"""
        return calculate_post_tax_returns(allocations)
    
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

        # DICGC Banking Safety Tracking
        dicgc_status = {
            'dicgc_limit_exceeded': False,
            'statutory_limit_per_bank': DICGC_MAX_LIMIT_PER_BANK,
            'total_banking_allocation': 0.0,
            'insured_principal': 0.0,
            'uninsured_principal': 0.0,
            'institutions_utilized': 0,
            'partner_bank_distribution': [],
            'safety_advisory': 'No banking capital allocated.'
        }
        
        for category, cat_percent in category_splits.items():
            cat_amount = investment_amount * (cat_percent / 100.0)
            assets_in_cat = catalog.get(category, [])
            if not assets_in_cat:
                continue

            # Special Handling for Banking category under RBI DICGC Rules
            if category == 'banking':
                banking_cap = cat_amount
                needed_institutions = min(
                    len(PARTNER_BANKS_POOL), 
                    max(len(assets_in_cat), int(np.ceil(banking_cap / DICGC_MAX_LIMIT_PER_BANK)))
                )
                
                # If banking allocation exceeds ₹5,00,000 per bank or total banking > 5L,
                # expand to partner banks pool to maximize FDIC/DICGC insurance cover
                if banking_cap > DICGC_MAX_LIMIT_PER_BANK or len(assets_in_cat) < needed_institutions:
                    assets_in_cat = PARTNER_BANKS_POOL[:needed_institutions]
                    limit_exceeded = True
                else:
                    limit_exceeded = False

                cat_asset_count = len(assets_in_cat)
                per_asset_percent = round(cat_percent / cat_asset_count, 2)
                per_asset_amount = round(cat_amount / cat_asset_count, 2)

                max_insured_cap = cat_asset_count * DICGC_MAX_LIMIT_PER_BANK
                insured_principal = min(banking_cap, max_insured_cap)
                uninsured_principal = max(0.0, banking_cap - max_insured_cap)

                if uninsured_principal > 0:
                    safety_msg = (
                        f"DICGC Limit Warning: Total banking capital ₹{banking_cap:,.2f} exceeds capacity "
                        f"across {cat_asset_count} partner banks. ₹{insured_principal:,.2f} is fully protected by RBI DICGC insurance; "
                        f"₹{uninsured_principal:,.2f} remains as uninsured principal."
                    )
                elif limit_exceeded:
                    safety_msg = (
                        f"DICGC Compliance Enforced: Total banking capital ₹{banking_cap:,.2f} dynamically split across "
                        f"{cat_asset_count} partner scheduled commercial banks, maintaining all deposits within the ₹5,00,000 statutory insurance limit."
                    )
                else:
                    safety_msg = (
                        f"Fully Insured: All banking deposits are within the ₹5,00,000 RBI DICGC statutory coverage per institution."
                    )

                bank_dist_list = []
                for b_asset in assets_in_cat:
                    b_insured = min(per_asset_amount, DICGC_MAX_LIMIT_PER_BANK)
                    b_uninsured = max(0.0, per_asset_amount - DICGC_MAX_LIMIT_PER_BANK)
                    bank_dist_list.append({
                        'bank': b_asset['name'],
                        'institution': b_asset.get('institution', b_asset['name']),
                        'allocated_amount': per_asset_amount,
                        'insured_amount': b_insured,
                        'uninsured_amount': b_uninsured,
                        'is_fully_insured': per_asset_amount <= DICGC_MAX_LIMIT_PER_BANK
                    })

                dicgc_status = {
                    'dicgc_limit_exceeded': limit_exceeded,
                    'statutory_limit_per_bank': DICGC_MAX_LIMIT_PER_BANK,
                    'total_banking_allocation': round(banking_cap, 2),
                    'insured_principal': round(insured_principal, 2),
                    'uninsured_principal': round(uninsured_principal, 2),
                    'institutions_utilized': cat_asset_count,
                    'partner_bank_distribution': bank_dist_list,
                    'safety_advisory': safety_msg
                }
            else:
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
                
                # Statutory Tax Tagging per Asset Class
                if category in ['stocks', 'mutual_funds']:
                    tax_tag = "LTCG Equity (Post-Budget 2024: 12.5% above ₹1.25L exemption)"
                elif category == 'banking':
                    tax_tag = "Interest Income (Section 194A: 10% TDS above ₹40,000 threshold)"
                elif category == 'gold':
                    tax_tag = "Sovereign Gold Bond / Bullion (Section 47(viic): Redemption is 100% Tax-Exempt)"
                elif category == 'bonds':
                    tax_tag = "Debt Securities (Section 50AA: Taxable at applicable slab rates)"
                elif category == 'crypto':
                    tax_tag = "Virtual Digital Assets (Section 115BBH: Flat 31.2% Tax)"
                else:
                    tax_tag = "Standard Capital Gains"

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
                    'why_recommended': asset.get('why_recommended', ''),
                    'tax_classification': tax_tag,
                    'dicgc_insured': category == 'banking' and per_asset_amount <= DICGC_MAX_LIMIT_PER_BANK
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
        
        # Calculate post-tax returns across entire recommended portfolio
        tax_calculation = calculate_post_tax_returns({'recommendations': recommendations})

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
            'gross_projected_profit': tax_calculation['gross_projected_profit'],
            'estimated_tax_liability': tax_calculation['estimated_tax_liability'],
            'net_projected_profit': tax_calculation['net_projected_profit'],
            'effective_tax_rate_pct': tax_calculation['effective_tax_rate_pct'],
            'tax_breakdown': tax_calculation['tax_breakdown'],
            'dicgc_insurance_status': dicgc_status,
            'projected_annual_profit': tax_calculation['gross_projected_profit'],  # Backward-compatible alias
            'expected_return_percent': overall_expected_return_percent,
            'net_return_percent': round((tax_calculation['net_projected_profit'] / investment_amount) * 100.0, 2) if investment_amount > 0 else 0.0,
            'asset_class_allocations': chart_allocations,
            'category_summaries': category_summaries,
            'recommendations': recommendations
        }


DICGC_MAX_LIMIT_PER_BANK = 500000.0  # ₹5,00,000 RBI statutory insurance ceiling

PARTNER_BANKS_POOL = [
    {
        'ticker': 'HDFC_FD',
        'name': 'HDFC Bank Term Deposit',
        'type': 'banking',
        'category': 'banking',
        'category_label': 'Fixed Deposits & Banking',
        'risk': 'low',
        'expected_return': 7.25,
        'current_price': 1000.0,
        'institution': 'HDFC Bank Ltd',
        'description': 'Leading private sector bank fixed deposit with sovereign-grade stability.',
        'how_it_works': 'Locked fixed interest with RBI DICGC insurance cover up to ₹5,00,000 per depositor.',
        'why_recommended': 'Guaranteed capital safety with competitive yield.'
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
        'institution': 'State Bank of India',
        'description': "India's largest public sector bank offering guaranteed government-backed returns.",
        'how_it_works': 'Deposit principal is safe with quarterly compounding interest and DICGC protection.',
        'why_recommended': 'Solid anchor for capital preservation with zero market risk.'
    },
    {
        'ticker': 'ICICI_FD',
        'name': 'ICICI Bank Fixed Deposit',
        'type': 'banking',
        'category': 'banking',
        'category_label': 'Fixed Deposits & Banking',
        'risk': 'low',
        'expected_return': 7.20,
        'current_price': 1000.0,
        'institution': 'ICICI Bank Ltd',
        'description': 'Domestic Systemically Important Bank (D-SIB) offering high safety term deposits.',
        'how_it_works': 'Compound interest accrued with independent ₹5,00,000 DICGC insurance cover.',
        'why_recommended': 'Spreads banking risk across premier private sector institutions.'
    },
    {
        'ticker': 'AXIS_FD',
        'name': 'Axis Bank Fixed Deposit',
        'type': 'banking',
        'category': 'banking',
        'category_label': 'Fixed Deposits & Banking',
        'risk': 'low',
        'expected_return': 7.10,
        'current_price': 1000.0,
        'institution': 'Axis Bank Ltd',
        'description': 'Major scheduled commercial bank providing flexible high-yield fixed deposits.',
        'how_it_works': 'Direct institutional deposit holding independent DICGC statutory cover.',
        'why_recommended': 'Diversifies liquid banking capital under regulatory insurance guidelines.'
    },
    {
        'ticker': 'KOTAK_FD',
        'name': 'Kotak Mahindra Bank FD',
        'type': 'banking',
        'category': 'banking',
        'category_label': 'Fixed Deposits & Banking',
        'risk': 'low',
        'expected_return': 7.15,
        'current_price': 1000.0,
        'institution': 'Kotak Mahindra Bank',
        'description': 'Premier scheduled commercial bank with high capital adequacy ratio (CAR).',
        'how_it_works': 'Principal + interest insured up to ₹5,00,000 by RBI subsidiary DICGC.',
        'why_recommended': 'Extends insurance boundary for larger portfolio cash allocations.'
    }
]


def calculate_post_tax_returns(allocations: Dict) -> Dict:
    """
    Computes statutory post-tax returns under Indian Income Tax provisions:
    
    1. Direct Equities & Equity Mutual Funds (Post-Budget 2024 LTCG):
       - Flat rate of 12.5% on LTCG exceeding statutory annual exemption of ₹1,25,000.
       - taxable_equity_gain = max(0, gross_gain - 125000)
       - equity_tax = taxable_equity_gain * 0.125
       
    2. Cryptocurrency / VDAs (Section 115BBH):
       - Flat rate of 30% + 4% Health & Education Cess = 31.2% on total net gains.
       - No basic exemption deduction allowed.
       - crypto_tax = gross_crypto_gain * 0.312
       
    3. Fixed Deposits / Banking (TDS & Income Tax Slab):
       - Standard ₹40,000 non-senior TDS threshold (10% withholding):
       - fd_tax = gross_fd_gain * 0.10 if gross_fd_gain > 40000 else 0.0
       
    4. Sovereign Gold Bonds (SGB) & Bonds:
       - Sovereign Gold Bonds held to redemption are 100% tax-exempt. Explicitly set sgb_tax = 0.0.
    """
    gross_equity_gain = 0.0
    gross_crypto_gain = 0.0
    gross_fd_gain = 0.0
    gross_sgb_gain = 0.0
    gross_bonds_gain = 0.0

    if 'recommendations' in allocations and isinstance(allocations['recommendations'], list):
        for asset in allocations['recommendations']:
            cat = str(asset.get('category', asset.get('type', ''))).lower()
            ticker = str(asset.get('ticker', '')).upper()
            name = str(asset.get('name', '')).upper()
            profit = float(asset.get('projected_annual_profit', 0.0))
            
            if cat in ['stocks', 'mutual_funds', 'stock', 'etf']:
                gross_equity_gain += profit
            elif cat in ['crypto', 'vda']:
                gross_crypto_gain += profit
            elif cat in ['banking', 'deposit', 'fd']:
                gross_fd_gain += profit
            elif cat in ['gold'] or 'SGB' in name or 'GOLD' in ticker or 'GLD' in ticker:
                gross_sgb_gain += profit
            elif cat in ['bonds', 'fixed_income']:
                gross_bonds_gain += profit
            else:
                gross_equity_gain += profit
    else:
        # Direct dictionary mapping category names to gains
        gross_equity_gain = float(allocations.get('equity_gain', allocations.get('stocks', 0.0) + allocations.get('mutual_funds', 0.0)))
        gross_crypto_gain = float(allocations.get('crypto_gain', allocations.get('crypto', 0.0)))
        gross_fd_gain = float(allocations.get('fd_gain', allocations.get('banking', 0.0)))
        gross_sgb_gain = float(allocations.get('sgb_gain', allocations.get('gold', 0.0)))
        gross_bonds_gain = float(allocations.get('bonds_gain', allocations.get('bonds', 0.0)))

    # 1. Direct Equities & Mutual Funds (Post-Budget 2024 LTCG: 12.5% over ₹1.25L exemption)
    equity_exemption_limit = 125000.0
    taxable_equity_gain = max(0.0, gross_equity_gain - equity_exemption_limit)
    equity_exemption_applied = min(gross_equity_gain, equity_exemption_limit)
    equity_tax = taxable_equity_gain * 0.125

    # 2. Cryptocurrency / VDAs (Section 115BBH: 30% + 4% cess = 31.2%)
    crypto_tax = max(0.0, gross_crypto_gain) * 0.312

    # 3. Fixed Deposits / Banking (10% TDS above ₹40,000 threshold)
    fd_tds_threshold = 40000.0
    fd_tax = (gross_fd_gain * 0.10) if gross_fd_gain > fd_tds_threshold else 0.0

    # 4. Sovereign Gold Bonds (SGB held to redemption are 100% tax-exempt)
    sgb_tax = 0.0
    bonds_tax = 0.0

    gross_projected_profit = round(
        gross_equity_gain + gross_crypto_gain + gross_fd_gain + gross_sgb_gain + gross_bonds_gain, 
        2
    )
    estimated_tax_liability = round(equity_tax + crypto_tax + fd_tax + sgb_tax + bonds_tax, 2)
    net_projected_profit = round(gross_projected_profit - estimated_tax_liability, 2)
    effective_tax_rate_pct = round(
        (estimated_tax_liability / gross_projected_profit * 100.0), 2
    ) if gross_projected_profit > 0 else 0.0

    return {
        'gross_projected_profit': gross_projected_profit,
        'estimated_tax_liability': estimated_tax_liability,
        'net_projected_profit': net_projected_profit,
        'effective_tax_rate_pct': effective_tax_rate_pct,
        'tax_breakdown': {
            'equity_tax': round(equity_tax, 2),
            'gross_equity_gain': round(gross_equity_gain, 2),
            'taxable_equity_gain': round(taxable_equity_gain, 2),
            'equity_exemption_applied': round(equity_exemption_applied, 2),
            'equity_tax_rate_pct': 12.5,
            'crypto_tax': round(crypto_tax, 2),
            'gross_crypto_gain': round(gross_crypto_gain, 2),
            'crypto_tax_rate_pct': 31.2,
            'fd_tax': round(fd_tax, 2),
            'gross_fd_gain': round(gross_fd_gain, 2),
            'fd_tds_threshold': fd_tds_threshold,
            'fd_tax_rate_pct': 10.0 if gross_fd_gain > fd_tds_threshold else 0.0,
            'sgb_tax': 0.0,
            'gross_sgb_gain': round(gross_sgb_gain, 2),
            'sgb_tax_exempt': True
        }
    }


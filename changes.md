# Resolution of Literature Review "Not Confirmed" Gaps in InvestIQ

This document details the architectural, mathematical, and algorithmic upgrades implemented to transition theoretical capabilities documented in the InvestIQ Literature Review into production-grade, verifiable implementations.

---

## 1. Executive Summary

| Module | Literature Review Gap | Resolution Status | Target Files |
| :--- | :--- | :--- | :--- |
| **Module 1: Real-Time Signal & Sentiment Filter** | Technical analysis and FinBERT/DistilRoBERTa news sentiment operated as disconnected silos without algorithmic confirmation or bull-trap filtering. | **RESOLVED & VERIFIED** | `ml/src/market_analysis/engine.py`<br>`ml/src/market_analysis/__init__.py`<br>`ml/api/main.py` |
| **Module 2: Statutory Tax & Banking Safety Engine** | Projected profits were strictly gross earnings without Indian tax deductions (Post-Budget 2024 LTCG, Sec 115BBH, TDS) or RBI DICGC bank deposit safeguards. | **RESOLVED & VERIFIED** | `ml/src/investment_recommendation/engine.py`<br>`ml/src/investment_recommendation/__init__.py`<br>`ml/api/main.py`<br>`backend/.../Recommendation.java`<br>`backend/.../RecommendationService.java`<br>`frontend/src/pages/Recommendations.jsx` |

---

## 2. MODULE 1: Real-Time Signal & Sentiment Confirmation Filter

### 2.1 Problem Solved
Previously, technical indicators (RSI(14), MACD, Moving Averages) generated isolated trading triggers without verifying whether breaking macroeconomic or company-specific financial news validated or opposed the indicator. This left users vulnerable to **bull traps** (technical buy signals occurring during severe negative news headwind) and **premature exits** (selling overbought assets experiencing positive breakout momentum).

### 2.2 Mathematical Formulations

#### 1. Momentum Normalization
RSI (14-period momentum) ranges from $[0, 100]$. It is normalized into a symmetrical bipolar momentum score $\text{tech\_score} \in [-1.0, 1.0]$:
$$\text{tech\_score} = \text{clamp}\left(\frac{\text{RSI} - 50}{50}, -1.0, 1.0\right)$$
- If $\text{RSI} = 50 \implies \text{tech\_score} = 0.0$ (Neutral momentum)
- If $\text{RSI} = 70 \implies \text{tech\_score} = +0.40$ (Overbought momentum)
- If $\text{RSI} = 30 \implies \text{tech\_score} = -0.40$ (Oversold momentum)
- If $\text{RSI} = 100 \implies \text{tech\_score} = +1.0$
- If $\text{RSI} = 0 \implies \text{tech\_score} = -1.0$

#### 2. Sentiment Score Mapping
Financial news sentiment from DistilRoBERTa / FinBERT is mapped to $[-1.0, 1.0]$:
$$\text{sentiment\_score} = \begin{cases} 
+\text{confidence} & \text{if Sentiment is Positive} \\
-\text{confidence} & \text{if Sentiment is Negative} \\
0.0 & \text{if Sentiment is Neutral}
\end{cases}$$

#### 3. Composite Signal Calculation
The integrated composite score weights technical signals at 60% and sentiment at 40%:
$$\text{composite\_score} = 0.6 \cdot \text{tech\_score} + 0.4 \cdot \text{sentiment\_score}$$

### 2.3 Concrete Confirmation Rules

1. **Rule 1: Bearish News Headwind (Bull Trap Prevention)**
   - **Condition:** Technical indicator triggers `BUY` (e.g. oversold $\text{RSI} < 30$ or MACD bullish crossover), but $\text{sentiment\_score} \le -0.30$.
   - **Signal Downgrade:** `"HOLD / CAUTION: Bearish News Headwind"`
   - **Divergence Flag:** `divergence_warning = True`

2. **Rule 2: Bullish Sentiment Confirmation**
   - **Condition:** Technical indicator triggers `BUY` and $\text{sentiment\_score} \ge +0.25$.
   - **Signal Upgrade:** `"STRONG BUY: Confirmed by Bullish Sentiment"`
   - **Divergence Flag:** `divergence_warning = False`

3. **Rule 3: Positive Momentum Breakout (Short Squeeze / Overbought Runner)**
   - **Condition:** Technical indicator triggers `SELL` ($\text{RSI} > 70$) but $\text{sentiment\_score} \ge +0.40$.
   - **Signal Modification:** `"HOLD / OVERBOUGHT: Positive Momentum Breakout"`
   - **Divergence Flag:** `divergence_warning = True`

4. **Rule 4: Bearish Confirmation**
   - **Condition:** Technical indicator triggers `SELL` and $\text{sentiment\_score} \le -0.25$.
   - **Signal Upgrade:** `"STRONG SELL: Confirmed by Bearish Sentiment"`
   - **Divergence Flag:** `divergence_warning = False`

### 2.4 API Integration & Signatures
- **Standalone & Class Method:**
  `get_confirmed_signal(ticker: str, price_data, sentiment_score: Optional[float] = None) -> Dict`
- **FastAPI Endpoints:**
  - `GET /api/market/analyze/{ticker}?period=1y&sentiment_score={score}`
  - `POST /api/market/confirmed-signal` with payload `{"ticker": "...", "rsi": 26.0, "macd": 0.0, "signal_line": 0.0, "sentiment_score": -0.45}`
- **Response JSON Output:**
  ```json
  {
    "ticker": "TCS.NS",
    "technical_signal": "BUY",
    "rsi": 26.0,
    "tech_score": -0.48,
    "sentiment_score": -0.45,
    "composite_score": -0.468,
    "final_confirmed_signal": "HOLD / CAUTION: Bearish News Headwind",
    "divergence_warning": true
  }
  ```

---

## 3. MODULE 2: Statutory Tax & Banking Safety Deduction Engine

### 3.1 Problem Solved
Previously, portfolio projections only calculated gross annual profit ($\text{Profit} = \text{Allocation} \times \frac{\text{Expected Return}}{100}$). This failed to account for real-world post-tax net returns under Indian Income Tax regulations and ignored RBI safety guidelines on banking concentration risk.

### 3.2 Indian Statutory Tax Provisions Implemented

1. **Direct Equities & Equity Mutual Funds (Post-Budget 2024 LTCG):**
   - Applies to holding periods $\ge 1$ year.
   - Statutory annual LTCG exemption limit: **₹1,25,000**.
   - Flat tax rate: **12.5%** on gains exceeding ₹1,25,000.
   $$\text{taxable\_equity\_gain} = \max(0, \text{gross\_equity\_gain} - 125000)$$
   $$\text{equity\_tax} = \text{taxable\_equity\_gain} \times 0.125$$

2. **Cryptocurrency & Virtual Digital Assets (VDAs) (Section 115BBH):**
   - Flat tax rate: **30%** plus **4% Health & Education Cess** = **31.2%**.
   - No basic exemption deduction allowed; no deduction for expenses or set-off of losses.
   $$\text{crypto\_tax} = \max(0, \text{gross\_crypto\_gain}) \times 0.312$$

3. **Fixed Deposits & Banking Term Deposits (Section 194A TDS):**
   - Standard non-senior citizen interest threshold: **₹40,000**.
   - Standard 10% TDS withholding:
   $$\text{fd\_tax} = \begin{cases} \text{gross\_fd\_gain} \times 0.10 & \text{if } \text{gross\_fd\_gain} > 40000 \\ 0.0 & \text{otherwise} \end{cases}$$

4. **Sovereign Gold Bonds (SGB) (Section 47(viic)):**
   - Capital gains arising on redemption of Sovereign Gold Bonds by an individual are **100% tax-exempt**.
   $$\text{sgb\_tax} = 0.0$$

5. **Aggregate Metrics:**
   $$\text{gross\_projected\_profit} = \sum \text{gross gains across all asset classes}$$
   $$\text{estimated\_tax\_liability} = \text{equity\_tax} + \text{crypto\_tax} + \text{fd\_tax} + \text{sgb\_tax}$$
   $$\text{net\_projected\_profit} = \text{gross\_projected\_profit} - \text{estimated\_tax\_liability}$$
   $$\text{effective\_tax\_rate\_pct} = \frac{\text{estimated\_tax\_liability}}{\text{gross\_projected\_profit}} \times 100$$

### 3.3 Banking Safety Constraint (RBI DICGC Rule)

- Under the Deposit Insurance and Credit Guarantee Corporation (DICGC) Act, deposits across all branches of a single scheduled commercial bank are insured up to a maximum limit of **₹5,00,000** per depositor per bank.
- **Enforcement Rules:**
  - If total allocated banking capital exceeds ₹5,00,000:
    - Flag `dicgc_limit_exceeded = True`.
    - Dynamically distribute the deposit across a pre-vetted pool of RBI-supervised Scheduled Commercial Banks (HDFC Bank, State Bank of India, ICICI Bank, Axis Bank, Kotak Mahindra Bank).
    - If total banking capital exceeds the collective insurance capacity across all partner institutions (e.g. $> ₹25,00,000$ across 5 banks), the excess amount is explicitly flagged as `uninsured_principal`.

### 3.4 Response Payload Structure
The recommendations endpoint (`/api/investment/recommend`) and engine now return:
```json
{
  "risk_level": "conservative",
  "total_investment": 2000000.0,
  "gross_projected_profit": 173575.0,
  "estimated_tax_liability": 6412.5,
  "net_projected_profit": 167162.5,
  "effective_tax_rate_pct": 3.69,
  "tax_breakdown": {
    "equity_tax": 0.0,
    "gross_equity_gain": 70050.0,
    "taxable_equity_gain": 0.0,
    "equity_exemption_applied": 70050.0,
    "equity_tax_rate_pct": 12.5,
    "crypto_tax": 0.0,
    "crypto_tax_rate_pct": 31.2,
    "fd_tax": 6412.5,
    "gross_fd_gain": 64125.0,
    "fd_tds_threshold": 40000.0,
    "fd_tax_rate_pct": 10.0,
    "sgb_tax": 0.0,
    "gross_sgb_gain": 19000.0,
    "sgb_tax_exempt": true
  },
  "dicgc_insurance_status": {
    "dicgc_limit_exceeded": true,
    "statutory_limit_per_bank": 500000.0,
    "total_banking_allocation": 900000.0,
    "insured_principal": 900000.0,
    "uninsured_principal": 0.0,
    "institutions_utilized": 2,
    "partner_bank_distribution": [
      {
        "bank": "HDFC Bank Term Deposit",
        "institution": "HDFC Bank Ltd",
        "allocated_amount": 450000.0,
        "insured_amount": 450000.0,
        "uninsured_amount": 0.0,
        "is_fully_insured": true
      },
      {
        "bank": "SBI Term Deposit",
        "institution": "State Bank of India",
        "allocated_amount": 450000.0,
        "insured_amount": 450000.0,
        "uninsured_amount": 0.0,
        "is_fully_insured": true
      }
    ],
    "safety_advisory": "DICGC Compliance Enforced: Total banking capital ₹900,000.00 dynamically split across 2 partner scheduled commercial banks, maintaining all deposits within the ₹5,00,000 statutory insurance limit."
  },
  "projected_annual_profit": 173575.0,
  "expected_return_percent": 8.68,
  "net_return_percent": 8.36,
  "asset_class_allocations": { ... },
  "category_summaries": { ... },
  "recommendations": [ ... ]
}
```

---

## 4. Backend & Frontend Synchronizations

### 4.1 Spring Boot Backend (`backend/`)
- Updated `Recommendation.java` entity:
  - Added `grossProjectedProfit`, `estimatedTaxLiability`, `netProjectedProfit`, and `effectiveTaxRatePct` (`BigDecimal`).
  - Added JSON mapped columns: `dicgcInsuranceStatus` and `taxBreakdown`.
- Updated `RecommendationService.java`:
  - Enriched entity mapper to capture tax figures and DICGC audit payloads upon generation.
- Verified build: `mvnw compile -DskipTests` $\to$ **BUILD SUCCESS**.

### 4.2 React Frontend (`frontend/src/pages/Recommendations.jsx`)
- Rendered two metric cards:
  - **Net Post-Tax Earnings (Est.)** in teal theme with statutory deduction badge.
  - **Statutory Tax Liability** in amber theme displaying effective rate and breakdown.
- Rendered **RBI DICGC Banking Safety Safeguard Banner**:
  - Displays dynamic multi-bank distribution chips (e.g. `HDFC Bank: ₹4,50,000 ✓ (100% Insured)`).
  - Flags concentration warnings if single-institution limits are exceeded.
- Verified build: `npm run build` $\to$ **Built successfully in 3.58s**.

---

## 5. Verification & Test Evidence

### 5.1 Python Automated Unit Tests
1. `ml/tests/test_signal_sentiment_confirmation.py`
   - Tested RSI normalization $[-1.0, 1.0]$.
   - Tested composite score calculation ($0.6 \times \text{tech} + 0.4 \times \text{sentiment}$).
   - Tested Bull Trap Rule (RSI 25 + sentiment -0.45 $\to$ `"HOLD / CAUTION: Bearish News Headwind"`, `divergence_warning=True`).
   - Tested Bullish Confirmation (RSI 28 + sentiment 0.60 $\to$ `"STRONG BUY"`, `divergence_warning=False`).
   - Tested Overbought Breakout (RSI 75 + sentiment 0.55 $\to$ `"HOLD / OVERBOUGHT: Positive Momentum Breakout"`, `divergence_warning=True`).
   - **Result:** `All signal confirmation filter tests passed successfully!`

2. `ml/tests/test_tax_and_banking_engine.py`
   - Tested Post-Budget 2024 LTCG ₹1.25L exemption and 12.5% rate.
   - Tested Section 115BBH 31.2% flat crypto tax with zero exemption.
   - Tested Section 194A FD TDS threshold (exempt $\le ₹40,000$, 10% on $> ₹40,000$).
   - Tested Section 47(viic) SGB 100% tax exemption upon redemption.
   - Tested multi-bank DICGC split and ₹5,00,000 threshold verification.
   - **Result:** `All statutory tax and banking safety engine tests passed successfully!`

### 5.2 Live HTTP API Verifications
- `POST /api/market/confirmed-signal`: Returned HTTP 200 with `composite_score`, `final_confirmed_signal`, and `divergence_warning`.
- `POST /api/investment/recommend`: Returned HTTP 200 with `gross_projected_profit`, `estimated_tax_liability`, `net_projected_profit`, `effective_tax_rate_pct`, and `dicgc_insurance_status`.
- `POST /api/investment/post-tax-calculate`: Returned HTTP 200 with granular statutory breakdown.

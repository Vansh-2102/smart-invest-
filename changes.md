# Resolution of Literature Review "Not Confirmed" Gaps in InvestIQ

This document details the architectural, mathematical, and algorithmic upgrades implemented to transition theoretical capabilities documented in the InvestIQ Literature Review into production-grade, verifiable implementations.

---

## 1. Executive Summary

| Module | Literature Review Gap | Resolution Status | Target Files |
| :--- | :--- | :--- | :--- |
| **Module 1: Real-Time Signal & Sentiment Filter** | Technical analysis and FinBERT/DistilRoBERTa news sentiment operated as disconnected silos without algorithmic confirmation or bull-trap filtering. | **RESOLVED & VERIFIED** | `ml/src/market_analysis/engine.py`<br>`ml/src/market_analysis/__init__.py`<br>`ml/api/main.py` |
| **Module 2: Statutory Tax & Banking Safety Engine** | Projected profits were strictly gross earnings without Indian tax deductions (Post-Budget 2024 LTCG, Sec 115BBH, TDS) or RBI DICGC bank deposit safeguards. | **RESOLVED & VERIFIED** | `ml/src/investment_recommendation/engine.py`<br>`ml/src/investment_recommendation/__init__.py`<br>`ml/api/main.py`<br>`backend/.../Recommendation.java`<br>`backend/.../RecommendationService.java`<br>`frontend/src/pages/Recommendations.jsx` |
| **Gap 1: SHAP Explainability for XGBoost (Paper 20)** | Black-box risk tier classifications lacked local feature attribution and human-interpretable rationale for why users were assigned to conservative, moderate, or aggressive tiers. | **RESOLVED & VERIFIED** | `ml/src/risk_assessment/model.py`<br>`ml/api/main.py`<br>`backend/.../FinancialProfile.java`<br>`backend/.../FinancialProfileService.java` |
| **Gap 2: Continuous Markowitz SLSQP Optimizer (Paper 7)** | Static empirical allocation bands failed to continuously optimize the risk-return frontier (Sharpe ratio) under dynamic regulatory bounds. | **RESOLVED & VERIFIED** | `ml/src/investment_recommendation/optimizer.py`<br>`ml/src/investment_recommendation/engine.py`<br>`ml/src/investment_recommendation/__init__.py`<br>`ml/api/main.py` |
| **Gap 3: Dynamic Market Volatility Drift Engine (Paper 1)** | Static risk profiling neglected macro systemic market volatility shocks, leaving aggressive and moderate portfolios exposed during market drawdowns. | **RESOLVED & VERIFIED** | `ml/src/risk_assessment/drift_engine.py`<br>`ml/src/risk_assessment/__init__.py`<br>`ml/src/investment_recommendation/engine.py`<br>`ml/api/main.py`<br>`backend/.../Recommendation.java`<br>`backend/.../RecommendationService.java` |


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

---

## 6. GAP 1: SHAP TreeExplainer Explainability for XGBoost Risk Engine (Paper 20)

### 6.1 Problem Solved
Previously, user risk profiling operated as an opaque "black-box" model. An `XGBClassifier` mapped demographic and financial traits (`age`, `income`, `investment_experience`, `risk_tolerance`, `investment_goal`, `time_horizon`, `debt_to_income`) directly to risk classes (`conservative`, `moderate`, `aggressive`) without surfacing the underlying causal factors. Users and regulatory audits could not determine which features drove the classification.

### 6.2 Mathematical & Algorithmic Implementation
1. **Shapley Value Formulation:**
   Based on cooperative game theory, the Shapley value $\phi_i$ of feature $i$ represents its marginal contribution across all possible feature subsets $S \subseteq F \setminus \{i\}$:
   $$\phi_i(x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f(S \cup \{i\}) - f(S) \right]$$

2. **SHAP TreeExplainer Integration:**
   - In `ml/src/risk_assessment/model.py`, initialized and cached `shap.TreeExplainer(self.model)`.
   - Extracted Shapley contributions for the predicted class index $k$:
     $$\text{contributions} = \Phi[:, :, k]$$
   - Paired each feature with its signed Shapley value:
     - $\phi_i > 0 \implies \text{Positive impact (increased likelihood of assigned tier)}$
     - $\phi_i < 0 \implies \text{Negative impact (decreased likelihood)}$
   - Sorted features by absolute magnitude $|\phi_i|$ descending and selected the **top 3 drivers**.

3. **Natural-Language Rationale Generation:**
   ```python
   {
       "feature": feature_name,
       "shap_value": round(float(val), 4),
       "impact": "positive" if val > 0 else "negative",
       "reason": f"{feature_name.replace('_', ' ').title()} {'increased' if val > 0 else 'decreased'} probability for {predicted_tier} tier by {abs(val):.2f}"
   }
   ```

### 6.3 API Response Payload
When requesting `POST /api/risk/assess`:
```json
{
  "success": true,
  "data": {
    "risk_level": "aggressive",
    "riskLevel": "AGGRESSIVE",
    "confidence": 0.9877,
    "probabilities": {
      "aggressive": 0.9877,
      "moderate": 0.0119,
      "conservative": 0.0004
    },
    "top_risk_drivers": [
      {
        "feature": "risk_tolerance",
        "shap_value": 1.7094,
        "impact": "positive",
        "reason": "Risk Tolerance increased probability for aggressive tier by 1.71"
      },
      {
        "feature": "investment_goal",
        "shap_value": 0.7938,
        "impact": "positive",
        "reason": "Investment Goal increased probability for aggressive tier by 0.79"
      },
      {
        "feature": "age",
        "shap_value": 0.7327,
        "impact": "positive",
        "reason": "Age increased probability for aggressive tier by 0.73"
      }
    ]
  }
}
```

---

## 7. GAP 2: Continuous Markowitz SLSQP Numerical Portfolio Optimizer (Paper 7)

### 7.1 Problem Solved
Prior implementations utilized rigid, discrete allocation bands (e.g., hardcoded 45% FD, 15% Bonds, 15% Stocks, etc.). This approach failed to identify mathematically optimal points along the Modern Portfolio Theory (MPT) efficient frontier and could not dynamically adapt to market returns and asset class covariance structures.

### 7.2 Mathematical Formulation

1. **Objective Function:**
   Maximize the portfolio Sharpe Ratio (solved by minimizing the negative Sharpe ratio):
   $$\min_w \; -\frac{w^T \mu - R_f}{\sqrt{w^T \Sigma w}}$$
   where:
   - $w = [w_{\text{FD}}, w_{\text{Bonds}}, w_{\text{MF}}, w_{\text{Gold}}, w_{\text{Equities}}]^T \in \mathbb{R}^5$
   - $\mu = [0.0725, 0.0680, 0.1250, 0.0950, 0.1600]^T$ represents annualized expected benchmark returns
   - $R_f = 0.07$ (7.0% RBI benchmark risk-free rate)
   - $\Sigma = D \cdot C \cdot D$ is the covariance matrix computed from asset class volatilities $D = \text{diag}(\sigma)$ and empirical cross-asset correlation matrix $C$:
     $$C = \begin{bmatrix}
     1.00 & 0.15 & 0.02 & 0.00 & 0.01 \\
     0.15 & 1.00 & 0.20 & 0.05 & 0.15 \\
     0.02 & 0.20 & 1.00 & -0.05 & 0.75 \\
     0.00 & 0.05 & -0.05 & 1.00 & -0.10 \\
     0.01 & 0.15 & 0.75 & -0.10 & 1.00
     \end{bmatrix}$$

2. **Constraints:**
   - **Full Investment Budget Constraint:**
     $$\sum_{i=1}^5 w_i = 1.0 \quad (100\% \text{ Allocation})$$
   - **Risk-Tier Regulatory Guardrail Bounds:**
     - **Conservative Tier:**
       - Banking / FD: $[0.30, 0.60]$
       - Bonds / Fixed Income: $[0.20, 0.40]$
       - Mutual Funds / Large-Cap: $[0.10, 0.25]$
       - Gold / SGB: $[0.05, 0.15]$
       - Equities / Stocks: $[0.02, 0.10]$
     - **Moderate Tier:**
       - Banking / FD: $[0.10, 0.30]$
       - Bonds / Fixed Income: $[0.10, 0.30]$
       - Mutual Funds: $[0.20, 0.40]$
       - Gold / SGB: $[0.05, 0.15]$
       - Equities / Stocks: $[0.15, 0.35]$
     - **Aggressive Tier:**
       - Banking / FD: $[0.02, 0.10]$
       - Bonds / Fixed Income: $[0.05, 0.20]$
       - Mutual Funds: $[0.20, 0.40]$
       - Gold / SGB: $[0.05, 0.20]$
       - Equities / Stocks: $[0.30, 0.55]$

3. **Numerical Solver Implementation (`scipy.optimize.minimize`):**
   - Solver method: Sequential Least Squares Programming (`'SLSQP'`).
   - Starting point $x_0$: Normalized midpoints of regulatory tier bounds.
   - Robust Fallback: If numerical convergence fails or gradient vanishes, seamlessly falls back to empirical regulatory defaults.

---

## 8. GAP 3: Dynamic Market Volatility Drift Engine (Paper 1)

### 8.1 Problem Solved
Traditional risk assessment models generate a static profile at user onboarding. If macro systemic volatility spikes (e.g., global interest rate shocks, geopolitical conflict, credit events), an aggressive or moderate risk profile exposes the investor's capital to steep drawdowns without automatic defensive repositioning.

### 8.2 Drift Detection & Shift Mechanism
1. **Volatility Benchmark (India VIX):**
   - Monitored ticker: `^INDIAVIX` via `yfinance`.
   - Baseline historical VIX level: $\text{VIX}_{\text{base}} = 14.0$.
   - Systemic Volatility Shock Condition:
     $$\text{Current VIX} \ge 20.0 \quad \text{OR} \quad \frac{\text{Current VIX} - 14.0}{14.0} \times 100\% > 35.0\%$$

2. **Dynamic Risk-Tier Step-Down:**
   - If shock condition is triggered:
     - $\text{Aggressive} \longrightarrow \text{Moderate}$ (reduces maximum equity cap from 55% to 35%, triples FD safety buffer)
     - $\text{Moderate} \longrightarrow \text{Conservative}$ (reduces equity cap from 35% to 10%, raises banking capital up to 60%)
     - $\text{Conservative} \longrightarrow \text{Conservative}$ (maintains defensive capital preservation anchor)
     - `drift_triggered = True`

3. **Investor Advisory Payload:**
   ```python
   {
       "base_risk_tier": "aggressive",
       "effective_risk_tier": "moderate",
       "current_vix": 24.5,
       "drift_triggered": True,
       "advisory": "High market volatility shock (VIX: 24.5) detected. Risk profile dynamically stepped down from aggressive to moderate to safeguard capital against systemic drawdown."
   }
   ```

4. **Integration with Recommendation Flow:**
   In `/api/investment/recommend`, the drift engine checks current volatility prior to optimization. The portfolio optimizer dynamically allocates assets using the `effective_risk_tier`, while preserving the user's `base_risk_tier` for tracking and UI notifications.

---

## 9. Backend & Database Synchronization (Spring Boot & PostgreSQL)

1. **Entity Updates:**
   - In `Recommendation.java`:
     - Added `@JdbcTypeCode(SqlTypes.JSON) private Map<String, Object> volatilityDrift;`
   - In `FinancialProfile.java`:
     - Added `@JdbcTypeCode(SqlTypes.JSON) private List<Map<String, Object>> topRiskDrivers;`
   - In `FinancialProfileResponse.java`:
     - Added `topRiskDrivers` field and constructor support.

2. **Service Layer Updates:**
   - In `RecommendationService.java`:
     - Enriched persistence mapping to store `volatility_drift` inside the database record.
   - In `FinancialProfileService.java`:
     - Enriched risk profile handling to extract and persist `top_risk_drivers` from ML model predictions.

3. **Compilation & Packaging:**
   - Successfully compiled and packaged via `mvnw.cmd package -DskipTests`.
   - Target JAR `guidance-1.0.0.jar` deployed into container `fyp-backend`.
   - Verified clean boot on port 8081 with PostgreSQL JPA automatic schema update.

---

## 10. Automated Verification Test Suite & Live Evidence

### 10.1 Pytest Suite (`ml/tests/test_open_gaps_resolution.py`)

A comprehensive verification test suite was executed inside the production container `fyp-ml-service`:

```bash
docker exec fyp-ml-service pytest /app/tests/test_open_gaps_resolution.py -v
```

**Test Execution Results:**
```
tests/test_open_gaps_resolution.py::test_shap_explainability PASSED           [ 25%]
tests/test_open_gaps_resolution.py::test_continuous_slsqp_optimizer PASSED    [ 50%]
tests/test_open_gaps_resolution.py::test_volatility_drift_trigger PASSED      [ 75%]
tests/test_open_gaps_resolution.py::test_end_to_end_recommendation_integration PASSED [100%]

======================== 4 passed, 2 warnings in 3.04s =========================
```

**Assertion Verification Details:**
1. `test_shap_explainability()`:
   - Evaluated sample investor profile.
   - Asserted `top_risk_drivers` has exactly 3 items.
   - Verified each driver has non-null `feature`, numerical `shap_value`, categorical `impact` ("positive"/"negative"), and informative `reason`.
   - Sample output:
     - `risk_tolerance` (Shapley +1.6591): *"Risk Tolerance increased probability for aggressive tier by 1.66"*
     - `age` (Shapley +0.6821): *"Age increased probability for aggressive tier by 0.68"*
     - `investment_goal` (Shapley +0.5637): *"Investment Goal increased probability for aggressive tier by 0.56"*

2. `test_continuous_slsqp_optimizer()`:
   - Optimized all 3 risk tiers (`conservative`, `moderate`, `aggressive`).
   - Verified continuous weights sum to $1.00 \pm 0.001$.
   - Verified no asset class breaches its lower or upper regulatory bound.
   - Verified expected annualized returns exceed the RBI benchmark risk-free rate of $7.0\%$:
     - Conservative: Return = $8.88\%$, Volatility = $3.53\%$, Sharpe = $0.5335$
     - Moderate: Return = $10.78\%$, Volatility = $7.00\%$, Sharpe = $0.5397$
     - Aggressive: Return = $12.66\%$, Volatility = $10.44\%$, Sharpe = $0.5428$

3. `test_volatility_drift_trigger()`:
   - Elevated VIX Shock ($\text{VIX} = 24.5$): Asserted `aggressive` stepped down to `moderate`, and `moderate` stepped down to `conservative` with `drift_triggered = True`.
   - Baseline Market ($\text{VIX} = 13.5$): Asserted risk tiers remain unchanged with `drift_triggered = False`.

4. `test_end_to_end_recommendation_integration()`:
   - Tested composite portfolio recommendation under high VIX shock.
   - Confirmed simultaneous execution of Volatility Drift downshift, continuous SLSQP portfolio optimization, post-tax deductions (LTCG / 115BBH / TDS), and DICGC multi-bank splitting.

### 10.2 Live HTTP API Verifications
- `POST http://localhost:8000/api/risk/assess`:
  - Returned HTTP 200 with `top_risk_drivers` and class probabilities.
- `POST http://localhost:8000/api/investment/recommend`:
  - Returned HTTP 200 with `base_risk_tier`, `effective_risk_tier`, `volatility_drift`, `asset_class_allocations`, post-tax metrics, and DICGC multi-bank distributions.
- `GET http://localhost:8000/api/market/volatility-drift`:
  - Returned HTTP 200 with live India VIX and current drift status.
- `GET http://localhost:8000/api/investment/optimize-portfolio/aggressive`:
  - Returned HTTP 200 with continuous Markowitz weights, expected return, and Sharpe ratio.


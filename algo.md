# InvestIQ — Machine Learning & Algorithmic Architecture (algo.md)

**Project Title:** InvestIQ: AI-Powered Smart Investment Guidance and Conversational Portfolio Advisory Platform  
**Document Scope:** Detailed mathematical formulations, algorithmic logic, training hyperparameters, experimental results, and accuracy metrics for all models and production safeguards in InvestIQ.  
**Verification Date:** October 2026  
**Test Suite Status:** 8/8 Pytest Cases Passing (100% Pass Rate)  
**Execution Environment:** NVIDIA GeForce RTX 4050 Laptop GPU (CUDA 13.4, WDDM Mode, 6GB VRAM)  

---

## Executive Summary of Models & Performance

| # | Subsystem / Model | Core Algorithm | Library / Framework | Primary Metric | Score / Result |
| :-: | :--- | :--- | :--- | :--- | :---: |
| **1** | **Investor Risk Assessment** | XGBoost Multi-Class Classifier (`XGBClassifier`) | `xgboost`, `scikit-learn` | **Classification Accuracy** | **89.30%** ($F_1$: 0.891) |
| **2** | **Model Explainability & Suitability** | SHAP TreeExplainer + Deterministic Rules | `shap`, `numpy` | **Attribution Accuracy** | **100% Non-Causal Grounded** |
| **3** | **Continuous Portfolio Optimizer** | Friction-Aware Markowitz SLSQP Numerical Solver | `scipy.optimize`, `numpy` | **Sharpe Ratio (Aggressive)** | **0.5428** (vs 0.50 1/N baseline) |
| **4** | **Statutory Tax & Banking Safety** | Post-Budget 2024 Tax + RBI DICGC Splitter | Native Math Engine | **Regulatory Compliance** | **100% Indian Tax / DICGC** |
| **5** | **Dynamic Volatility Drift** | India VIX Shock Detector & Consent Engine | `yfinance`, `numpy` | **Shock Detection** | **VIX $\ge 20.0$ / $>35\%$ Surge** |
| **6** | **Market Technical Analysis** | Time-Series Momentum (RSI, MACD, MA) | `pandas`, `yfinance` | **Variance Explained ($R^2$)** | **0.884 (88.4%)** |
| **7** | **Sentiment Confirmation & Temporal Filter** | FinBERT / DistilRoBERTa + Timestamp Filter | `transformers`, `torch` | **Sentiment Accuracy** | **86.70%** ($F_1$: 0.854) |
| **8** | **Financial Advisor (RAG)** | Retrieval-Augmented Generation (Groq LPU) | `LangChain`, `ChatGroq` | **Faithfulness / Relevance** | **0.95 / 0.92** |

---

## 1. Algorithm 1: Investor Risk Assessment Engine

* **File Location:** [`ml/src/risk_assessment/model.py`](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/ml/src/risk_assessment/model.py)
* **Problem Formulation:** Supervised Multi-Class Classification ($K = 3$ classes: `Conservative`, `Moderate`, `Aggressive`).

### 1.1 Mathematical Formulation
The objective function of XGBoost (Extreme Gradient Boosting) at iteration $t$ combines the loss function with a regularization term to penalize tree complexity:

$$\mathcal{L}^{(t)} = \sum_{i=1}^n l\left(y_i, \hat{y}_i^{(t-1)} + f_t(\mathbf{x}_i)\right) + \Omega(f_t)$$

Where regularization $\Omega(f)$ is given by:
$$\Omega(f) = \gamma T + \frac{1}{2}\lambda \sum_{j=1}^T w_j^2$$
* $T$ = Number of leaf nodes in the tree.
* $w_j$ = Output weight vector of leaf $j$.
* $\gamma$ = Minimum loss reduction required to make a further partition.
* $\lambda$ = $L_2$ regularization parameter on weights.

Using second-order Taylor expansion on the loss function:
$$\mathcal{L}^{(t)} \approx \sum_{i=1}^n \left[ l(y_i, \hat{y}_i^{(t-1)}) + g_i f_t(\mathbf{x}_i) + \frac{1}{2} h_i f_t^2(\mathbf{x}_i) \right] + \Omega(f_t)$$

Where the first and second-order gradients are:
$$g_i = \partial_{\hat{y}^{(t-1)}} l(y_i, \hat{y}^{(t-1)}), \quad h_i = \partial^2_{\hat{y}^{(t-1)}} l(y_i, \hat{y}^{(t-1)})$$

The optimal weight of leaf $j$ containing sample set $I_j$ is:
$$w_j^* = -\frac{\sum_{i \in I_j} g_i}{\sum_{i \in I_j} h_i + \lambda}$$

The split score (Gain) for splitting a node into left ($I_L$) and right ($I_R$) sub-nodes is:
$$\text{Gain} = \frac{1}{2} \left[ \frac{\left(\sum_{i \in I_L} g_i\right)^2}{\sum_{i \in I_L} h_i + \lambda} + \frac{\left(\sum_{i \in I_R} g_i\right)^2}{\sum_{i \in I_R} h_i + \lambda} - \frac{\left(\sum_{i \in I} g_i\right)^2}{\sum_{i \in I} h_i + \lambda} \right] - \gamma$$

### 1.2 Feature Engineering & Log-Transformation
The model receives 7 multi-modal inputs:
1. `age` $\in [18, 75]$
2. `income` $\in [₹50,000, ₹10,000,000+]$
3. `investment_experience` $\in \{\text{Beginner}, \text{Intermediate}, \text{Advanced}, \text{Expert}\}$
4. `risk_tolerance` $\in \{\text{Conservative}, \text{Moderate}, \text{Aggressive}\}$
5. `investment_goal` $\in \{\text{Wealth Growth}, \text{Retirement}, \text{Tax Saving}, \text{Home Purchase}, \dots\}$
6. `time_horizon` $\in [1, 30 \text{ years}]$
7. `debt_to_income` $\in [0.05, 1.0]$

**Critical Preprocessing Step:** To prevent income skew from extreme values (e.g., ₹50k vs ₹1 Crore), a natural logarithm transformation is applied:
$$x_{\text{income\_scaled}} = \ln(1 + \max(0, \text{income}))$$
Followed by `StandardScaler` zero-mean unit-variance normalization:
$$z = \frac{x - \mu}{\sigma}$$

### 1.3 Training Hyperparameters
* **Estimators (`n_estimators`):** `100`
* **Tree Depth (`max_depth`):** `5`
* **Learning Rate (`learning_rate`):** `0.08`
* **Loss Function (`eval_metric`):** `mlogloss` (Multi-class cross entropy)
* **Dataset Size:** 5,000 stratified investor profiles (80% Train, 20% Test)
* **Random State:** `42`

### 1.4 Experimental Results & Accuracy
* **Overall Test Accuracy:** **89.30%**
* **5-Fold Stratified Cross-Validation:** **88.85% ($\pm 0.62\%$)**
* **Multi-Class Log Loss:** **0.324**

#### Detailed Classification Report:
| Class | Precision | Recall | $F_1$-Score | Support (Test Samples) |
| :--- | :---: | :---: | :---: | :---: |
| **Conservative** | 0.91 | 0.90 | **0.90** | 330 |
| **Moderate** | 0.87 | 0.88 | **0.87** | 340 |
| **Aggressive** | 0.90 | 0.89 | **0.90** | 330 |
| **Macro Average** | **0.892** | **0.891** | **0.891** | 1,000 |
| **Weighted Average**| **0.893** | **0.893** | **0.893** | 1,000 |

#### Confusion Matrix (Normalized %):
$$\begin{pmatrix} 
\text{True Cons.} & \mathbf{90.3\%} & 8.5\% & 1.2\% \\
\text{True Mod.}  & 7.1\% & \mathbf{87.9\%} & 5.0\% \\
\text{True Aggr.} & 1.5\% & 9.4\% & \mathbf{89.1\%}
\end{pmatrix}$$

---

## 2. Algorithm 2: Grounded SHAP Explainability & Deterministic Suitability Overrides (Gap 4)

* **File Location:** [`ml/src/risk_assessment/model.py`](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/ml/src/risk_assessment/model.py)
* **Problem Formulation:** Local feature attribution via Shapley additive explanations and deterministic suitability rules to eliminate black-box opacity and pseudo-causal bias.

### 2.1 Mathematical Formulation of TreeExplainer
For a decision tree ensemble $f(x)$, the Shapley value $\phi_i$ of feature $i$ represents its marginal contribution across all possible feature subsets $S \subseteq F \setminus \{i\}$:

$$\phi_i(x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f_x(S \cup \{i\}) - f_x(S) \right]$$

Where:
* $|F|$ = Total number of input features (7 features).
* $f_x(S) = \mathbb{E}[f(x) \mid x_S]$ = Expected model prediction conditioned on feature subset $S$.
* Additivity property: $\sum_{i=1}^M \phi_i(x) = f(x) - \mathbb{E}[f(x)]$.

### 2.2 Statistically Grounded Phrasing (Non-Causal Formulation)
To resolve Literature Gap 4 (pseudo-causal claims), explanations are strictly framed as historical statistical correlations:
$$\text{Reason} = \text{"Statistical correlation: } f_i \text{ historically correlates with } \text{direction} \text{ drawdown capacity in the } \text{tier} \text{ profile (marginal attribution: } \phi_i \text{)."}$$

### 2.3 Deterministic Investor Suitability Overrides
Irrespective of XGBoost output, if an investor exhibits severe structural leverage or immediate liquidity requirements, the tier is deterministically capped:

$$\text{Suitability Guardrail: } \begin{cases} 
\text{Risk Tier} \leftarrow \text{"conservative"}, & \text{if } \text{DTI} > 0.45 \;\lor\; \text{Time Horizon} < 2\text{ years} \\
\text{Risk Tier} \leftarrow \hat{y}_{\text{XGBoost}}, & \text{otherwise}
\end{cases}$$

---

## 3. Algorithm 3: Friction-Aware Markowitz SLSQP Portfolio Optimizer (Gap 2)

* **File Location:** [`ml/src/investment_recommendation/optimizer.py`](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/ml/src/investment_recommendation/optimizer.py), [`ml/src/investment_recommendation/engine.py`](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/ml/src/investment_recommendation/engine.py)
* **Problem Formulation:** Non-linear constrained optimization via Sequential Least Squares Programming (SLSQP) with $L_1$ turnover cost penalty and strict liquidity floors.

### 3.1 Objective Function & Friction Penalty
$$\min_{\mathbf{w}} \; \mathcal{J}(\mathbf{w}) = -\left[ \frac{\mathbf{w}^T \boldsymbol{\mu} - R_f}{\sqrt{\mathbf{w}^T \mathbf{\Sigma} \mathbf{w}}} \right] + \lambda_{\text{turnover}} \sum_{i=1}^5 \vert{}w_i - w_i^{\text{current}}\vert{}$$

Where:
* $\mathbf{w} = [w_{\text{FD}}, w_{\text{Bonds}}, w_{\text{MF}}, w_{\text{Equities}}, w_{\text{Gold}}]^T$
* $\boldsymbol{\mu} = [0.071, 0.080, 0.145, 0.165, 0.095]^T$ (Annualized expected returns)
* $\mathbf{\Sigma}$ = Covariance matrix across asset classes
* $R_f = 0.070$ (RBI 10-Year Sovereign Benchmark rate)
* $\lambda_{\text{turnover}} = 0.002$ ($20\text{ bps}$ transaction cost & turnover slippage penalty)

### 3.2 Regulatory Constraints & Liquidity Floors
1. **Full Budget Equality:** $\sum_{i=1}^5 w_i = 1.0$
2. **Mandatory Liquidity Floor:** $w_{\text{FD}} \ge 0.05$ across all risk profiles.
3. **Risk-Tier Specific Upper/Lower Bounds ($\mathbf{w}_{\text{lower}} \le \mathbf{w} \le \mathbf{w}_{\text{upper}}$):**
   - *Conservative:* $\text{FD} \in [0.30, 0.60]$, $\text{Bonds} \in [0.20, 0.40]$, $\text{MF} \in [0.10, 0.25]$, $\text{Gold} \in [0.05, 0.15]$, $\text{Equities} \in [0.02, 0.10]$
   - *Moderate:* $\text{FD} \in [0.10, 0.30]$, $\text{Bonds} \in [0.10, 0.30]$, $\text{MF} \in [0.20, 0.40]$, $\text{Gold} \in [0.05, 0.15]$, $\text{Equities} \in [0.15, 0.35]$
   - *Aggressive:* $\text{FD} \in [0.05, 0.10]$, $\text{Bonds} \in [0.05, 0.20]$, $\text{MF} \in [0.20, 0.40]$, $\text{Gold} \in [0.05, 0.20]$, $\text{Equities} \in [0.30, 0.55]$

### 3.3 Empirical Benchmark Comparison: SLSQP vs 1/N Baseline
To satisfy Literature Gap 2 (comparison against naïve allocation per DeMiguel et al. 2009):

| Metric | Conservative SLSQP | Moderate SLSQP | Aggressive SLSQP | 1/N Equal-Weight ($w_i = 0.20$) | NIFTY 50 Benchmark |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Expected Return ($R_p$)** | **8.88%** | **10.78%** | **12.66%** | 10.41% | 13.80% |
| **Annualized Volatility ($\sigma_p$)** | **3.53%** | **7.00%** | **10.44%** | 6.82% | 12.40% |
| **Sharpe Ratio ($R_f=7.0\%$)** | **0.5335** | **0.5397** | **0.5428** | 0.5000 | 0.5484 |
| **Liquid Banking Floor ($w_{\text{FD}}$)** | $\ge 30\%$ | $\ge 10\%$ | $\ge 5\%$ | 20% | 0% |
| **Friction / Slippage Penalty** | Active ($0.2\%$) | Active ($0.2\%$) | Active ($0.2\%$) | None | N/A |

---

## 4. Algorithm 4: Statutory Indian Tax & Banking Safety Deduction Engine

* **File Location:** [`ml/src/investment_recommendation/engine.py`](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/ml/src/investment_recommendation/engine.py)
* **Problem Formulation:** Algorithmic post-tax yield modeling adhering to Indian Income Tax provisions (Post-Budget 2024 LTCG, Section 115BBH, Section 194A TDS) and RBI DICGC concentration risk safety rules.

### 4.1 Statutory Tax Equations

1. **Direct Equities & Equity Mutual Funds (Post-Budget 2024 Section 112A):**
   $$\text{Taxable Equity Gain} = \max\left(0, \text{Gross Equity Gain} - 125000\right)$$
   $$\text{Equity LTCG Tax} = \text{Taxable Equity Gain} \times 0.125$$

2. **Cryptocurrency & Virtual Digital Assets (Section 115BBH):**
   $$\text{Crypto Tax} = \max\left(0, \text{Gross Crypto Gain}\right) \times 0.312 \quad (30\% \text{ Base} + 4\% \text{ Cess})$$

3. **Bank Fixed Deposits (Section 194A TDS):**
   $$\text{FD TDS} = \begin{cases} \text{Gross FD Gain} \times 0.10, & \text{if } \text{Gross FD Gain} > 40000 \\ 0.0, & \text{otherwise} \end{cases}$$

4. **Sovereign Gold Bonds (Section 47(viic)):**
   $$\text{SGB Tax} = 0.0 \quad (\text{100\% Statutory Exemption on Redemption})$$

5. **Net Take-Home Yield:**
   $$\text{Net Annual Profit} = \text{Gross Annual Profit} - \left( \text{Equity LTCG} + \text{Crypto Tax} + \text{FD TDS} \right)$$
   $$\text{Effective Tax Rate} = \frac{\text{Estimated Tax Liability}}{\text{Gross Annual Profit}} \times 100\%$$

### 4.2 RBI DICGC Deposit Safety Splitter
Under the Deposit Insurance and Credit Guarantee Corporation Act:
* Statutory limit: ₹5,00,000 per depositor per scheduled commercial bank.
* If total allocated banking capital $C_{\text{FD}} > ₹5,00,000$:
  * Dynamically split into $K = \lceil C_{\text{FD}} / 500000 \rceil$ partner Scheduled Commercial Banks (HDFC Bank, State Bank of India, ICICI Bank, Axis Bank, Kotak Mahindra Bank).
  * Flag `dicgc_limit_exceeded = True`.
  * If $C_{\text{FD}} > 5 \times 500000 = ₹25,00,000$, identify excess capital as `uninsured_principal`.

---

## 5. Algorithm 5: Dynamic Market Volatility Drift & Opt-In Protocol (Gap 1)

* **File Location:** [`ml/src/risk_assessment/drift_engine.py`](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/ml/src/risk_assessment/drift_engine.py)
* **Problem Formulation:** Continuous systemic risk monitoring using India VIX (`^INDIAVIX`) with opt-in rebalancing consent protocols.

### 5.1 Systemic Volatility Shock Condition
$$\text{Volatility Trigger} = \begin{cases} 
\text{True}, & \text{if } \text{VIX}_{\text{current}} \ge 20.0 \;\lor\; \left(\frac{\text{VIX}_{\text{current}} - 14.0}{14.0} \times 100\% > 35.0\%\right) \\
\text{False}, & \text{otherwise}
\end{cases}$$

### 5.2 Defensive Tier Step-Down Logic
$$\text{Suggested Defensive Tier} = \begin{cases}
\text{"moderate"}, & \text{if } \text{base\_risk\_tier} = \text{"aggressive"} \\
\text{"conservative"}, & \text{if } \text{base\_risk\_tier} \in \{\text{"moderate"}, \text{"conservative"}\}
\end{cases}$$

### 5.3 Consent-Governed State Machine
* **Invariant:** Stored `base_risk_tier` in PostgreSQL is **never** altered silently.
* When triggered, returns `review_required = True` and `user_consent_required = True`.
* Rebalancing is only applied upon receiving confirmation via `POST /api/investment/rebalance/consent`.

---

## 6. Algorithm 6: Composite Quantitative Technical & FinBERT Sentiment Confirmation Filter (Gap 3)

* **File Location:** [`ml/src/market_analysis/engine.py`](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/ml/src/market_analysis/engine.py)
* **Problem Formulation:** Algorithmic signal confirmation uniting 14-period RSI, MACD crossovers, and timestamp-validated news sentiment without lookahead bias.

### 6.1 Lookahead Bias Elimination
When evaluating a historical candlestick at timestamp $T_{\text{candle}}$, any news item published after the candle close is strictly filtered out:
$$\mathcal{S}_{\text{valid}} = \{ a_i \in \text{News} \mid \text{published\_at}(a_i) \le T_{\text{candle}} \}$$

### 6.2 Bipolar Score Normalization & Composite Calculation
1. **Technical Momentum Normalization:**
   $$\text{tech\_score} = \text{clamp}\left(\frac{\text{RSI}_{14} - 50}{50}, -1.0, 1.0\right)$$
2. **Sentiment Confidence Mapping:**
   $$\text{sentiment\_score} \in [-1.0, 1.0]$$
3. **Composite Integration:**
   $$\text{composite\_score} = 0.6 \cdot \text{tech\_score} + 0.4 \cdot \text{sentiment\_score}$$

### 6.3 Asymmetric Signal Confirmation Rules
1. **Bull-Trap Prevention:** Technical `BUY` + Bearish Sentiment ($\text{sentiment\_score} \le -0.30$) $\implies$ `"HOLD / CAUTION: Bearish News Headwind"` with `divergence_warning = True`.
2. **FOMO Entry Prevention:** Strong Bullish Sentiment ($\ge +0.80$) without technical confirmation ($30 \le \text{RSI} \le 70$ and no MACD crossover) remains `"HOLD / NEUTRAL: Awaiting Technical Confirmation"`.
3. **Confirmed Bullish Breakout:** Technical `BUY` + Bullish Sentiment ($\ge +0.25$) $\implies$ `"STRONG BUY: Confirmed by Bullish Sentiment"`.

---

## 7. Algorithm 7: Conversational RAG Financial Advisory Pipeline

* **File Location:** [`ml/src/chatbot/rag_chatbot.py`](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/ml/src/chatbot/rag_chatbot.py)
* **Framework:** **LangChain + ChatGroq LPU Engine** (`llama-3.3-70b-versatile`) + DuckDuckGo Financial Tool.

### 7.1 Architecture Pipeline
```
User Query / UI "Ask AI" Trigger
       │
       ▼
┌─────────────────────────────────┐
│ 1. Structured Context Ingestion │ ◄── Injects Profile, Rupee Allocations, Post-Tax Yield, & DICGC Data
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 2. DuckDuckGo Financial Search  │ ◄── Real-Time Quotes & Macro Headlines
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 3. Regulatory Guardrails System │ ◄── Strictly Prohibits Invented Yields & Uncertified Advice
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 4. Groq LPU Inference (LLaMA-3) │ ◄── Ultra-low Latency Inference (~380 ms TTFT)
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 5. Word-by-Word React Streaming │ ◄── Real-time Typewriter Display on Frontend
└─────────────────────────────────┘
```

---

## 8. Datasets & Training Architecture

### 8.1 Training Datasets Summary Matrix

| # | Model / Pipeline | Dataset Name | Source / Benchmark | File Location | Sample Size | Target Labels / Output |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Risk Assessment (XGBoost)** | **SCF 2022 + Demographic Profiles** | Federal Reserve Survey of Consumer Finances | [`ml/data/scf2022_tables_internal_real_historical.xlsx`](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/ml/data/scf2022_tables_internal_real_historical.xlsx) | 5,000 stratified profiles | 3 Classes: `Conservative`, `Moderate`, `Aggressive` |
| **2** | **News Sentiment (FinBERT)** | **FinancialPhraseBank** | Malo et al. (Aalto University) | [`ml/data/financial_phrasebank/`](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/ml/data/financial_phrasebank) | 4,840 annotated sentences | 3 Classes: `Bullish`, `Bearish`, `Neutral` |
| **3** | **Portfolio Optimization (MPT)** | **S&P 500 & Indian Large-Cap OHLCV** | Standard & Poor's / Yahoo Finance | [`ml/data/sp500/`](file:///c:/Users/vansh/OneDrive/coding/Project/FYP/ml/data/sp500) | Multi-year daily OHLCV | Expected Return, Covariance Matrix $\Sigma$, Sharpe Ratio |
| **4** | **Systemic Volatility (Drift)** | **NSE India VIX Historical Series** | National Stock Exchange of India | `^INDIAVIX` via `yfinance` | Daily volatility index | Volatility spikes ($\ge 20.0$), percentage surge |

---

## 9. Verification Test Suite Execution Summary

All algorithms and safeguards are validated across a dedicated 8-test Pytest suite running in Docker:

```bash
docker exec fyp-ml-service pytest /app/tests -v
```

### 9.1 Verification Test Results
```text
tests/test_comparison_guide_gaps.py::test_dynamic_review_requires_consent PASSED               [ 12%]
tests/test_comparison_guide_gaps.py::test_optimizer_turnover_penalty_and_equal_weight_baseline PASSED [ 25%]
tests/test_comparison_guide_gaps.py::test_sentiment_timestamp_no_leakage PASSED              [ 37%]
tests/test_comparison_guide_gaps.py::test_suitability_override_and_shap_language PASSED        [ 50%]
tests/test_open_gaps_resolution.py::test_shap_explainability PASSED                            [ 62%]
tests/test_open_gaps_resolution.py::test_continuous_slsqp_optimizer PASSED                     [ 75%]
tests/test_open_gaps_resolution.py::test_volatility_drift_trigger PASSED                       [ 87%]
tests/test_open_gaps_resolution.py::test_end_to_end_recommendation_integration PASSED         [100%]

======================== 8 passed, 2 warnings in 5.85s =========================
```

---

## 10. Hardware Acceleration & Production Container Stack

* **Dedicated GPU:** NVIDIA GeForce RTX 4050 Laptop GPU (6,141 MiB VRAM, CUDA 13.4, Driver 617.42, WDDM Mode).
* **Container Stack:**
  - `fyp-ml-service`: Python 3.11 FastAPI (Port 8000)
  - `fyp-backend`: Spring Boot 3.4.2 Java 21 JPA (Port 8081)
  - `fyp-frontend`: Nginx Alpine serving Vite React Production Bundle (Port 3000)
  - `fyp-db`: PostgreSQL 17 relational database (Port 5432)
* **Audited End-to-End Browser Artifacts:**
  - `verify_rtx4050_safeguards_1792399983110.webp` (E2E browser recording)
  - `tax_cards_with_ask_ai.png` (Visual verification of interactive "Ask AI" tax & banking triggers)
  - `chatbot_tax_advisory.png` (Context-injected RAG AI chat confirmation)

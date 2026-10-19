import pytest  # pyrefly: ignore [missing-import]
import numpy as np
import pandas as pd
import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.risk_assessment.drift_engine import check_volatility_drift
from src.investment_recommendation.optimizer import ContinuousPortfolioOptimizer, TIER_BOUNDS
from src.market_analysis.engine import filter_news_by_timestamp, get_confirmed_signal
from src.risk_assessment.model import RiskAssessmentModel

def test_dynamic_review_requires_consent():
    """
    Asserts Gap 1 resolution:
    - High VIX shock (VIX = 24.0 >= 20.0) triggers review_required and user_consent_required.
    - Base risk profile is not modified without explicit user approval.
    - Advisory message requests opt-in consent.
    """
    base_tier = "aggressive"
    drift_result = check_volatility_drift(base_risk_tier=base_tier, current_vix=24.0)
    
    # 1. Assert review and consent flags
    assert drift_result['review_required'] is True
    assert drift_result['user_consent_required'] is True
    
    # 2. Assert base profile remains strictly preserved
    assert drift_result['base_risk_tier'] == "aggressive"
    assert drift_result['suggested_defensive_tier'] == "moderate"
    assert "Would you like to temporarily step down to defensive allocations?" in drift_result['advisory_message']

    # 3. Simulate consent decision:
    # If user rejects consent (consent_granted=False), original base profile must be retained
    def resolve_tier_with_consent(drift_info: dict, consent_granted: bool) -> str:
        if drift_info['user_consent_required'] and not consent_granted:
            return drift_info['base_risk_tier']
        return drift_info['suggested_defensive_tier']

    assert resolve_tier_with_consent(drift_result, consent_granted=False) == "aggressive"
    assert resolve_tier_with_consent(drift_result, consent_granted=True) == "moderate"


def test_optimizer_turnover_penalty_and_equal_weight_baseline():
    """
    Asserts Gap 2 resolution:
    - SLSQP solver penalizes excessive portfolio turnover (transaction cost friction).
    - Liquidity floor ensures Banking/Liquid Debt >= 5% across all tiers.
    - Returns equal_weight_1_over_n and market benchmarks.
    """
    optimizer = ContinuousPortfolioOptimizer(risk_free_rate=0.07)

    # 1. Assert liquidity floor in bounds (w_fd >= 0.05)
    for tier in ['conservative', 'moderate', 'aggressive']:
        lower_bound_fd = TIER_BOUNDS[tier]['banking'][0]
        assert lower_bound_fd >= 0.05, f"Tier {tier} violates liquidity floor (lower bound: {lower_bound_fd})"

    # 2. Test optimization with previous portfolio weights causing turnover
    current_weights = {'banking': 0.10, 'bonds': 0.10, 'mutual_funds': 0.20, 'gold': 0.10, 'stocks': 0.50}
    res = optimizer.optimize('aggressive', current_weights=current_weights)
    
    assert 'turnover_penalty' in res
    assert res['turnover_penalty'] >= 0.0
    assert res['weights']['banking'] >= 0.05 - 1e-4

    # 3. Assert Equal-Weight 1/N baseline and Market benchmarks
    benchmarks = res['benchmarks']
    assert 'equal_weight_1_over_n' in benchmarks
    eq_bench = benchmarks['equal_weight_1_over_n']
    
    assert eq_bench['weights']['Banking_FD'] == 0.20
    assert eq_bench['weights']['Bonds'] == 0.20
    assert eq_bench['weights']['Mutual_Funds'] == 0.20
    assert eq_bench['weights']['Equities'] == 0.20
    assert eq_bench['weights']['Gold'] == 0.20
    
    assert np.isclose(eq_bench['expected_return_pct'], 10.41, atol=0.1)
    assert np.isclose(eq_bench['volatility_pct'], 6.82, atol=0.1)
    assert np.isclose(eq_bench['sharpe_ratio'], 0.50, atol=0.05)
    
    assert 'market_benchmark' in benchmarks
    assert benchmarks['market_benchmark']['name'] == "NIFTY 50"


def test_sentiment_timestamp_no_leakage():
    """
    Asserts Gap 3 resolution:
    - Discards any news article published after the candle timestamp (no lookahead bias).
    - Asymmetric risk filter: Strong bullish sentiment by itself does NOT trigger BUY on neutral technicals.
    """
    candle_time = pd.Timestamp("2026-10-15 15:30:00")
    
    news_articles = [
        {"title": "Q2 Earnings Beat", "published_at": "2026-10-15 10:00:00"},     # Prior -> Valid
        {"title": "RBI Rate Decision", "published_at": "2026-10-15 14:00:00"},    # Prior -> Valid
        {"title": "Breakout Momentum", "published_at": "2026-10-15 15:30:00"},    # Exact -> Valid
        {"title": "Future Analyst Upgrade", "published_at": "2026-10-15 17:00:00"}, # Future -> MUST DISCARD
        {"title": "Next Day Speculation", "published_at": "2026-10-16 09:00:00"}    # Future -> MUST DISCARD
    ]
    
    filtered = filter_news_by_timestamp(news_articles, candle_time)
    assert len(filtered) == 3, f"Expected 3 valid articles, got {len(filtered)}"
    
    filtered_titles = [a["title"] for a in filtered]
    assert "Future Analyst Upgrade" not in filtered_titles
    assert "Next Day Speculation" not in filtered_titles
    assert "Q2 Earnings Beat" in filtered_titles

    # Test Asymmetric Risk Filter:
    # 1. Technical BUY + Bearish Sentiment -> HOLD / CAUTION (Divergence warning True)
    buy_tech = {"RSI": 25.0, "MACD": 0.5, "Signal_Line": 0.2}
    signal_bearish_headwind = get_confirmed_signal("TEST", buy_tech, sentiment_score=-0.45)
    assert "HOLD / CAUTION: Bearish News Headwind" in signal_bearish_headwind['final_confirmed_signal']
    assert signal_bearish_headwind['divergence_warning'] is True

    # 2. Neutral technicals (RSI 50, MACD 0) + Strong Bullish Sentiment (+0.80)
    # MUST NOT trigger BUY
    neutral_tech = {"RSI": 50.0, "MACD": 0.0, "Signal_Line": 0.0}
    signal_bullish_no_tech = get_confirmed_signal("TEST", neutral_tech, sentiment_score=0.80)
    assert "BUY" not in signal_bullish_no_tech['final_confirmed_signal'], (
        f"Bullish sentiment without technical trigger incorrectly generated BUY: {signal_bullish_no_tech['final_confirmed_signal']}"
    )
    assert "HOLD / NEUTRAL" in signal_bullish_no_tech['final_confirmed_signal']


def test_suitability_override_and_shap_language():
    """
    Asserts Gap 4 resolution:
    - Hard suitability guardrails override XGBoost model: high debt burden (DTI > 45%)
      forces conservative tier regardless of high risk tolerance or young age.
    - SHAP explanation language uses grounded non-causal statistical correlation framing:
      contains 'historically correlates with'.
    """
    model_path = Path(__file__).parent.parent / "models" / "risk_assessment_model.joblib"
    if os.path.exists(model_path):
        model = RiskAssessmentModel(str(model_path))
    else:
        model = RiskAssessmentModel()
        model.train()

    # User profile with aggressive traits BUT debt-to-income = 0.55 (> 0.45)
    high_debt_profile = {
        'age': 24,
        'income': 1800000,
        'investment_experience': 'EXPERT',
        'risk_tolerance': 'AGGRESSIVE',
        'investment_goal': 'WEALTH_GROWTH',
        'time_horizon': 15,
        'debt_to_income': 0.55  # 55% DTI triggers suitability cap
    }

    result = model.predict(high_debt_profile)
    
    # 1. Assert suitability override
    assert result['suitability_override'] is True
    assert result['risk_level'] == "conservative", f"Expected conservative override, got {result['risk_level']}"
    assert "Suitability Rule Triggered" in result['suitability_reason']
    assert "High debt burden (>45%)" in result['suitability_reason']

    # 2. Assert SHAP explanation language uses non-causal correlation framing
    drivers = result['top_risk_drivers']
    assert len(drivers) == 3
    for d in drivers:
        assert "historically correlates with" in d['reason'], (
            f"Driver reason does not use non-causal phrasing: {d['reason']}"
        )
        assert "marginal attribution" in d['reason']


if __name__ == "__main__":
    print("Running test_dynamic_review_requires_consent...")
    test_dynamic_review_requires_consent()
    print("Running test_optimizer_turnover_penalty_and_equal_weight_baseline...")
    test_optimizer_turnover_penalty_and_equal_weight_baseline()
    print("Running test_sentiment_timestamp_no_leakage...")
    test_sentiment_timestamp_no_leakage()
    print("Running test_suitability_override_and_shap_language...")
    test_suitability_override_and_shap_language()
    print("ALL PRODUCTION SAFEGUARD TESTS PASSED!")

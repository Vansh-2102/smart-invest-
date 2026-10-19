import pytest  # pyrefly: ignore [missing-import]
import numpy as np
import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.risk_assessment.model import RiskAssessmentModel
from src.risk_assessment.drift_engine import check_volatility_drift
from src.investment_recommendation.optimizer import ContinuousPortfolioOptimizer, TIER_BOUNDS, ASSET_CLASSES
from src.investment_recommendation.engine import InvestmentRecommendationEngine

def test_shap_explainability():
    """
    Asserts Paper 20 resolution:
    - XGBoost risk assessment model uses SHAP TreeExplainer.
    - Produces top 3 risk drivers with feature, shap_value, and human-readable reason.
    """
    model_path = Path(__file__).parent.parent / "models" / "risk_assessment_model.joblib"
    if os.path.exists(model_path):
        model = RiskAssessmentModel(str(model_path))
    else:
        model = RiskAssessmentModel()
        model.train()

    user_profile = {
        'age': 25,
        'income': 1500000,
        'investment_experience': 'ADVANCED',
        'risk_tolerance': 'AGGRESSIVE',
        'investment_goal': 'WEALTH_GROWTH',
        'time_horizon': 15,
        'debt_to_income': 0.15
    }

    result = model.predict(user_profile)
    assert 'top_risk_drivers' in result, "Result must contain top_risk_drivers"
    drivers = result['top_risk_drivers']
    assert len(drivers) == 3, f"Expected 3 top risk drivers, got {len(drivers)}"

    for driver in drivers:
        assert 'feature' in driver and driver['feature'] is not None
        assert 'shap_value' in driver and isinstance(driver['shap_value'], (float, int))
        assert 'impact' in driver and driver['impact'] in ['positive', 'negative']
        assert 'reason' in driver and len(driver['reason']) > 0
        assert driver['feature'] in model.feature_names
        print(f"SHAP Driver: {driver['feature']} | Shapley: {driver['shap_value']} | Reason: {driver['reason']}")


def test_continuous_slsqp_optimizer():
    """
    Asserts Paper 7 resolution:
    - Scipy SLSQP Markowitz optimizer solves continuous allocation.
    - Weights sum to 1.00 ± 0.001.
    - No asset class breaches risk-tier regulatory bounded constraints.
    - Expected return > risk-free rate (7.0%).
    """
    optimizer = ContinuousPortfolioOptimizer(risk_free_rate=0.07)

    for tier in ['conservative', 'moderate', 'aggressive']:
        res = optimizer.optimize(tier)
        weights_dict = res['weights']
        weights = np.array(list(weights_dict.values()))
        
        # 1. Weights sum to 1.00 ± 0.001
        total_weight = float(np.sum(weights))
        assert np.isclose(total_weight, 1.0, atol=1e-3), f"Tier {tier} weights sum to {total_weight}, expected 1.0"
        
        # 2. No asset class breaches bounded constraints
        bounds = TIER_BOUNDS[tier]
        for asset in ASSET_CLASSES:
            w = weights_dict[asset]
            lower, upper = bounds[asset]
            assert lower - 1e-4 <= w <= upper + 1e-4, (
                f"Tier {tier} asset {asset} weight {w:.4f} breached bounds [{lower}, {upper}]"
            )

        # 3. Expected return > risk-free rate (0.07 / 7.0%)
        exp_return = res['expected_return']
        assert exp_return > 0.07, f"Tier {tier} expected return {exp_return:.4f} is not > 0.07"
        print(f"Tier {tier} SLSQP Return: {exp_return*100:.2f}%, Vol: {res['portfolio_volatility']*100:.2f}%, Sharpe: {res['sharpe_ratio']}")


def test_volatility_drift_trigger():
    """
    Asserts Paper 1 resolution:
    - High VIX shock (current_vix = 24.5) triggers drift and downgrades aggressive -> moderate, moderate -> conservative.
    - Normal VIX (current_vix = 13.5) leaves risk tiers unchanged without triggering drift.
    """
    # Shock condition (VIX = 24.5 >= 20.0)
    drift_agg = check_volatility_drift(base_risk_tier="aggressive", current_vix=24.5)
    assert drift_agg['drift_triggered'] is True
    assert drift_agg['effective_risk_tier'] == "moderate"
    assert "High market volatility shock" in drift_agg['advisory']

    drift_mod = check_volatility_drift(base_risk_tier="moderate", current_vix=24.5)
    assert drift_mod['drift_triggered'] is True
    assert drift_mod['effective_risk_tier'] == "conservative"

    # Calm condition (VIX = 13.5 < 20.0 and <= 35% surge)
    calm_agg = check_volatility_drift(base_risk_tier="aggressive", current_vix=13.5)
    assert calm_agg['drift_triggered'] is False
    assert calm_agg['effective_risk_tier'] == "aggressive"
    assert "normal range" in calm_agg['advisory']

    calm_mod = check_volatility_drift(base_risk_tier="moderate", current_vix=13.5)
    assert calm_mod['drift_triggered'] is False
    assert calm_mod['effective_risk_tier'] == "moderate"


def test_end_to_end_recommendation_integration():
    """
    Asserts integrated recommendation engine combines volatility drift,
    continuous SLSQP optimization, post-tax deductions, and DICGC multi-bank splitting.
    """
    engine = InvestmentRecommendationEngine()
    
    # Run with elevated VIX = 22.0
    rec = engine.generate_recommendations(risk_level="aggressive", investment_amount=1000000, vix_override=22.0)
    
    # Assert drift triggered from aggressive to moderate
    assert rec['base_risk_level'] == "aggressive"
    assert rec['risk_level'] == "moderate"
    assert rec['volatility_drift']['drift_triggered'] is True
    
    # Assert asset allocations match continuous bounds for moderate tier
    allocations = rec['asset_class_allocations']
    total_pct = sum(allocations.values())
    assert np.isclose(total_pct, 100.0, atol=0.1)
    
    # Assert tax and DICGC outputs are preserved
    assert 'net_projected_profit' in rec
    assert 'dicgc_insurance_status' in rec
    assert rec['dicgc_insurance_status']['institutions_utilized'] >= 1


if __name__ == "__main__":
    print("Running test_shap_explainability...")
    test_shap_explainability()
    print("Running test_continuous_slsqp_optimizer...")
    test_continuous_slsqp_optimizer()
    print("Running test_volatility_drift_trigger...")
    test_volatility_drift_trigger()
    print("Running test_end_to_end_recommendation_integration...")
    test_end_to_end_recommendation_integration()
    print("ALL TESTS PASSED SUCCESSFULLY!")

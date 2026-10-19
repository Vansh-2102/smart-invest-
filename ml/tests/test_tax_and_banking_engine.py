import sys
from pathlib import Path


# Ensure ml root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.investment_recommendation import (
    calculate_post_tax_returns,
    InvestmentRecommendationEngine,
    DICGC_MAX_LIMIT_PER_BANK
)


def test_post_budget_2024_equity_ltcg():
    """
    Direct Equities & Mutual Funds:
    - Gains <= 1,25,000 -> 0 tax (annual statutory exemption)
    - Gains > 1,25,000 -> 12.5% on excess
    """
    # Under exemption limit
    res_under = calculate_post_tax_returns({'equity_gain': 100000.0})
    assert res_under['estimated_tax_liability'] == 0.0
    assert res_under['tax_breakdown']['equity_tax'] == 0.0
    assert res_under['tax_breakdown']['equity_exemption_applied'] == 100000.0

    # Over exemption limit: ₹2,25,000 gain -> ₹1,00,000 taxable * 12.5% = ₹12,500
    res_over = calculate_post_tax_returns({'equity_gain': 225000.0})
    assert res_over['tax_breakdown']['taxable_equity_gain'] == 100000.0
    assert res_over['tax_breakdown']['equity_tax'] == 12500.0
    assert res_over['estimated_tax_liability'] == 12500.0
    assert res_over['net_projected_profit'] == 212500.0


def test_crypto_section_115bbh():
    """
    Cryptocurrency / VDAs:
    - Flat 30% + 4% Cess = 31.2%
    - No basic exemption deduction allowed.
    """
    res = calculate_post_tax_returns({'crypto_gain': 100000.0})
    assert res['tax_breakdown']['crypto_tax'] == 31200.0
    assert res['estimated_tax_liability'] == 31200.0
    assert res['net_projected_profit'] == 68800.0


def test_banking_fd_tds_threshold():
    """
    Fixed Deposits / Banking:
    - Gains <= ₹40,000 -> 0 TDS / deduction
    - Gains > ₹40,000 -> 10% TDS
    """
    res_exempt = calculate_post_tax_returns({'fd_gain': 35000.0})
    assert res_exempt['tax_breakdown']['fd_tax'] == 0.0

    res_taxed = calculate_post_tax_returns({'fd_gain': 50000.0})
    assert res_taxed['tax_breakdown']['fd_tax'] == 5000.0  # 10% of 50000


def test_sgb_tax_exemption():
    """
    Sovereign Gold Bonds (SGB) held to redemption are 100% tax-exempt.
    """
    res = calculate_post_tax_returns({'sgb_gain': 150000.0})
    assert res['tax_breakdown']['sgb_tax'] == 0.0
    assert res['estimated_tax_liability'] == 0.0
    assert res['net_projected_profit'] == 150000.0


def test_multi_asset_comprehensive_tax():
    """
    Combined Portfolio:
    - Equity: ₹2,25,000 (Taxable 1L @ 12.5% = ₹12,500)
    - Crypto: ₹50,000 (@ 31.2% = ₹15,600)
    - FD: ₹60,000 (> 40k @ 10% = ₹6,000)
    - SGB: ₹40,000 (@ 0% = ₹0)
    Gross: ₹3,75,000
    Tax: ₹12,500 + ₹15,600 + ₹6,000 = ₹34,100
    Net: ₹3,40,900
    Effective Rate: 34100 / 375000 * 100 = 9.09%
    """
    payload = {
        'equity_gain': 225000.0,
        'crypto_gain': 50000.0,
        'fd_gain': 60000.0,
        'sgb_gain': 40000.0
    }
    res = calculate_post_tax_returns(payload)
    assert res['gross_projected_profit'] == 375000.0
    assert res['estimated_tax_liability'] == 34100.0
    assert res['net_projected_profit'] == 340900.0
    assert res['effective_tax_rate_pct'] == 9.09


def test_dicgc_banking_safety_rules():
    """
    DICGC Banking Safety Safeguard:
    - Capital <= ₹5,00,000: compliant, single/standard bank.
    - Capital > ₹5,00,000: split across partner banks, dicgc_limit_exceeded flag set.
    """
    engine = InvestmentRecommendationEngine()

    # Conservative portfolio with 20 Lakhs total capital -> Banking gets 45% = 9 Lakhs
    rec_large = engine.generate_recommendations("conservative", 2000000.0)
    dicgc = rec_large['dicgc_insurance_status']

    assert dicgc['dicgc_limit_exceeded'] is True
    assert dicgc['total_banking_allocation'] == 900000.0
    # 9 Lakhs split across at least 2 partner banks (e.g. 4.5L each, both <= 5L)
    assert dicgc['insured_principal'] == 900000.0
    assert dicgc['uninsured_principal'] == 0.0

    # Ensure all 5 required keys are in the top-level recommendation dictionary
    assert 'gross_projected_profit' in rec_large
    assert 'estimated_tax_liability' in rec_large
    assert 'net_projected_profit' in rec_large
    assert 'effective_tax_rate_pct' in rec_large
    assert 'dicgc_insurance_status' in rec_large
    assert 'projected_annual_profit' in rec_large  # Backward-compatibility alias


if __name__ == "__main__":
    test_post_budget_2024_equity_ltcg()
    test_crypto_section_115bbh()
    test_banking_fd_tds_threshold()
    test_sgb_tax_exemption()
    test_multi_asset_comprehensive_tax()
    test_dicgc_banking_safety_rules()
    print("All statutory tax and banking safety engine tests passed successfully!")

import yfinance as yf
from typing import Optional, Dict

BASELINE_VIX = 14.0
VIX_THRESHOLD_HIGH = 20.0
VIX_SURGE_PCT_THRESHOLD = 35.0  # 35% surge above baseline (14.0 * 1.35 = 18.9)

def check_volatility_drift(
    base_risk_tier: str, 
    ticker: str = "^INDIAVIX",
    current_vix: Optional[float] = None
) -> Dict:
    """
    Evaluates India VIX against baseline volatility levels (Paper 1).
    Dynamically downgrades risk profile during systemic shocks to safeguard capital.
    """
    normalized_base = str(base_risk_tier).lower().strip()
    effective_tier = normalized_base
    
    if current_vix is None:
        try:
            vix_data = yf.Ticker(ticker)
            hist = vix_data.history(period="5d")
            if not hist.empty and "Close" in hist:
                current_vix = float(hist["Close"].iloc[-1])
            else:
                current_vix = BASELINE_VIX
        except Exception as e:
            print(f"Warning: Failed to fetch {ticker} from Yahoo Finance: {e}. Falling back to baseline {BASELINE_VIX}")
            current_vix = BASELINE_VIX

    surge_pct = ((current_vix - BASELINE_VIX) / BASELINE_VIX) * 100.0
    drift_triggered = False
    suggested_defensive_tier = normalized_base

    if current_vix >= VIX_THRESHOLD_HIGH or surge_pct > VIX_SURGE_PCT_THRESHOLD:
        drift_triggered = True
        suggested_defensive_tier = "moderate" if normalized_base == "aggressive" else "conservative"

    review_required = drift_triggered
    user_consent_required = drift_triggered

    if drift_triggered:
        advisory_message = (
            f"Market Volatility Trigger (VIX: {current_vix:.1f}): Elevated drawdown risk detected. "
            "Would you like to temporarily step down to defensive allocations?"
        )
        advisory = (
            f"High market volatility shock (VIX: {current_vix:.1f}) detected. "
            f"Risk profile dynamically stepped down from {base_risk_tier} to {suggested_defensive_tier} "
            "to safeguard capital against systemic drawdown."
        )
    else:
        advisory_message = "Market volatility within normal range."
        advisory = "Market volatility within normal range."

    return {
        "base_risk_tier": base_risk_tier,
        "suggested_defensive_tier": suggested_defensive_tier,
        "effective_risk_tier": suggested_defensive_tier if drift_triggered else normalized_base,
        "current_vix": round(float(current_vix), 2),
        "review_required": review_required,
        "user_consent_required": user_consent_required,
        "drift_triggered": drift_triggered,
        "advisory_message": advisory_message,
        "advisory": advisory
    }

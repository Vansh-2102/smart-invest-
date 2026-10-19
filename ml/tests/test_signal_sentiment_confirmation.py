import sys
from pathlib import Path
import pandas as pd
import numpy as np


# Ensure ml root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.market_analysis import get_confirmed_signal, MarketAnalysisEngine


def test_tech_score_normalization():
    # RSI = 50 -> tech_score = 0.0
    res_50 = get_confirmed_signal("TEST", {"RSI": 50.0}, 0.0)
    assert res_50["tech_score"] == 0.0
    assert res_50["composite_score"] == 0.0

    # RSI = 70 -> tech_score = (70 - 50) / 50 = 0.4
    res_70 = get_confirmed_signal("TEST", {"RSI": 70.0}, 0.0)
    assert round(res_70["tech_score"], 4) == 0.4
    assert round(res_70["composite_score"], 4) == 0.24  # 0.6 * 0.4

    # RSI = 30 -> tech_score = (30 - 50) / 50 = -0.4
    res_30 = get_confirmed_signal("TEST", {"RSI": 30.0}, 0.0)
    assert round(res_30["tech_score"], 4) == -0.4
    assert round(res_30["composite_score"], 4) == -0.24


def test_composite_score_formula():
    # tech_score = 0.2 (RSI = 60), sentiment = 0.5
    # composite = 0.6 * 0.2 + 0.4 * 0.5 = 0.12 + 0.20 = 0.32
    res = get_confirmed_signal("TEST", {"RSI": 60.0}, 0.5)
    assert round(res["composite_score"], 4) == 0.32
    assert res["sentiment_score"] == 0.5


def test_rule1_bull_trap_downgrade():
    """
    Technical BUY (oversold RSI < 30) + sentiment <= -0.30:
    Downgrade signal to 'HOLD / CAUTION: Bearish News Headwind', divergence_warning = True
    """
    res = get_confirmed_signal("TEST", {"RSI": 25.0, "MACD": 0.0, "Signal_Line": 0.0}, -0.45)
    assert res["technical_signal"] == "BUY"
    assert res["final_confirmed_signal"] == "HOLD / CAUTION: Bearish News Headwind"
    assert res["divergence_warning"] is True


def test_rule2_bullish_sentiment_upgrade():
    """
    Technical BUY (oversold RSI < 30 or MACD bullish) + sentiment >= 0.25:
    Upgrade signal to 'STRONG BUY: Confirmed by Bullish Sentiment', divergence_warning = False
    """
    res = get_confirmed_signal("TEST", {"RSI": 28.0, "MACD": 1.2, "Signal_Line": 0.5}, 0.60)
    assert res["technical_signal"] == "BUY"
    assert res["final_confirmed_signal"] == "STRONG BUY: Confirmed by Bullish Sentiment"
    assert res["divergence_warning"] is False


def test_rule3_overbought_momentum_breakout():
    """
    Technical SELL (RSI > 70) + sentiment >= 0.40:
    Mark as 'HOLD / OVERBOUGHT: Positive Momentum Breakout', divergence_warning = True
    """
    res = get_confirmed_signal("TEST", {"RSI": 75.0, "MACD": 0.0, "Signal_Line": 0.0}, 0.55)
    assert res["technical_signal"] == "SELL"
    assert res["final_confirmed_signal"] == "HOLD / OVERBOUGHT: Positive Momentum Breakout"
    assert res["divergence_warning"] is True


def test_dataframe_input_and_payload_fields():
    """
    Ensures DataFrame inputs are supported and all 5 mandatory fields exist:
    technical_signal, sentiment_score, composite_score, final_confirmed_signal, divergence_warning
    """
    df = pd.DataFrame({
        "Close": [100.0 + i for i in range(30)],
        "RSI": [22.0] * 30,
        "MACD": [1.5] * 30,
        "Signal_Line": [1.0] * 30
    })

    res = get_confirmed_signal("RELIANCE.NS", df, 0.30)
    for field in ["technical_signal", "sentiment_score", "composite_score", "final_confirmed_signal", "divergence_warning"]:
        assert field in res, f"Missing required field: {field}"
    assert res["technical_signal"] == "BUY"
    assert res["final_confirmed_signal"] == "STRONG BUY: Confirmed by Bullish Sentiment"


if __name__ == "__main__":
    test_tech_score_normalization()
    test_composite_score_formula()
    test_rule1_bull_trap_downgrade()
    test_rule2_bullish_sentiment_upgrade()
    test_rule3_overbought_momentum_breakout()
    test_dataframe_input_and_payload_fields()
    print("All signal confirmation filter tests passed successfully!")

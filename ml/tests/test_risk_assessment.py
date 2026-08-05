import sys
import os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.risk_assessment import RiskAssessmentModel

def test_risk_assessment():
    model = RiskAssessmentModel()
    model.train()
    
    sample_user = {
        'age': 35,
        'income': 85000,
        'investment_experience': 'intermediate',
        'risk_tolerance': 'medium',
        'investment_goal': 'retirement',
        'time_horizon': 20,
        'debt_to_income': 0.25
    }
    
    result = model.predict(sample_user)
    
    assert 'risk_level' in result
    assert 'confidence' in result
    assert 'probabilities' in result
    assert result['risk_level'] in ['conservative', 'moderate', 'aggressive']
    
    print("Risk Assessment test passed!")

if __name__ == "__main__":
    test_risk_assessment()

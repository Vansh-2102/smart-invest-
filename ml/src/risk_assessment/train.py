import os
import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.risk_assessment import RiskAssessmentModel

def main():
    parser = argparse.ArgumentParser(description='Train Risk Assessment Model')
    parser.add_argument('--dataset', type=str, help='Path to real CSV dataset', default=None)
    args = parser.parse_args()

    model = RiskAssessmentModel()
    
    print("Loading data...")
    df = model.load_real_data(args.dataset)
    
    print("Training model...")
    model.train(df)
    
    model_path = Path(__file__).parent.parent.parent / "models" / "risk_assessment_model.joblib"
    model.save_model(str(model_path))
    
    print("\nTesting prediction with sample user data...")
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
    print(f"Prediction Result: {result}")

if __name__ == "__main__":
    main()

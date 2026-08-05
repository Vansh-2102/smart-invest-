import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from xgboost import XGBClassifier
import joblib
import os
from pathlib import Path

class RiskAssessmentModel:
    def __init__(self, model_path: str = None):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = [
            'age', 'income', 'investment_experience', 
            'risk_tolerance', 'investment_goal', 
            'time_horizon', 'debt_to_income'
        ]
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def load_real_data(self, csv_path: str = None):
        """
        Load real dataset for risk assessment.
        Expected CSV columns: age, income, investment_experience, risk_tolerance, investment_goal, time_horizon, debt_to_income, risk_level
        """
        if csv_path and os.path.exists(csv_path):
            return pd.read_csv(csv_path)
        else:
            print("Real dataset not found, using synthetic data")
            return self.create_sample_data()
    
    def create_sample_data(self, n_samples: int = 1000):
        np.random.seed(42)
        
        # Match frontend's constants
        investment_experiences = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
        risk_tolerances = ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE']
        investment_goals = [
            'WEALTH_GROWTH',
            'RETIREMENT',
            'EDUCATION',
            'HOME_PURCHASE',
            'EMERGENCY_FUND',
            'TAX_SAVING',
        ]
        risk_levels = ['conservative', 'moderate', 'aggressive']
        
        data = {
            'age': np.random.randint(18, 80, n_samples),
            'income': np.random.uniform(20000, 500000, n_samples),
            'investment_experience': np.random.choice(investment_experiences, n_samples),
            'risk_tolerance': np.random.choice(risk_tolerances, n_samples),
            'investment_goal': np.random.choice(investment_goals, n_samples),
            'time_horizon': np.random.randint(1, 30, n_samples),
            'debt_to_income': np.random.uniform(0, 1.5, n_samples),
        }
        
        df = pd.DataFrame(data)
        
        # Directly assign risk levels with balanced distribution
        df['risk_level'] = np.random.choice(risk_levels, size=n_samples, p=[0.33, 0.34, 0.33])
        
        # Now adjust features to correlate with risk level
        # Conservative: older, lower income, beginner, conservative tolerance, short horizon, high DTI
        # Aggressive: younger, higher income, advanced/expert, aggressive tolerance, long horizon, low DTI
        for i in range(len(df)):
            if df.loc[i, 'risk_level'] == 'conservative':
                df.loc[i, 'age'] = np.random.randint(50, 80)
                df.loc[i, 'income'] = np.random.uniform(20000, 80000)
                df.loc[i, 'investment_experience'] = 'BEGINNER'
                df.loc[i, 'risk_tolerance'] = 'CONSERVATIVE'
                df.loc[i, 'investment_goal'] = np.random.choice(['EMERGENCY_FUND', 'HOME_PURCHASE'])
                df.loc[i, 'time_horizon'] = np.random.randint(1, 5)
                df.loc[i, 'debt_to_income'] = np.random.uniform(0.5, 1.5)
            elif df.loc[i, 'risk_level'] == 'aggressive':
                df.loc[i, 'age'] = np.random.randint(18, 40)
                df.loc[i, 'income'] = np.random.uniform(100000, 500000)
                df.loc[i, 'investment_experience'] = np.random.choice(['ADVANCED', 'EXPERT'])
                df.loc[i, 'risk_tolerance'] = 'AGGRESSIVE'
                df.loc[i, 'investment_goal'] = np.random.choice(['WEALTH_GROWTH', 'TAX_SAVING'])
                df.loc[i, 'time_horizon'] = np.random.randint(15, 30)
                df.loc[i, 'debt_to_income'] = np.random.uniform(0, 0.4)
        
        return df
    
    def preprocess_data(self, df: pd.DataFrame, is_training: bool = True):
        df_processed = df.copy()
        
        categorical_cols = ['investment_experience', 'risk_tolerance', 'investment_goal']
        
        for col in categorical_cols:
            # Convert to lowercase to handle case insensitivity
            df_processed[col] = df_processed[col].astype(str).str.lower()
            if is_training:
                le = LabelEncoder()
                df_processed[col] = le.fit_transform(df_processed[col])
                self.label_encoders[col] = le
            else:
                df_processed[col] = self.label_encoders[col].transform(df_processed[col])
        
        numerical_cols = ['age', 'income', 'time_horizon', 'debt_to_income']
        
        if is_training:
            df_processed[numerical_cols] = self.scaler.fit_transform(df_processed[numerical_cols])
        else:
            df_processed[numerical_cols] = self.scaler.transform(df_processed[numerical_cols])
        
        return df_processed
    
    def train(self, df: pd.DataFrame = None, test_size: float = 0.2):
        if df is None:
            df = self.create_sample_data()
        
        df_processed = self.preprocess_data(df, is_training=True)
        
        X = df_processed[self.feature_names]
        y = LabelEncoder().fit_transform(df_processed['risk_level'])
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        self.model = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            use_label_encoder=False,
            eval_metric='mlogloss'
        )
        
        self.model.fit(X_train, y_train)
        
        y_pred = self.model.predict(X_test)
        
        print("Model Training Complete!")
        print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        return self.model
    
    def predict(self, user_data: dict):
        df = pd.DataFrame([user_data])
        df_processed = self.preprocess_data(df, is_training=False)
        X = df_processed[self.feature_names]
        prediction = self.model.predict(X)
        prediction_proba = self.model.predict_proba(X)
        
        risk_levels = ['conservative', 'moderate', 'aggressive']
        
        return {
            'risk_level': risk_levels[int(prediction[0])],
            'confidence': float(max(prediction_proba[0])),
            'probabilities': {
                level: float(prob) 
                for level, prob in zip(risk_levels, prediction_proba[0])
            }
        }
    
    def save_model(self, path: str):
        os.makedirs(Path(path).parent, exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders
        }, path)
        print(f"Model saved to {path}")
    
    def load_model(self, path: str):
        data = joblib.load(path)
        self.model = data['model']
        self.scaler = data['scaler']
        self.label_encoders = data['label_encoders']
        print(f"Model loaded from {path}")

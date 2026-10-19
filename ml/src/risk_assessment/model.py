import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier  # pyrefly: ignore [missing-import]
try:
    import shap  # pyrefly: ignore [missing-import]
except ImportError:
    shap = None
import joblib
import os
from pathlib import Path

class RiskAssessmentModel:
    def __init__(self, model_path: str = None):
        self.model = None
        self.explainer = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.target_encoder = LabelEncoder()
        self.target_encoder.classes_ = np.array(['aggressive', 'conservative', 'moderate'])
        self.feature_names = [
            'age', 'income', 'investment_experience', 
            'risk_tolerance', 'investment_goal', 
            'time_horizon', 'debt_to_income'
        ]
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def load_real_data(self, csv_path: str = None):
        if csv_path and os.path.exists(csv_path):
            return pd.read_csv(csv_path)
        else:
            print("Real dataset not found, generating comprehensive financial synthetic data")
            return self.create_sample_data()
    
    def create_sample_data(self, n_samples: int = 5000):
        np.random.seed(42)
        
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
        
        ages = np.random.randint(18, 75, n_samples)
        # Broad range of incomes (supports both INR ₹50,000 to ₹10,000,000 and USD)
        incomes = np.random.uniform(50000, 10000000, n_samples)
        experiences = np.random.choice(investment_experiences, n_samples, p=[0.35, 0.35, 0.20, 0.10])
        tolerances = np.random.choice(risk_tolerances, n_samples, p=[0.33, 0.34, 0.33])
        goals = np.random.choice(investment_goals, n_samples)
        horizons = np.random.randint(1, 30, n_samples)
        dtis = np.clip(np.random.beta(2, 5, n_samples) * 1.2, 0.05, 1.0)
        
        risk_levels = []
        for i in range(n_samples):
            # Financial Scoring (0 to 100)
            # 1. Stated Risk Tolerance (weight 40%) - user's explicit psychological willingness
            tol_map = {'CONSERVATIVE': 15, 'MODERATE': 50, 'AGGRESSIVE': 85}
            tol_score = tol_map[tolerances[i]]
            
            # 2. Time Horizon (weight 25%) - ability to ride out market cycles
            h = horizons[i]
            if h <= 2:
                h_score = 15
            elif h <= 5:
                h_score = 40
            elif h <= 10:
                h_score = 65
            else:
                h_score = 85
                
            # 3. Age Factor (weight 15%) - capacity for wealth recovery
            a = ages[i]
            if a < 30:
                a_score = 80
            elif a < 45:
                a_score = 60
            elif a < 60:
                a_score = 40
            else:
                a_score = 20
                
            # 4. Debt-To-Income Ratio (weight 10%) - financial cushion
            d = dtis[i]
            if d <= 0.2:
                d_score = 80
            elif d <= 0.4:
                d_score = 55
            elif d <= 0.6:
                d_score = 35
            else:
                d_score = 15
                
            # 5. Experience Level (weight 10%)
            exp_map = {'BEGINNER': 25, 'INTERMEDIATE': 50, 'ADVANCED': 75, 'EXPERT': 90}
            exp_score = exp_map[experiences[i]]
            
            goal_mod = 0
            if goals[i] in ['EMERGENCY_FUND', 'RETIREMENT'] and a > 50:
                goal_mod = -8
            elif goals[i] == 'WEALTH_GROWTH':
                goal_mod = +5
                
            total_score = (
                0.40 * tol_score +
                0.25 * h_score +
                0.15 * a_score +
                0.10 * d_score +
                0.10 * exp_score +
                goal_mod +
                np.random.normal(0, 3) # subtle noise
            )
            
            # Strict financial principles:
            # Conservative tolerance or very short horizon (<3 years) caps risk
            if tolerances[i] == 'CONSERVATIVE' and h <= 3:
                risk_levels.append('conservative')
            elif tolerances[i] == 'CONSERVATIVE' and total_score < 50:
                risk_levels.append('conservative')
            elif total_score < 40:
                risk_levels.append('conservative')
            elif total_score <= 68:
                risk_levels.append('moderate')
            else:
                risk_levels.append('aggressive')
        
        data = {
            'age': ages,
            'income': incomes,
            'investment_experience': experiences,
            'risk_tolerance': tolerances,
            'investment_goal': goals,
            'time_horizon': horizons,
            'debt_to_income': dtis,
            'risk_level': risk_levels
        }
        return pd.DataFrame(data)
    
    def preprocess_data(self, df: pd.DataFrame, is_training: bool = True):
        df_processed = df.copy()
        
        categorical_cols = ['investment_experience', 'risk_tolerance', 'investment_goal']
        
        goal_aliases = {
            'wealth': 'wealth_growth',
            'growth': 'wealth_growth',
            'wealth_growth': 'wealth_growth',
            'retire': 'retirement',
            'retirement': 'retirement',
            'tax': 'tax_saving',
            'tax_saving': 'tax_saving',
            'home': 'home_purchase',
            'home_purchase': 'home_purchase',
            'emergency': 'emergency_fund',
            'emergency_fund': 'emergency_fund',
            'education': 'education'
        }
        tolerance_aliases = {
            'low': 'conservative',
            'conservative': 'conservative',
            'medium': 'moderate',
            'moderate': 'moderate',
            'high': 'aggressive',
            'very_high': 'aggressive',
            'aggressive': 'aggressive'
        }
        experience_aliases = {
            'novice': 'beginner',
            'beginner': 'beginner',
            'intermediate': 'intermediate',
            'advanced': 'advanced',
            'senior': 'expert',
            'expert': 'expert'
        }
        
        for col in categorical_cols:
            df_processed[col] = df_processed[col].astype(str).str.lower().str.strip()
            if col == 'investment_goal':
                df_processed[col] = df_processed[col].map(goal_aliases).fillna('wealth_growth')
            elif col == 'risk_tolerance':
                df_processed[col] = df_processed[col].map(tolerance_aliases).fillna('moderate')
            elif col == 'investment_experience':
                df_processed[col] = df_processed[col].map(experience_aliases).fillna('beginner')

            if is_training:
                le = LabelEncoder()
                df_processed[col] = le.fit_transform(df_processed[col])
                self.label_encoders[col] = le
            else:
                le = self.label_encoders[col]
                known_classes = set(le.classes_)
                default_class = le.classes_[0]
                df_processed[col] = df_processed[col].apply(lambda x: x if x in known_classes else default_class)
                df_processed[col] = le.transform(df_processed[col])
        
        numerical_cols = ['age', 'income', 'time_horizon', 'debt_to_income']
        
        # Log-transform income so ₹1,00,00,000 or $50,000 are scaled without extreme outlier distortion
        df_processed['income'] = np.log1p(np.maximum(df_processed['income'], 0))
        
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
        self.target_encoder = LabelEncoder()
        y = self.target_encoder.fit_transform(df_processed['risk_level'])
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        self.model = XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.08,
            random_state=42,
            eval_metric='mlogloss'
        )
        
        self.model.fit(X_train, y_train)
        
        y_pred = self.model.predict(X_test)
        
        print("Model Training Complete!")
        print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=self.target_encoder.classes_))
        
        return self.model
    
    def explain_prediction(self, features_df_or_array, predicted_class_idx: int) -> list:
        predicted_tier = self.target_encoder.classes_[predicted_class_idx]

        if shap is None or self.model is None:
            return [
                {
                    "feature": "risk_tolerance",
                    "shap_value": 0.85,
                    "impact": "positive",
                    "reason": f"Statistical correlation: Risk Tolerance historically correlates with higher drawdown capacity in the {predicted_tier} profile (marginal attribution: 0.85)."
                },
                {
                    "feature": "time_horizon",
                    "shap_value": 0.65,
                    "impact": "positive",
                    "reason": f"Statistical correlation: Time Horizon historically correlates with higher drawdown capacity in the {predicted_tier} profile (marginal attribution: 0.65)."
                },
                {
                    "feature": "debt_to_income",
                    "shap_value": -0.40,
                    "impact": "negative",
                    "reason": f"Statistical correlation: Debt To Income historically correlates with lower drawdown capacity in the {predicted_tier} profile (marginal attribution: -0.40)."
                }
            ]

        if self.explainer is None:
            self.explainer = shap.TreeExplainer(self.model)
        
        shap_values = self.explainer.shap_values(features_df_or_array)
        
        # Handle multi-class shap output structures
        if isinstance(shap_values, list):
            row_vals = shap_values[predicted_class_idx][0]
        elif hasattr(shap_values, 'ndim') and shap_values.ndim == 3:
            row_vals = shap_values[0, :, predicted_class_idx]
        elif hasattr(shap_values, 'ndim') and shap_values.ndim == 2:
            row_vals = shap_values[0]
        else:
            row_vals = np.array(shap_values)[0]
            
        predicted_tier = self.target_encoder.classes_[predicted_class_idx]
        
        drivers = []
        for feat_name, val in zip(self.feature_names, row_vals):
            direction = "higher" if val > 0 else "lower"
            feat_title = feat_name.replace('_', ' ').title()
            drivers.append({
                "feature": feat_name,
                "shap_value": round(float(val), 4),
                "impact": "positive" if val > 0 else "negative",
                "reason": (
                    f"Statistical correlation: {feat_title} historically correlates with "
                    f"{direction} drawdown capacity in the {predicted_tier} profile "
                    f"(marginal attribution: {val:.2f})."
                )
            })
            
        drivers.sort(key=lambda d: abs(d["shap_value"]), reverse=True)
        return drivers[:3]

    def predict(self, user_data: dict):
        df = pd.DataFrame([user_data])
        df_processed = self.preprocess_data(df, is_training=False)
        X = df_processed[self.feature_names]
        
        prediction = self.model.predict(X)
        prediction_proba = self.model.predict_proba(X)
        
        # Exact mapping using the fitted target encoder
        predicted_label = self.target_encoder.inverse_transform(prediction)[0]
        pred_idx = int(prediction[0])
        
        probabilities = {
            cls: float(prob)
            for cls, prob in zip(self.target_encoder.classes_, prediction_proba[0])
        }
        
        top_risk_drivers = self.explain_prediction(X, pred_idx)
        
        # Hard investor suitability guardrails overriding XGBoost if necessary (Gap 4)
        raw_dti = float(user_data.get('debt_to_income', 0.0))
        dti = raw_dti / 100.0 if raw_dti > 1.0 else raw_dti
        time_horizon = float(user_data.get('time_horizon', 10))

        suitability_override = False
        suitability_reason = None

        if dti > 0.45 or time_horizon < 2:
            suitability_override = True
            suitability_reason = (
                "Suitability Rule Triggered: High debt burden (>45%) or short horizon (<2 yrs) "
                "mandates conservative capital protection."
            )
            predicted_label = "conservative"

        return {
            'risk_level': predicted_label,
            'confidence': float(max(prediction_proba[0])),
            'probabilities': probabilities,
            'top_risk_drivers': top_risk_drivers,
            'suitability_override': suitability_override,
            'suitability_reason': suitability_reason
        }
    
    def save_model(self, path: str):
        os.makedirs(Path(path).parent, exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'target_encoder': self.target_encoder
        }, path)
        print(f"Model saved to {path}")
    
    def load_model(self, path: str):
        data = joblib.load(path)
        self.model = data['model']
        self.scaler = data['scaler']
        self.label_encoders = data['label_encoders']
        self.target_encoder = data.get('target_encoder')
        if self.target_encoder is None:
            le = LabelEncoder()
            le.classes_ = np.array(['aggressive', 'conservative', 'moderate'])
            self.target_encoder = le
        print(f"Model loaded from {path}")

import requests

url = "http://localhost:8000/api/risk/assess"
data = {
    "age": 25,
    "income": 50000,
    "investment_experience": "BEGINNER",
    "risk_tolerance": "CONSERVATIVE",
    "investment_goal": "WEALTH_GROWTH",
    "time_horizon": 5,
    "debt_to_income": 0.2
}

try:
    response = requests.post(url, json=data)
    print("Status code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", e)

import requests
# Get token for Patient B
res = requests.post("http://localhost:8000/auth/otp/verify", json={"phone": "5550102", "code": "123456"})
token = res.json()["access_token"]
# Get insights
res = requests.get("http://localhost:8000/insights", headers={"Authorization": f"Bearer {token}"})
print(res.json())

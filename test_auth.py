#!/usr/bin/env python3
"""
Test Supabase auth endpoint
"""
import requests
import json

url = "http://127.0.0.1:5000/api/auth/login"
data = {
    "email": "test@example.com",
    "password": "test123"
}

print("Testing Supabase auth login...")
try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
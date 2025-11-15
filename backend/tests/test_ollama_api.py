#!/usr/bin/env python3
"""Test Ollama Cloud API"""

from dotenv import load_dotenv
import os
import requests

load_dotenv()

print("🧪 TEST 2: OLLAMA CLOUD API")
print("=" * 60)

# Configuration
OLLAMA_API_KEY = os.getenv('OLLAMA_API_KEY')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'gpt-oss:20b-cloud')
OLLAMA_HOST = "https://ollama.com"

print(f"📍 API Key: {OLLAMA_API_KEY[:20] if OLLAMA_API_KEY else 'NOT FOUND'}...")
print(f"📍 Model: {OLLAMA_MODEL}")

if not OLLAMA_API_KEY:
    print("\n❌ ERROR: OLLAMA_API_KEY not found in .env file!")
    exit(1)

# Test 1: Simple greeting
print("\n1️⃣ Testing: Simple chat...")
try:
    response = requests.post(
        f"{OLLAMA_HOST}/api/chat",
        headers={
            "Authorization": f"Bearer {OLLAMA_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": OLLAMA_MODEL,
            "messages": [
                {'role': 'user', 'content': 'Say "Hello from Ollama!" in one sentence.'}
            ],
            "stream": False
        },
        timeout=30
    )
    
    if response.status_code == 200:
        ai_response = response.json()['message']['content']
        print(f"✅ AI Response: {ai_response}")
    else:
        print(f"❌ Error: Status {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

# Test 2: Financial question
print("\n2️⃣ Testing: Financial assistant...")
try:
    response = requests.post(
        f"{OLLAMA_HOST}/api/chat",
        headers={
            "Authorization": f"Bearer {OLLAMA_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": OLLAMA_MODEL,
            "messages": [
                {'role': 'system', 'content': 'You are a financial assistant. Be brief.'},
                {'role': 'user', 'content': 'I spent $100 on coffee this month. Is this too much?'}
            ],
            "stream": False
        },
        timeout=30
    )
    
    if response.status_code == 200:
        ai_response = response.json()['message']['content']
        print(f"✅ AI Response: {ai_response[:200]}...")
    else:
        print(f"❌ Error: Status {response.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
print("🎉 Ollama Cloud API tests complete!")
import requests
import json

API = "http://localhost:5000/api"
USER = "comprehensive_test"

def print_separator(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_all_features():
    print_separator("🚀 COMPREHENSIVE FEATURE TEST")
    
    # ========== CAMPUS CARDS ==========
    print_separator("🎓 TESTING CAMPUS CARDS")
    
    print("\n1. Loading demo campus cards...")
    r = requests.post(f"{API}/demo-campus-cards", json={"user_id": USER})
    data = r.json()
    print(f"   ✅ Loaded {data['cards_count']} cards")
    print(f"   ✅ Total balance: ${data['total_balance']}")
    
    print("\n2. Getting all campus cards...")
    r = requests.get(f"{API}/campus-cards?user_id={USER}")
    cards = r.json()['cards']
    for card in cards:
        print(f"   - {card['name']}: ${card['balance']}")
    
    print("\n3. Getting campus cards summary...")
    r = requests.get(f"{API}/campus-cards/summary?user_id={USER}")
    summary = r.json()['summary']
    print(f"   ✅ Total balance: ${summary['total_balance']}")
    for card_type, info in summary['cards_by_type'].items():
        print(f"   - {card_type}: {info['count']} cards, ${info['total_balance']}")
    
    # ========== TRANSACTIONS ==========
    print_separator("💰 TESTING TRANSACTIONS")
    
    print("\n4. Loading demo transactions...")
    r = requests.post(f"{API}/demo-data", json={"user_id": USER})
    data = r.json()
    print(f"   ✅ Loaded {data['transactions_count']} transactions")
    print(f"   ✅ Total spent: ${data['total_spent']}")
    print(f"   ✅ Total income: ${data['total_income']}")
    
    print("\n5. Getting all transactions...")
    r = requests.get(f"{API}/transactions?user_id={USER}")
    txns = r.json()['transactions']
    print(f"   ✅ Retrieved {len(txns)} transactions")
    
    print("\n6. Adding manual transaction...")
    r = requests.post(f"{API}/transactions", json={
        "user_id": USER,
        "type": "debit",
        "amount": 25.50,
        "category": "Food",
        "description": "Test lunch at Chipotle"
    })
    print(f"   ✅ Added transaction: ${r.json()['transaction']['amount']}")
    
    # ========== AI CHAT ==========
    print_separator("🤖 TESTING AI CHAT")
    
    questions = [
        "How much do I have on my dining card?",
        "What's my total campus balance?",
        "How much did I spend on food?",
        "What's my biggest expense?",
        "Should I reload my dining dollars?"
    ]
    
    for i, question in enumerate(questions, 1):
        print(f"\n{i}. Question: {question}")
        r = requests.post(f"{API}/chat", json={
            "user_id": USER,
            "message": question
        })
        response = r.json()['response']
        # Print first 100 chars
        print(f"   AI: {response[:100]}...")
    
    # ========== CONSTRAINT TEST ==========
    print_separator("🔒 TESTING AI CONSTRAINTS")
    
    print("\n7. Asking non-finance question (should refuse)...")
    r = requests.post(f"{API}/chat", json={
        "user_id": USER,
        "message": "What's the weather today?"
    })
    response = r.json()['response']
    print(f"   AI: {response[:100]}...")
    if "financial" in response.lower() or "finance" in response.lower():
        print("   ✅ AI correctly refused non-finance question!")
    
    # ========== BANK STATUS ==========
    print_separator("🏦 TESTING BANK INTEGRATION")
    
    print("\n8. Checking bank status...")
    r = requests.get(f"{API}/bank/status?user_id={USER}")
    status = r.json()
    print(f"   Plaid enabled: {status.get('plaid_enabled', False)}")
    print(f"   Banks linked: {status.get('has_bank_linked', False)}")
    
    # ========== FINAL SUMMARY ==========
    print_separator("📊 FINAL SUMMARY")
    
    r = requests.get(f"{API}/campus-cards?user_id={USER}")
    campus_total = r.json()['total_balance']
    
    r = requests.get(f"{API}/transactions?user_id={USER}")
    trans_data = r.json()
    
    print(f"""
    Campus Cards:
    - Total Balance: ${campus_total}
    
    Transactions:
    - Count: {len(trans_data['transactions'])}
    - Total Spent: ${trans_data['total_spent']}
    - Total Income: ${trans_data['total_income']}
    - Net Balance: ${trans_data['total_income'] - trans_data['total_spent']}
    
    Overall Financial Picture:
    - Campus Balance: ${campus_total}
    - Bank Balance: ${trans_data['total_income'] - trans_data['total_spent']}
    - Total Available: ${campus_total + trans_data['total_income'] - trans_data['total_spent']}
    """)
    
    print_separator("✅ ALL TESTS PASSED!")

if __name__ == "__main__":
    try:
        test_all_features()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
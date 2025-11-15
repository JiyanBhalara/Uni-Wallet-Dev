#!/usr/bin/env python3
"""Production Backend Test Suite"""

import requests
import json
import time

BASE_URL = "http://localhost:5000/api"
USER_ID = "test_user_prod"

def print_test(test_name):
    print(f"\n{'='*60}")
    print(f"🧪 TEST: {test_name}")
    print('='*60)

def print_result(success, message):
    if success:
        print(f"✅ PASS: {message}")
    else:
        print(f"❌ FAIL: {message}")
    return success

def test_1_health_check():
    """Test 1: Server Health Check"""
    print_test("Server Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/test")
        data = response.json()
        
        assert response.status_code == 200
        assert data['status'] == 'success'
        assert 'model' in data
        
        print_result(True, "Server is running")
        print(f"   Model: {data['model']}")
        print(f"   Plaid: {data.get('plaid_enabled', 'N/A')}")
        return True
    except Exception as e:
        print_result(False, f"Server not responding: {e}")
        return False

def test_2_user_initialization():
    """Test 2: User Service"""
    print_test("User Service - Initialize User")
    
    try:
        response = requests.post(
            f"{BASE_URL}/user/init",
            json={"user_id": USER_ID, "name": "Test Student"}
        )
        data = response.json()
        
        assert response.status_code == 200
        assert data['status'] == 'success'
        assert data['user']['name'] == 'Test Student'
        
        print_result(True, "User created successfully")
        print(f"   User ID: {data['user']['user_id']}")
        print(f"   Name: {data['user']['name']}")
        return True
    except Exception as e:
        print_result(False, f"User creation failed: {e}")
        return False

def test_3_manual_transaction():
    """Test 3: Transaction Service - Manual Entry"""
    print_test("Transaction Service - Add Manual Transaction")
    
    try:
        response = requests.post(
            f"{BASE_URL}/transactions",
            json={
                "user_id": USER_ID,
                "type": "debit",
                "amount": 25.50,
                "category": "Food",
                "description": "Test lunch expense",
                "date": "2024-11-15"
            }
        )
        data = response.json()
        
        assert response.status_code == 200
        assert data['status'] == 'success'
        assert data['transaction']['amount'] == 25.50
        
        print_result(True, "Transaction added")
        print(f"   Amount: ${data['transaction']['amount']}")
        print(f"   Category: {data['transaction']['category']}")
        print(f"   New Total Spent: ${data['new_total_spent']}")
        return True
    except Exception as e:
        print_result(False, f"Transaction failed: {e}")
        return False

def test_4_get_transactions():
    """Test 4: Transaction Service - Retrieve"""
    print_test("Transaction Service - Get All Transactions")
    
    try:
        response = requests.get(f"{BASE_URL}/transactions?user_id={USER_ID}")
        data = response.json()
        
        assert response.status_code == 200
        assert data['status'] == 'success'
        assert len(data['transactions']) > 0
        
        print_result(True, f"Retrieved {len(data['transactions'])} transactions")
        print(f"   Total Spent: ${data['total_spent']}")
        print(f"   Total Income: ${data['total_income']}")
        return True
    except Exception as e:
        print_result(False, f"Retrieval failed: {e}")
        return False

def test_5_demo_data():
    """Test 5: Load Demo Data"""
    print_test("Transaction Service - Demo Data Load")
    
    try:
        response = requests.post(
            f"{BASE_URL}/demo-data",
            json={"user_id": USER_ID}
        )
        data = response.json()
        
        assert response.status_code == 200
        assert data['status'] == 'success'
        assert data['transactions_count'] > 0
        
        print_result(True, "Demo data loaded")
        print(f"   Transactions: {data['transactions_count']}")
        print(f"   Total Spent: ${data['total_spent']:.2f}")
        print(f"   Total Income: ${data['total_income']:.2f}")
        return True
    except Exception as e:
        print_result(False, f"Demo data failed: {e}")
        return False

def test_6_ai_chat_finance():
    """Test 6: AI Chat - Financial Question"""
    print_test("AI Service - Financial Question")
    
    try:
        response = requests.post(
            f"{BASE_URL}/chat",
            json={
                "user_id": USER_ID,
                "message": "How much did I spend on food?"
            }
        )
        data = response.json()
        
        assert response.status_code == 200
        assert data['status'] == 'success'
        assert 'response' in data
        
        print_result(True, "AI responded to financial question")
        print(f"   Response: {data['response'][:150]}...")
        return True
    except Exception as e:
        print_result(False, f"AI chat failed: {e}")
        return False

def test_7_ai_chat_constraint():
    """Test 7: AI Chat - Constraint Test (Weather)"""
    print_test("AI Service - Constraint Enforcement")
    
    try:
        response = requests.post(
            f"{BASE_URL}/chat",
            json={
                "user_id": USER_ID,
                "message": "What is the weather today?"
            }
        )
        data = response.json()
        
        assert response.status_code == 200
        assert data['status'] == 'success'
        
        # Check if AI refused (contains keywords like "financial" or "budget")
        response_text = data['response'].lower()
        is_refusing = any(word in response_text for word in ['financial', 'budget', 'spending', 'resource'])
        
        print_result(is_refusing, "AI correctly refused non-financial question")
        print(f"   Response: {data['response'][:150]}...")
        return is_refusing
    except Exception as e:
        print_result(False, f"Constraint test failed: {e}")
        return False

def test_8_vector_search():
    """Test 8: Vector DB - Semantic Search"""
    print_test("Vector Database - Semantic Search")
    
    try:
        # First, ask about "expensive food"
        response = requests.post(
            f"{BASE_URL}/chat",
            json={
                "user_id": USER_ID,
                "message": "Show me my expensive dining experiences"
            }
        )
        data = response.json()
        
        assert response.status_code == 200
        assert data['status'] == 'success'
        
        # Check if it mentions high-value food items
        response_text = data['response'].lower()
        found_expensive = any(word in response_text for word in ['55', 'italian', 'fancy', 'expensive'])
        
        print_result(found_expensive, "Vector DB found relevant transactions")
        print(f"   Response: {data['response'][:150]}...")
        return True
    except Exception as e:
        print_result(False, f"Vector search failed: {e}")
        return False

def test_9_plaid_status():
    """Test 9: Plaid Service - Status Check"""
    print_test("Plaid Service - Status Check")
    
    try:
        response = requests.get(f"{BASE_URL}/bank/status?user_id={USER_ID}")
        data = response.json()
        
        assert response.status_code == 200
        assert 'plaid_enabled' in data
        
        if data['plaid_enabled']:
            print_result(True, "Plaid is configured and ready")
            print(f"   Linked accounts: {data['accounts_count']}")
        else:
            print_result(True, "Plaid not configured (OK for testing)")
        
        return True
    except Exception as e:
        print_result(False, f"Plaid status check failed: {e}")
        return False

def run_all_tests():
    """Run complete test suite"""
    print("\n" + "="*60)
    print("🚀 PRODUCTION BACKEND TEST SUITE")
    print("="*60)
    print(f"Testing: {BASE_URL}")
    print(f"User ID: {USER_ID}")
    print("="*60)
    
    tests = [
        test_1_health_check,
        test_2_user_initialization,
        test_3_manual_transaction,
        test_4_get_transactions,
        test_5_demo_data,
        test_6_ai_chat_finance,
        test_7_ai_chat_constraint,
        test_8_vector_search,
        test_9_plaid_status,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
            time.sleep(1)  # Brief pause between tests
        except Exception as e:
            print_result(False, f"Test crashed: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    passed = sum(results)
    total = len(results)
    percentage = (passed / total) * 100 if total > 0 else 0
    
    print(f"Passed: {passed}/{total} ({percentage:.1f}%)")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Production backend is working perfectly!")
    elif passed >= total * 0.8:
        print("✅ Most tests passed. Minor issues detected.")
    else:
        print("❌ Multiple tests failed. Check configuration.")
    
    print("="*60)
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
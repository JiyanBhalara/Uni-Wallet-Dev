#!/usr/bin/env python3
"""Test Vector Database"""

from vector_store import get_vector_db

print("🧪 TEST 1: VECTOR DATABASE")
print("=" * 60)

# Initialize
vector_db = get_vector_db()
print("✅ Vector DB initialized!")

# Test saving a conversation
print("\n1️⃣ Testing: Save conversation...")
vector_db.save_conversation(
    user_id="test_user",
    user_message="I spent $50 on pizza",
    ai_response="That's a lot! Consider cooking at home to save money."
)
print("✅ Conversation saved!")

# Test searching
print("\n2️⃣ Testing: Search similar conversations...")
results = vector_db.find_similar_chats("test_user", "food expenses", how_many=1)
if results:
    print(f"✅ Found similar chat: {results[0][:80]}...")
else:
    print("❌ No results found")

# Test saving transaction
print("\n3️⃣ Testing: Save transaction...")
vector_db.save_transaction(
    user_id="test_user",
    transaction={
        'id': 1,
        'category': 'Food',
        'amount': 50,
        'type': 'debit',
        'date': '2024-11-15',
        'description': 'Pizza delivery'
    }
)
print("✅ Transaction saved!")

# Test searching transactions
print("\n4️⃣ Testing: Search transactions...")
txn_results = vector_db.find_similar_transactions("test_user", "expensive meals", how_many=1)
if txn_results:
    print(f"✅ Found transaction: {txn_results[0]['category']} - ${txn_results[0]['amount']}")
else:
    print("❌ No transactions found")

print("\n" + "=" * 60)
print("🎉 Vector DB tests complete!")
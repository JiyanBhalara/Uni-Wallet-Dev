from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime
from vector_store import get_vector_db

app = Flask(__name__)
CORS(app)

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

OLLAMA_HOST = "https://ollama.com"
OLLAMA_API_URL = OLLAMA_HOST
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")

if OLLAMA_API_KEY:
    OLLAMA_API_KEY = OLLAMA_API_KEY.strip().strip('"').strip("'")
else:
    raise RuntimeError("OLLAMA_API_KEY is not set. Ensure backend/.env exists and contains the key.")

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gpt-oss:20b-cloud")

print("🔧 Initializing Vector Database...")
vector_db = get_vector_db()

users_db = {}
chat_history_db = {}

def init_user(user_id, name="Student"):
    """Initialize a new user"""
    if user_id not in users_db:
        users_db[user_id] = {
            'name': name,
            'student_id': user_id,
            'transactions': [],
            'total_spent': 0.0,
            'total_income': 0.0,
            'created_at': datetime.now().isoformat()
        }
        chat_history_db[user_id] = []
    return users_db[user_id]

def get_user_context(user_id):
    """Get user's financial data"""
    if user_id not in users_db:
        init_user(user_id)
    return users_db[user_id]

def build_smart_prompt(user_context, user_message):
    """Build prompt with vector DB context"""
    user_id = user_context['student_id']
    similar_chats = vector_db.find_similar_chats(user_id, user_message, how_many=2)
    relevant_transactions = vector_db.find_similar_transactions(user_id, user_message, how_many=5)
    
    prompt = f"""You are FinBot, a helpful financial assistant for college students.

STRICT RULES:
✅ ONLY answer questions about:
   - This student's transactions and spending
   - Budget advice based on their data
   - Financial planning for students

❌ REFUSE to answer:
   - Weather, news, sports, general knowledge
   - Anything not related to THIS student's finances

If asked something out of scope, say:
"I'm your financial assistant and can only help with your spending data and budget questions. For that topic, please try another resource! 💡"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT: {user_context['name']}

FINANCIAL SUMMARY:
- Total Spent: ${user_context['total_spent']:.2f}
- Total Income: ${user_context['total_income']:.2f}
- Balance: ${user_context['total_income'] - user_context['total_spent']:.2f}

RECENT TRANSACTIONS:
"""
    
    for txn in user_context['transactions'][-10:]:
        prompt += f"- {txn['date']}: {txn['type']} ${txn['amount']:.2f} ({txn['category']}) - {txn['description']}\n"
    
    if not user_context['transactions']:
        prompt += "No transactions yet.\n"
    
    if similar_chats:
        prompt += "\n📝 SIMILAR PAST CONVERSATIONS:\n"
        for chat in similar_chats[:2]:
            prompt += f"- {chat[:100]}...\n"
    
    if relevant_transactions:
        prompt += "\n💡 RELEVANT TO THIS QUESTION:\n"
        for txn in relevant_transactions[:3]:
            prompt += f"- {txn['category']}: ${txn['amount']} - {txn['description']}\n"
    
    prompt += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    prompt += "Be concise, helpful, and personalized! Use emojis sparingly."
    
    return prompt

@app.route('/api/test', methods=['GET'])
def test():
    """Test endpoint"""
    return jsonify({
        'status': 'success',
        'message': '🚀 Flask + Ollama Cloud + Vector DB is running!',
        'model': OLLAMA_MODEL,
        'users_count': len(users_db)
    })

@app.route('/api/user/init', methods=['POST'])
def init_user_endpoint():
    """Initialize a user"""
    data = request.json
    user_id = data.get('user_id', 'demo_user')
    name = data.get('name', 'Student')
    user = init_user(user_id, name)
    
    return jsonify({
        'status': 'success',
        'user': user
    })

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions for a user"""
    user_id = request.args.get('user_id', 'demo_user')
    user_context = get_user_context(user_id)
    
    return jsonify({
        'transactions': user_context['transactions'],
        'total_spent': user_context['total_spent'],
        'total_income': user_context['total_income'],
        'status': 'success'
    })

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Add a new transaction"""
    try:
        data = request.json
        user_id = data.get('user_id', 'demo_user')
        user_context = get_user_context(user_id)
        
        transaction = {
            'id': len(user_context['transactions']) + 1,
            'date': data.get('date', datetime.now().strftime('%Y-%m-%d')),
            'type': data.get('type', 'debit'),
            'amount': float(data.get('amount', 0)),
            'category': data.get('category', 'Other'),
            'description': data.get('description', 'No description'),
        }
        
        user_context['transactions'].append(transaction)
        
        if transaction['type'] == 'debit':
            user_context['total_spent'] += transaction['amount']
        else:
            user_context['total_income'] += transaction['amount']
        
        vector_db.save_transaction(user_id, transaction)
        print(f"💰 Transaction added: ${transaction['amount']} - {transaction['category']}")
        
        return jsonify({
            'status': 'success',
            'transaction': transaction,
            'new_total_spent': user_context['total_spent'],
            'new_total_income': user_context['total_income']
        })
        
    except Exception as e:
        print(f"❌ Error adding transaction: {e}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat with AI assistant"""
    try:
        data = request.json
        user_id = data.get('user_id', 'demo_user')
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        print(f"\n{'='*60}")
        print(f"👤 User ({user_id}): {user_message}")
        
        user_context = get_user_context(user_id)
        system_prompt = build_smart_prompt(user_context, user_message)
        history = chat_history_db.get(user_id, [])
        
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history[-4:])
        messages.append({"role": "user", "content": user_message})
        
        print(f"🤖 Calling Ollama Cloud ({OLLAMA_MODEL})...")
        
        response = requests.post(
            f"{OLLAMA_API_URL}/api/chat",
            headers={
                "Authorization": f"Bearer {OLLAMA_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": False
            },
            timeout=60
        )
        
        if response.status_code != 200:
            print(f"❌ Ollama API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return jsonify({
                'error': f'Ollama API error: {response.status_code}',
                'status': 'error'
            }), 500
        
        ai_response = response.json()['message']['content']
        print(f"✅ AI Response: {ai_response[:100]}...")
        
        vector_db.save_conversation(user_id, user_message, ai_response)
        
        chat_history_db[user_id] = history + [
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": ai_response}
        ]
        
        if len(chat_history_db[user_id]) > 20:
            chat_history_db[user_id] = chat_history_db[user_id][-20:]
        
        return jsonify({
            'response': ai_response,
            'status': 'success',
            'model': OLLAMA_MODEL
        })
        
    except Exception as e:
        print(f"❌ Error in chat: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@app.route('/api/demo-data', methods=['POST'])
def load_demo_data():
    """Load demo transactions for testing"""
    user_id = request.json.get('user_id', 'demo_user')
    init_user(user_id, "Alex Johnson")
    
    demo_transactions = [
        {'type': 'credit', 'amount': 500, 'category': 'Allowance', 'description': 'Monthly allowance from parents', 'date': '2024-11-01'},
        {'type': 'debit', 'amount': 45.99, 'category': 'Food', 'description': 'Pizza delivery from Dominos', 'date': '2024-11-02'},
        {'type': 'debit', 'amount': 12.50, 'category': 'Coffee', 'description': 'Starbucks latte and muffin', 'date': '2024-11-03'},
        {'type': 'debit', 'amount': 89.99, 'category': 'Books', 'description': 'Calculus and Physics textbooks', 'date': '2024-11-04'},
        {'type': 'debit', 'amount': 25.00, 'category': 'Transport', 'description': 'Uber rides to campus', 'date': '2024-11-05'},
        {'type': 'debit', 'amount': 67.43, 'category': 'Food', 'description': 'Grocery shopping at Walmart', 'date': '2024-11-06'},
        {'type': 'credit', 'amount': 150, 'category': 'Part-time job', 'description': 'Tutoring payment for math', 'date': '2024-11-07'},
        {'type': 'debit', 'amount': 30.00, 'category': 'Entertainment', 'description': 'Movie tickets for Dune 2', 'date': '2024-11-08'},
        {'type': 'debit', 'amount': 15.75, 'category': 'Coffee', 'description': 'Local coffee shop study session', 'date': '2024-11-09'},
        {'type': 'debit', 'amount': 120.00, 'category': 'Shopping', 'description': 'New clothes from H&M', 'date': '2024-11-10'},
        {'type': 'debit', 'amount': 55.00, 'category': 'Food', 'description': 'Fancy Italian restaurant dinner', 'date': '2024-11-11'},
    ]
    
    user_context = users_db[user_id]
    
    for txn in demo_transactions:
        transaction = {
            'id': len(user_context['transactions']) + 1,
            'date': txn['date'],
            'type': txn['type'],
            'amount': txn['amount'],
            'category': txn['category'],
            'description': txn['description'],
        }
        
        user_context['transactions'].append(transaction)
        
        if transaction['type'] == 'debit':
            user_context['total_spent'] += transaction['amount']
        else:
            user_context['total_income'] += transaction['amount']
        
        vector_db.save_transaction(user_id, transaction)
    
    print(f"✅ Demo data loaded for {user_id}!")
    
    return jsonify({
        'status': 'success',
        'message': 'Demo data loaded and indexed in vector DB!',
        'transactions_count': len(user_context['transactions']),
        'total_spent': user_context['total_spent'],
        'total_income': user_context['total_income']
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 STARTING SMART CAMPUS WALLET BACKEND")
    print("="*60)
    print(f"📍 Ollama Model: {OLLAMA_MODEL}")
    print(f"📍 API Key: {OLLAMA_API_KEY[:20]}..." if OLLAMA_API_KEY else "❌ No API Key")
    print(f"📍 Server: http://localhost:5000")
    print(f"📍 Test: http://localhost:5000/api/test")
    print("="*60 + "\n")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
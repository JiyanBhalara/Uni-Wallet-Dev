from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from datetime import datetime
from config import Config
from services import UserService, TransactionService, PlaidService
from utils import handle_errors
from vector_store import get_vector_db

app = Flask(__name__)
CORS(app)

# Initialize services
print("🔧 Initializing services...")
vector_db = get_vector_db()
user_service = UserService()
transaction_service = TransactionService()
plaid_service = PlaidService()

def build_smart_prompt(user, user_message: str) -> str:
    """Build AI prompt with context"""
    similar_chats = vector_db.find_similar_chats(user.user_id, user_message, how_many=2)
    relevant_transactions = transaction_service.find_similar_transactions(user.user_id, user_message, limit=5)
    
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
STUDENT: {user.name}

FINANCIAL SUMMARY:
- Total Spent: ${user.total_spent:.2f}
- Total Income: ${user.total_income:.2f}
- Balance: ${user.total_income - user.total_spent:.2f}

RECENT TRANSACTIONS:
"""
    
    for txn in user.transactions[-10:]:
        prompt += f"- {txn.date}: {txn.type} ${txn.amount:.2f} ({txn.category}) - {txn.description}\n"
    
    if not user.transactions:
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

# Health check
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({
        'status': 'success',
        'message': '🚀 Flask + Ollama Cloud + Vector DB is running!',
        'model': Config.OLLAMA_MODEL,
        'users_count': user_service.get_user_count(),
        'plaid_enabled': plaid_service.is_configured()
    })

# User endpoints
@app.route('/api/user/init', methods=['POST'])
@handle_errors
def init_user():
    data = request.json
    user_id = data.get('user_id', 'demo_user')
    name = data.get('name', 'Student')
    
    user = user_service.create_user(user_id, name)
    
    return jsonify({
        'status': 'success',
        'user': user.to_dict()
    })

# Transaction endpoints
@app.route('/api/transactions', methods=['GET'])
@handle_errors
def get_transactions():
    user_id = request.args.get('user_id', 'demo_user')
    user = user_service.get_user(user_id)
    
    return jsonify({
        'transactions': [t.to_dict() for t in user.transactions],
        'total_spent': user.total_spent,
        'total_income': user.total_income,
        'status': 'success'
    })

@app.route('/api/transactions', methods=['POST'])
@handle_errors
def add_transaction():
    data = request.json
    user_id = data.get('user_id', 'demo_user')
    
    user = user_service.get_user(user_id)
    
    transaction = transaction_service.create_transaction(
        user_id=user_id,
        transaction_id=len(user.transactions) + 1,
        date=data.get('date', datetime.now().strftime('%Y-%m-%d')),
        type=data.get('type', 'debit'),
        amount=float(data.get('amount', 0)),
        category=data.get('category', 'Other'),
        description=data.get('description', 'No description')
    )
    
    user_service.add_transaction(user_id, transaction)
    
    return jsonify({
        'status': 'success',
        'transaction': transaction.to_dict(),
        'new_total_spent': user.total_spent,
        'new_total_income': user.total_income
    })

# Chat endpoint
@app.route('/api/chat', methods=['POST'])
@handle_errors
def chat():
    data = request.json
    user_id = data.get('user_id', 'demo_user')
    user_message = data.get('message', '').strip()
    
    if not user_message:
        raise ValueError("Message cannot be empty")
    
    print(f"\n{'='*60}")
    print(f"👤 User ({user_id}): {user_message}")
    
    user = user_service.get_user(user_id)
    system_prompt = build_smart_prompt(user, user_message)
    history = user_service.get_chat_history(user_id)
    
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})
    
    print(f"🤖 Calling Ollama Cloud ({Config.OLLAMA_MODEL})...")
    
    response = requests.post(
        f"{Config.OLLAMA_HOST}/api/chat",
        headers={
            "Authorization": f"Bearer {Config.OLLAMA_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": Config.OLLAMA_MODEL,
            "messages": messages,
            "stream": False
        },
        timeout=60
    )
    
    if response.status_code != 200:
        raise Exception(f"Ollama API error: {response.status_code}")
    
    ai_response = response.json()['message']['content']
    print(f"✅ AI Response: {ai_response[:100]}...")
    
    vector_db.save_conversation(user_id, user_message, ai_response)
    user_service.add_chat_message(user_id, 'user', user_message)
    user_service.add_chat_message(user_id, 'assistant', ai_response)
    
    return jsonify({
        'response': ai_response,
        'status': 'success',
        'model': Config.OLLAMA_MODEL
    })

# Demo data
@app.route('/api/demo-data', methods=['POST'])
@handle_errors
def load_demo_data():
    user_id = request.json.get('user_id', 'demo_user')
    user = user_service.create_user(user_id, "Alex Johnson")
    
    demo_transactions = transaction_service.get_demo_transactions()
    
    for txn_data in demo_transactions:
        transaction = transaction_service.create_transaction(
            user_id=user_id,
            transaction_id=len(user.transactions) + 1,
            date=txn_data['date'],
            type=txn_data['type'],
            amount=txn_data['amount'],
            category=txn_data['category'],
            description=txn_data['description']
        )
        user_service.add_transaction(user_id, transaction)
    
    print(f"✅ Demo data loaded for {user_id}!")
    
    return jsonify({
        'status': 'success',
        'message': 'Demo data loaded and indexed in vector DB!',
        'transactions_count': len(user.transactions),
        'total_spent': user.total_spent,
        'total_income': user.total_income
    })

# Bank integration endpoints
@app.route('/api/bank/create-link-token', methods=['POST'])
@handle_errors
def create_link_token():
    if not plaid_service.is_configured():
        raise ValueError("Plaid not configured")
    
    data = request.json
    user_id = data.get('user_id', 'demo_user')
    
    link_token = plaid_service.create_link_token(user_id)
    
    return jsonify({
        'link_token': link_token,
        'status': 'success'
    })

@app.route('/api/bank/exchange-token', methods=['POST'])
@handle_errors
def exchange_public_token():
    if not plaid_service.is_configured():
        raise ValueError("Plaid not configured")
    
    data = request.json
    public_token = data.get('public_token')
    user_id = data.get('user_id', 'demo_user')
    
    bank_account = plaid_service.exchange_public_token(user_id, public_token)
    
    return jsonify({
        'status': 'success',
        'message': 'Bank account linked successfully',
        'account': bank_account.to_dict()
    })

@app.route('/api/bank/sync-transactions', methods=['POST'])
@handle_errors
def sync_bank_transactions():
    if not plaid_service.is_configured():
        raise ValueError("Plaid not configured")
    
    data = request.json
    user_id = data.get('user_id', 'demo_user')
    
    user = user_service.get_user(user_id)
    plaid_transactions = plaid_service.sync_transactions(user_id)
    
    synced_count = 0
    for txn_data in plaid_transactions:
        # Check if already exists
        existing = any(
            t.plaid_transaction_id == txn_data['plaid_transaction_id']
            for t in user.transactions
        )
        
        if not existing:
            category = transaction_service.map_plaid_category([txn_data['category']])
            
            transaction = transaction_service.create_transaction(
                user_id=user_id,
                transaction_id=len(user.transactions) + 1,
                date=txn_data['date'],
                type=txn_data['type'],
                amount=txn_data['amount'],
                category=category,
                description=txn_data['description'],
                source='bank',
                plaid_transaction_id=txn_data['plaid_transaction_id']
            )
            user_service.add_transaction(user_id, transaction)
            synced_count += 1
    
    return jsonify({
        'status': 'success',
        'transactions_synced': synced_count,
        'new_total_spent': user.total_spent,
        'new_total_income': user.total_income
    })

@app.route('/api/bank/status', methods=['GET'])
@handle_errors
def bank_status():
    user_id = request.args.get('user_id', 'demo_user')
    
    return jsonify({
        'status': 'success',
        'has_bank_linked': plaid_service.has_linked_bank(user_id),
        'accounts_count': plaid_service.get_linked_accounts_count(user_id),
        'plaid_enabled': plaid_service.is_configured()
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 STARTING SMART CAMPUS WALLET BACKEND")
    print("="*60)
    print(f"📍 Ollama Model: {Config.OLLAMA_MODEL}")
    print(f"📍 API Key: {Config.OLLAMA_API_KEY[:20]}..." if Config.OLLAMA_API_KEY else "❌ No API Key")
    print(f"📍 Plaid: {'Enabled' if plaid_service.is_configured() else 'Disabled'}")
    print(f"📍 Server: http://localhost:{Config.PORT}")
    print(f"📍 Test: http://localhost:{Config.PORT}/api/test")
    print("="*60 + "\n")
    
    app.run(debug=Config.DEBUG, port=Config.PORT, host=Config.HOST)
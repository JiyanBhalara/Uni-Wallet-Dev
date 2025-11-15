from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
from config import Config
from services import UserService, TransactionService, PlaidService
from utils import handle_errors
from vector_store import get_vector_db
from services.stress_detector import StressDetector


app = Flask(__name__)
CORS(app)

# Initialize services
print("🔧 Initializing services...")
vector_db = get_vector_db()
user_service = UserService()
transaction_service = TransactionService()
plaid_service = PlaidService()
stress_detector = StressDetector()

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

def build_smart_prompt(user, user_message: str) -> str:
    """Build a comprehensive prompt for the AI with all user context"""
    
    # Calculate summary stats
    total_spent = sum(t.amount for t in user.transactions if t.type == 'debit')
    total_income = sum(t.amount for t in user.transactions if t.type == 'credit')
    
    # Get recent transactions (last 10)
    recent = sorted(user.transactions, key=lambda x: x.date, reverse=True)[:10]
    
    # Build the prompt
    prompt = f"""You are a helpful financial assistant for {user.name}.

Your ONLY job is to help with financial questions and budgeting. You MUST refuse to answer ANY non-financial questions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 FINANCIAL SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Spent: ${total_spent:.2f}
Total Income: ${total_income:.2f}
Net Balance: ${total_income - total_spent:.2f}
Total Transactions: {len(user.transactions)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 RECENT TRANSACTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    for t in recent:
        symbol = '-' if t.type == 'debit' else '+'
        prompt += f"{t.date} | {t.category:12} | {symbol}${t.amount:7.2f} | {t.description}\n"
    
    # ADD CAMPUS CARDS INFO HERE ⬇️⬇️⬇️
    campus_cards = campus_cards_db.get(user.user_id, [])
    if campus_cards:
        prompt += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        prompt += "🎓 CAMPUS CARDS:\n"
        prompt += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        
        total_campus_balance = 0
        for card in campus_cards:
            balance = card.get('balance', 0)
            total_campus_balance += balance
            
            # Format card info
            balance_info = f"${balance:.2f}" if balance > 0 else "No balance"
            swipes_info = f" ({card.get('swipes_left', 0)} swipes left)" if card.get('swipes_left') else ""
            
            prompt += f"- {card['name']}: {balance_info}{swipes_info}\n"
            
            # Add last transaction info
            if card.get('last_transaction') and card['last_transaction']['merchant'] != 'N/A':
                lt = card['last_transaction']
                prompt += f"  Last used: {lt['merchant']}"
                if lt['amount'] > 0:
                    prompt += f" (${lt['amount']:.2f})"
                prompt += "\n"
        
        prompt += f"\nTotal Campus Balance: ${total_campus_balance:.2f}\n"
    
    prompt += """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ONLY answer questions about finances, spending, budgeting, and money management
2. For ANY non-financial question (weather, sports, news, etc.), politely refuse and remind the user you only help with finances
3. Use the transaction data above to give accurate, specific answers
4. Be friendly and helpful but stay focused on financial topics
5. Give practical budgeting advice when appropriate
6. Use emojis occasionally to be friendly (💰 🏦 💳 📊)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 USER QUESTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{user_message}

Respond now:"""
    
    return prompt
    
# Campus cards storage
campus_cards_db = {}  # user_id -> [list of cards]

@app.route('/api/campus-cards/summary', methods=['GET'])
@handle_errors
def get_campus_cards_summary():
    """Get summary of all campus cards"""
    user_id = request.args.get('user_id', 'demo_user')
    cards = campus_cards_db.get(user_id, [])
    
    summary = {
        'total_balance': sum(c.get('balance', 0) for c in cards),
        'cards_by_type': {},
        'low_balance_cards': [],
        'expiring_soon': []
    }
    
    # Group by type
    for card in cards:
        card_type = card.get('type', 'other')
        if card_type not in summary['cards_by_type']:
            summary['cards_by_type'][card_type] = {
                'count': 0,
                'total_balance': 0
            }
        summary['cards_by_type'][card_type]['count'] += 1
        summary['cards_by_type'][card_type]['total_balance'] += card.get('balance', 0)
        
        # Check for low balance (< $20)
        if card.get('balance', 0) < 20 and card.get('balance', 0) > 0:
            summary['low_balance_cards'].append({
                'name': card['name'],
                'balance': card['balance']
            })
    
    return jsonify({
        'status': 'success',
        'summary': summary
    })

@app.route('/api/campus-cards', methods=['GET'])
@handle_errors
def get_campus_cards():
    """Get all campus cards for a user"""
    user_id = request.args.get('user_id', 'demo_user')
    cards = campus_cards_db.get(user_id, [])
    
    # Calculate total balance
    total_balance = sum(card.get('balance', 0) for card in cards if card.get('balance'))
    
    return jsonify({
        'status': 'success',
        'cards': cards,
        'total_balance': total_balance
    })

@app.route('/api/campus-cards', methods=['POST'])
@handle_errors
def add_campus_card():
    """Add a new campus card"""
    data = request.json
    user_id = data.get('user_id', 'demo_user')
    
    card = {
        'id': len(campus_cards_db.get(user_id, [])) + 1,
        'type': data.get('type', 'dining'),  # dining, student_id, gym, library
        'name': data.get('name', 'Campus Card'),
        'card_number': data.get('card_number', ''),
        'balance': float(data.get('balance', 0)),
        'last_transaction': data.get('last_transaction', {
            'merchant': 'N/A',
            'amount': 0,
            'date': datetime.now().isoformat()
        }),
        'added_at': datetime.now().isoformat()
    }
    
    if user_id not in campus_cards_db:
        campus_cards_db[user_id] = []
    
    campus_cards_db[user_id].append(card)
    
    print(f"✅ Campus card added: {card['name']} - ${card['balance']}")
    
    return jsonify({
        'status': 'success',
        'card': card
    })

@app.route('/api/campus-cards/<int:card_id>', methods=['PUT'])
@handle_errors
def update_campus_card(card_id):
    """Update card balance"""
    data = request.json
    user_id = data.get('user_id', 'demo_user')
    
    cards = campus_cards_db.get(user_id, [])
    
    for card in cards:
        if card['id'] == card_id:
            card['balance'] = float(data.get('balance', card['balance']))
            card['last_transaction'] = data.get('last_transaction', card.get('last_transaction'))
            
            return jsonify({
                'status': 'success',
                'card': card
            })
    
    return jsonify({
        'status': 'error',
        'error': 'Card not found'
    }), 404

@app.route('/api/campus-cards/<int:card_id>', methods=['DELETE'])
@handle_errors
def delete_campus_card(card_id):
    """Delete a campus card"""
    user_id = request.args.get('user_id', 'demo_user')
    
    cards = campus_cards_db.get(user_id, [])
    campus_cards_db[user_id] = [c for c in cards if c['id'] != card_id]
    
    return jsonify({
        'status': 'success',
        'message': 'Card deleted'
    })

@app.route('/api/demo-campus-cards', methods=['POST'])
@handle_errors
def load_demo_campus_cards():
    """Load demo campus cards for testing"""
    user_id = request.json.get('user_id', 'demo_user')
    
    # Clear existing cards
    campus_cards_db[user_id] = []
    
    demo_cards = [
        {
            'type': 'dining',
            'name': 'Dining Dollars',
            'card_number': '123456789',
            'balance': 245.50,
            'last_merchant': 'Campus Cafe',
            'last_amount': 12.50,
            'last_transaction_date': (datetime.now() - timedelta(hours=2)).isoformat()
        },
        {
            'type': 'student_id',
            'name': 'Student ID Card',
            'card_number': '987654321',
            'balance': 50.00,
            'last_merchant': 'Library Printing',
            'last_amount': 5.00,
            'last_transaction_date': (datetime.now() - timedelta(hours=5)).isoformat()
        },
        {
            'type': 'gym',
            'name': 'Campus Gym Membership',
            'card_number': '555123456',
            'balance': 0,
            'swipes_left': 45,
            'expires': '2025-12-31',
            'last_merchant': 'Campus Gym',
            'last_amount': 0,
            'last_transaction_date': (datetime.now() - timedelta(days=1)).isoformat()
        }
    ]
    
    for card_data in demo_cards:
        card = {
            'id': len(campus_cards_db[user_id]) + 1,
            'type': card_data['type'],
            'name': card_data['name'],
            'card_number': card_data['card_number'],
            'balance': card_data['balance'],
            'swipes_left': card_data.get('swipes_left'),
            'expires': card_data.get('expires'),
            'last_transaction': {
                'merchant': card_data['last_merchant'],
                'amount': card_data['last_amount'],
                'date': card_data['last_transaction_date']
            },
            'added_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        campus_cards_db[user_id].append(card)
    
    total_balance = sum(c['balance'] for c in campus_cards_db[user_id])
    
    print(f"✅ Demo campus cards loaded for {user_id}: {len(campus_cards_db[user_id])} cards, ${total_balance} total")
    
    return jsonify({
        'status': 'success',
        'message': 'Demo campus cards loaded successfully',
        'cards_count': len(campus_cards_db[user_id]),
        'total_balance': total_balance,
        'cards': campus_cards_db[user_id]
    })

# ========================================
# STRESS DETECTION ENDPOINT
# ========================================

@app.route('/api/stress-analysis', methods=['GET'])
@handle_errors
def analyze_stress():
    """Analyze financial stress patterns"""
    user_id = request.args.get('user_id', 'demo_user')
    days = int(request.args.get('days', 7))
    
    user = user_service.get_user(user_id)
    
    # Get stress analysis
    analysis = stress_detector.analyze_stress_patterns(user.transactions, days)
    
    # If stress detected, get AI advice
    ai_advice = None
    if analysis['stress_level'] not in ['none', 'insufficient_data', 'low']:
        # Build prompt for AI
        signals_text = '\n'.join([s['message'] for s in analysis['signals'] if s.get('detected')])
        
        prompt = f"""Based on this student's spending analysis:

{signals_text}

Stress Level: {analysis['stress_level']}

Give brief, empathetic advice (2-3 sentences) about managing finances during stressful periods. Be supportive and practical."""

        try:
            response = requests.post(
                f"{Config.OLLAMA_HOST}/api/chat",
                headers={
                    "Authorization": f"Bearer {Config.OLLAMA_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": Config.OLLAMA_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False
                },
                timeout=30
            )
            
            if response.status_code == 200:
                ai_advice = response.json()['message']['content']
        except Exception as e:
            print(f"⚠️ AI advice generation failed: {e}")
    
    return jsonify({
        'status': 'success',
        'analysis': analysis,
        'ai_advice': ai_advice,
        'user_id': user_id
    })

@app.route('/api/stress-summary', methods=['GET'])
@handle_errors  
def stress_summary():
    """Get quick stress summary"""
    user_id = request.args.get('user_id', 'demo_user')
    
    user = user_service.get_user(user_id)
    analysis = stress_detector.analyze_stress_patterns(user.transactions, 7)
    
    # Quick summary
    summary = {
        'stress_level': analysis['stress_level'],
        'score': analysis['score'],
        'alert': None,
        'top_recommendation': None
    }
    
    if analysis['signals']:
        summary['alert'] = analysis['signals'][0]['message']
    
    if analysis['recommendations']:
        summary['top_recommendation'] = analysis['recommendations'][0]
    
    return jsonify({
        'status': 'success',
        'summary': summary
    })
    
@app.route('/api/debug-transactions', methods=['GET'])
def debug_transactions():
    """Debug: See what transactions exist"""
    user_id = request.args.get('user_id', 'demo_user')
    user = user_service.get_user(user_id)
    
    from datetime import datetime, timedelta
    cutoff = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    
    all_txns = [
        {
            'date': t.date,
            'type': t.type,
            'amount': t.amount,
            'description': t.description,
            'recent': t.date >= cutoff
        }
        for t in user.transactions
    ]
    
    recent_count = sum(1 for t in all_txns if t['recent'] and t['type'] == 'debit')
    
    return jsonify({
        'user_id': user_id,
        'total_transactions': len(all_txns),
        'recent_debits_last_7_days': recent_count,
        'cutoff_date': cutoff,
        'all_transactions': all_txns
    })

@app.route('/api/demo-stress-data', methods=['POST'])
@handle_errors
def load_stress_demo_data():
    """Load demo data that triggers stress signals"""
    user_id = request.json.get('user_id', 'stressed_student')
    
    # IMPORTANT: Clear existing user data first!
    if user_id in user_service.users:
        print(f"⚠️ Clearing existing data for {user_id}")
        del user_service.users[user_id]
    
    # Create fresh user
    user = user_service.create_user(user_id, "Stressed Student")
    
    # Use recent dates
    from datetime import datetime, timedelta
    today = datetime.now()
    
    # Simulate stressful spending pattern
    stress_transactions = [
        # Week 1: Normal
        {'date': (today - timedelta(days=14)).strftime('%Y-%m-%d'), 'type': 'credit', 'amount': 500.0, 'category': 'Allowance', 'description': 'Monthly allowance'},
        {'date': (today - timedelta(days=13)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 15.0, 'category': 'Food', 'description': 'Campus cafeteria'},
        {'date': (today - timedelta(days=11)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 20.0, 'category': 'Books', 'description': 'Textbook'},
        
        # Week 2: Stress builds - late night orders
        {'date': (today - timedelta(days=7)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 25.0, 'category': 'Food', 'description': 'Pizza delivery - late night'},
        {'date': (today - timedelta(days=6)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 18.0, 'category': 'Food', 'description': 'Burger delivery - late night'},
        {'date': (today - timedelta(days=6)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 12.0, 'category': 'Coffee', 'description': 'Coffee - late night study'},
        {'date': (today - timedelta(days=5)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 30.0, 'category': 'Food', 'description': 'Chinese delivery - late night'},
        
        # Week 3: High frequency + spikes
        {'date': (today - timedelta(days=3)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 22.0, 'category': 'Food', 'description': 'Breakfast delivery'},
        {'date': (today - timedelta(days=3)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 28.0, 'category': 'Food', 'description': 'Lunch delivery'},
        {'date': (today - timedelta(days=3)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 35.0, 'category': 'Food', 'description': 'Dinner delivery - late night'},
        {'date': (today - timedelta(days=2)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 15.0, 'category': 'Coffee', 'description': 'Coffee run'},
        {'date': (today - timedelta(days=2)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 40.0, 'category': 'Food', 'description': 'Sushi delivery - late night'},
        {'date': (today - timedelta(days=2)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 8.0, 'category': 'Coffee', 'description': 'Energy drinks'},
        {'date': (today - timedelta(days=1)).strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 32.0, 'category': 'Food', 'description': 'Pizza delivery - late night'},
        
        # Today: Continued stress
        {'date': today.strftime('%Y-%m-%d'), 'type': 'debit', 'amount': 45.0, 'category': 'Food', 'description': 'Grocery delivery - late night'},
    ]
    
    for txn_data in stress_transactions:
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
    
    # Debug output
    from datetime import datetime, timedelta
    cutoff = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    recent_debits = [t for t in user.transactions if t.date >= cutoff and t.type == 'debit']
    
    print(f"✅ Stress demo data loaded for {user_id}!")
    print(f"   Total transactions: {len(user.transactions)}")
    print(f"   Recent debits (last 7 days): {len(recent_debits)}")
    print(f"   Cutoff date: {cutoff}")
    
    return jsonify({
        'status': 'success',
        'message': 'Stress pattern demo data loaded',
        'transactions_count': len(user.transactions),
        'recent_debits_count': len(recent_debits),
        'cutoff_date': cutoff,
        'warning': 'This data simulates high-stress spending patterns'
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
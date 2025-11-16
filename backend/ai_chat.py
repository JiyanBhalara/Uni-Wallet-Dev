#!/usr/bin/env python3
"""
AI Chat Script - Standalone script to be called from .NET API
Handles chat requests with Ollama AI integration
"""
import sys
import json
import requests
from datetime import datetime
from pathlib import Path

# Add parent directory to path to import config and services
sys.path.insert(0, str(Path(__file__).parent))

# Config will be passed via stdin, no need to import
class Config:
    OLLAMA_HOST = "https://ollama.com"
    OLLAMA_API_KEY = ""
    OLLAMA_MODEL = "gpt-oss:20b-cloud"

try:
    from vector_store import get_vector_db
except ImportError:
    def get_vector_db():
        return None


def build_smart_prompt(user_data: dict, user_message: str, transactions: list) -> str:
    """Build AI prompt with context from user data and transactions"""
    
    # Calculate financial summary
    total_spent = sum(t.get('amount', 0) for t in transactions if t.get('type') == 'debit' or t.get('amount', 0) < 0)
    total_income = sum(t.get('amount', 0) for t in transactions if t.get('type') == 'credit' or t.get('amount', 0) > 0)
    balance = total_income - abs(total_spent)
    
    user_name = user_data.get('fullName', user_data.get('name', 'Student'))
    
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
STUDENT: {user_name}

FINANCIAL SUMMARY:
- Total Spent: ${abs(total_spent):.2f}
- Total Income: ${total_income:.2f}
- Balance: ${balance:.2f}

RECENT TRANSACTIONS:
"""
    
    # Add recent transactions (last 10)
    recent_txns = sorted(transactions, key=lambda x: x.get('date', ''), reverse=True)[:10]
    
    if recent_txns:
        for txn in recent_txns:
            date = txn.get('date', 'N/A')
            amount = txn.get('amount', 0)
            merchant = txn.get('merchant', 'Unknown')
            category = txn.get('category', 'Other')
            txn_type = 'credit' if amount > 0 else 'debit'
            
            prompt += f"- {date}: {txn_type} ${abs(amount):.2f} ({category}) - {merchant}\n"
    else:
        prompt += "No transactions yet.\n"
    
    prompt += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    prompt += "Be concise, helpful, and personalized! Use emojis sparingly."
    
    return prompt


def clean_markdown(text: str) -> str:
    """Remove markdown formatting and convert to clean plain text"""
    import re
    
    # Remove bold/italic markers
    text = re.sub(r'\*\*\*(.+?)\*\*\*', r'\1', text)  # ***text***
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)      # **text**
    text = re.sub(r'\*(.+?)\*', r'\1', text)          # *text*
    text = re.sub(r'__(.+?)__', r'\1', text)          # __text__
    text = re.sub(r'_(.+?)_', r'\1', text)            # _text_
    
    # Remove inline code markers
    text = re.sub(r'`([^`]+)`', r'\1', text)          # `code`
    
    # Convert headers to plain text with emphasis
    text = re.sub(r'^#{1,6}\s+(.+?)$', r'\1', text, flags=re.MULTILINE)
    
    # Remove links but keep text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    
    # Clean up list markers
    text = re.sub(r'^\s*[\-\*\+]\s+', '• ', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s+', lambda m: f"{m.group().strip()} ", text, flags=re.MULTILINE)
    
    # Remove horizontal rules
    text = re.sub(r'^[\-\*_]{3,}$', '', text, flags=re.MULTILINE)
    
    # Clean up extra blank lines (max 2 consecutive)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()


def chat_with_ollama(user_data: dict, message: str, transactions: list, ollama_config: dict = None) -> dict:
    """Send chat message to Ollama and get response"""
    
    # Use provided config or defaults
    if ollama_config:
        Config.OLLAMA_HOST = ollama_config.get('host', Config.OLLAMA_HOST)
        Config.OLLAMA_API_KEY = ollama_config.get('apiKey', Config.OLLAMA_API_KEY)
        Config.OLLAMA_MODEL = ollama_config.get('model', Config.OLLAMA_MODEL)
    
    try:
        # Build context-aware prompt
        system_prompt = build_smart_prompt(user_data, message, transactions)
        
        # Prepare messages for Ollama
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ]
        
        # Call Ollama API
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
            error_detail = ""
            try:
                error_detail = response.json()
            except:
                error_detail = response.text
            
            print(f"Ollama API Error: {response.status_code}", file=sys.stderr)
            print(f"Response: {error_detail}", file=sys.stderr)
            print(f"API Key present: {bool(Config.OLLAMA_API_KEY)}", file=sys.stderr)
            print(f"API Key length: {len(Config.OLLAMA_API_KEY) if Config.OLLAMA_API_KEY else 0}", file=sys.stderr)
            
            return {
                "success": False,
                "error": f"Ollama API error: {response.status_code}",
                "response": f"Sorry, I'm having trouble connecting to the AI service (Error {response.status_code}). Please check your API key configuration."
            }
        
        ai_response = response.json()['message']['content']
        
        # Clean markdown formatting from response
        ai_response = clean_markdown(ai_response)
        
        # Try to save to vector DB if available
        try:
            vector_db = get_vector_db()
            if vector_db:
                user_id = str(user_data.get('id', 'unknown'))
                vector_db.save_conversation(user_id, message, ai_response)
        except Exception as e:
            # Don't fail if vector DB save fails
            print(f"Warning: Could not save to vector DB: {e}", file=sys.stderr)
        
        return {
            "success": True,
            "response": ai_response,
            "model": Config.OLLAMA_MODEL,
            "timestamp": datetime.now().isoformat()
        }
        
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": "Request timeout",
            "response": "The request took too long. Please try again."
        }
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": f"Request error: {str(e)}",
            "response": "Sorry, I couldn't connect to the AI service. Please check your internet connection."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "response": "An unexpected error occurred. Please try again later."
        }


def build_financial_plan_prompt(user_data: dict, budgets: list, transactions: list) -> str:
    """Build comprehensive financial plan prompt with detailed analysis"""
    
    user_name = user_data.get('name', 'Student')
    wallet_balance = user_data.get('walletBalance', 0)
    currency = user_data.get('currency', 'USD')
    
    # Calculate spending patterns
    total_spent = sum(t.get('amount', 0) for t in transactions)
    avg_daily_spending = total_spent / 7 if transactions else 0
    
    # Categorize transactions
    categories = {}
    for txn in transactions:
        category = txn.get('category', 'Other')
        categories[category] = categories.get(category, 0) + txn.get('amount', 0)
    
    prompt = f"""You are a Financial Coach for college students. Generate a comprehensive, personalized financial plan for {user_name}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: {user_name}
Current Balance: {currency} {wallet_balance:.2f}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPENDING ANALYSIS (Last 7 Days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Spent: {currency} {total_spent:.2f}
Average Daily Spending: {currency} {avg_daily_spending:.2f}
Number of Transactions: {len(transactions)}

SPENDING BY CATEGORY:
"""
    
    for category, amount in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        percentage = (amount / total_spent * 100) if total_spent > 0 else 0
        prompt += f"- {category}: {currency} {amount:.2f} ({percentage:.1f}%)\n"
    
    prompt += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    prompt += "ACTIVE BUDGETS\n"
    prompt += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    
    if budgets:
        for budget in budgets:
            category = budget.get('category', 'Unknown')
            limit = budget.get('limitAmount', 0)
            period = budget.get('periodType', 'Monthly')
            prompt += f"- {category}: {currency} {limit:.2f} ({period})\n"
    else:
        prompt += "No budgets set yet.\n"
    
    prompt += """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK: Generate a Comprehensive Financial Plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a detailed, student-friendly financial plan with:

1. FINANCIAL HEALTH OVERVIEW
   • Current status assessment
   • Key strengths and concerns
   
2. SPENDING INSIGHTS
   • Spending patterns analysis
   • Areas of overspending
   • Positive spending habits
   
3. PERSONALIZED RECOMMENDATIONS
   • Budget optimization tips
   • Specific actions to save money
   • Category-specific advice
   
4. SMART MONEY TIPS FOR STUDENTS
   • Practical daily money-saving strategies
   • Campus-specific savings opportunities
   • Long-term financial habits
   
5. ACTION PLAN
   • Immediate steps (this week)
   • Short-term goals (this month)
   • Long-term planning tips

CRITICAL FORMATTING RULES:
✓ DO: Use bullet points (•) for lists
✓ DO: Use numbered lists for steps
✓ DO: Use clear section headings with line breaks
✓ DO: Use emojis sparingly for visual interest (💰 💡 📊 ✓)
✓ DO: Keep paragraphs short (2-3 sentences max)
✓ DO: Use specific dollar amounts and percentages

✗ DON'T: Use tables or columns
✗ DON'T: Use markdown formatting (**, *, __, etc.)
✗ DON'T: Use code blocks or technical syntax
✗ DON'T: Create complex nested structures

EXAMPLE FORMAT:

SECTION TITLE

Brief intro paragraph here.

• First point with specific detail
• Second point with numbers like $50 or 20%
• Third point with actionable advice

Next paragraph continues the explanation.

Keep the tone supportive and motivating! Remember, this is for a college student managing finances on a budget.
"""
    
    return prompt


def build_plan_chat_prompt(user_data: dict, message: str, conversation_history: list, transactions: list) -> str:
    """Build prompt for follow-up questions about the financial plan"""
    
    user_name = user_data.get('name', 'Student')
    
    prompt = f"""You are a Financial Coach helping {user_name} with their financial plan.

CONTEXT:
The student has received a personalized financial plan and now has a follow-up question.

CONVERSATION HISTORY:
"""
    
    for msg in conversation_history[-5:]:  # Last 5 messages for context
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        prompt += f"{role.upper()}: {content}\n\n"
    
    prompt += f"""
RECENT TRANSACTIONS FOR REFERENCE:
"""
    
    recent_txns = sorted(transactions, key=lambda x: x.get('date', ''), reverse=True)[:5]
    for txn in recent_txns:
        merchant = txn.get('merchant', 'Unknown')
        amount = txn.get('amount', 0)
        category = txn.get('category', 'Other')
        prompt += f"- {merchant}: ${amount:.2f} ({category})\n"
    
    prompt += """
GUIDELINES:
- Answer questions about the financial plan clearly
- Provide specific, actionable advice
- Reference their actual spending when relevant
- Keep responses concise but helpful
- Be encouraging and supportive
- Stay focused on financial planning topics

STUDENT'S QUESTION: {message}

Provide a helpful, specific response:
"""
    
    return prompt


def generate_financial_plan(user_data: dict, budgets: list, transactions: list, ollama_config: dict = None) -> dict:
    """Generate comprehensive financial plan using Ollama AI"""
    
    # Update Config if provided
    if ollama_config:
        Config.OLLAMA_HOST = ollama_config.get('host', Config.OLLAMA_HOST)
        Config.OLLAMA_API_KEY = ollama_config.get('apiKey', Config.OLLAMA_API_KEY)
        Config.OLLAMA_MODEL = ollama_config.get('model', Config.OLLAMA_MODEL)
    
    try:
        # Build the prompt
        system_prompt = build_financial_plan_prompt(user_data, budgets, transactions)
        
        # Prepare request
        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": "Please generate my personalized financial plan based on my data."
            }
        ]
        
        # Call Ollama API
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
            timeout=120  # 2 minutes for comprehensive plan
        )
        
        if response.status_code != 200:
            error_detail = ""
            try:
                error_detail = response.json()
            except:
                error_detail = response.text
            
            print(f"Ollama API Error: {response.status_code}", file=sys.stderr)
            print(f"Response: {error_detail}", file=sys.stderr)
            
            return {
                "success": False,
                "error": f"Ollama API error: {response.status_code}",
                "response": f"Sorry, I'm having trouble generating your financial plan (Error {response.status_code})."
            }
        
        ai_response = response.json()['message']['content']
        
        # Clean markdown formatting
        ai_response = clean_markdown(ai_response)
        
        return {
            "success": True,
            "response": ai_response,
            "model": Config.OLLAMA_MODEL,
            "timestamp": datetime.now().isoformat()
        }
        
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": "Request timeout",
            "response": "The request took too long. Please try again."
        }
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": f"Request error: {str(e)}",
            "response": "Sorry, I couldn't connect to the AI service."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "response": "An unexpected error occurred."
        }


def chat_about_plan(user_data: dict, message: str, conversation_history: list, transactions: list, ollama_config: dict = None) -> dict:
    """Handle follow-up questions about the financial plan"""
    
    if ollama_config:
        Config.OLLAMA_HOST = ollama_config.get('host', Config.OLLAMA_HOST)
        Config.OLLAMA_API_KEY = ollama_config.get('apiKey', Config.OLLAMA_API_KEY)
        Config.OLLAMA_MODEL = ollama_config.get('model', Config.OLLAMA_MODEL)
    
    try:
        system_prompt = build_plan_chat_prompt(user_data, message, conversation_history, transactions)
        
        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": message
            }
        ]
        
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
            return {
                "success": False,
                "error": f"Ollama API error: {response.status_code}",
                "response": "Sorry, I couldn't process your question."
            }
        
        ai_response = response.json()['message']['content']
        ai_response = clean_markdown(ai_response)
        
        return {
            "success": True,
            "response": ai_response,
            "model": Config.OLLAMA_MODEL,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Error: {str(e)}",
            "response": "Sorry, I couldn't process your question."
        }


def main():
    """Main entry point - reads JSON from stdin, processes, writes JSON to stdout"""
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        
        if not input_data:
            print(json.dumps({
                "success": False,
                "error": "No input data provided"
            }))
            sys.exit(1)
        
        # Parse JSON input
        data = json.loads(input_data)
        
        # Determine action type
        action = data.get('action', 'chat')
        ollama_config = data.get('ollamaConfig', None)
        
        if action == 'generate_plan':
            # Generate financial plan
            user_data = data.get('user', {})
            budgets = data.get('budgets', [])
            transactions = data.get('transactions', [])
            
            result = generate_financial_plan(user_data, budgets, transactions, ollama_config)
            print(json.dumps(result))
            
        elif action == 'chat_about_plan':
            # Chat about financial plan
            user_data = data.get('user', {})
            message = data.get('message', '')
            conversation_history = data.get('conversationHistory', [])
            transactions = data.get('transactions', [])
            
            if not message:
                print(json.dumps({
                    "success": False,
                    "error": "Message is required"
                }))
                sys.exit(1)
            
            result = chat_about_plan(user_data, message, conversation_history, transactions, ollama_config)
            print(json.dumps(result))
            
        else:
            # Regular chat
            user_data = data.get('user', {})
            message = data.get('message', '')
            transactions = data.get('transactions', [])
            
            if not message:
                print(json.dumps({
                    "success": False,
                    "error": "Message is required"
                }))
                sys.exit(1)
            
            result = chat_with_ollama(user_data, message, transactions, ollama_config)
            print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            "success": False,
            "error": f"Invalid JSON input: {str(e)}"
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()

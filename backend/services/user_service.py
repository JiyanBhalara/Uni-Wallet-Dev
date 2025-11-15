from typing import Dict, Optional
from models.schemas import User, Transaction

class UserService:
    """User management service"""
    
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.chat_history: Dict[str, list] = {}
    
    def create_user(self, user_id: str, name: str = "Student") -> User:
        """Create a new user"""
        if user_id not in self.users:
            user = User(
                user_id=user_id,
                name=name,
                student_id=user_id
            )
            self.users[user_id] = user
            self.chat_history[user_id] = []
            print(f"✅ User created: {user_id}")
        
        return self.users[user_id]
    
    def get_user(self, user_id: str) -> User:
        """Get user, create if doesn't exist"""
        if user_id not in self.users:
            return self.create_user(user_id)
        return self.users[user_id]
    
    def add_transaction(self, user_id: str, transaction: Transaction) -> Transaction:
        """Add transaction to user"""
        user = self.get_user(user_id)
        user.transactions.append(transaction)
        
        if transaction.type == 'debit':
            user.total_spent += transaction.amount
        else:
            user.total_income += transaction.amount
        
        return transaction
    
    def get_chat_history(self, user_id: str, limit: int = 4) -> list:
        """Get user's chat history"""
        return self.chat_history.get(user_id, [])[-limit:]
    
    def add_chat_message(self, user_id: str, role: str, content: str):
        """Add message to chat history"""
        if user_id not in self.chat_history:
            self.chat_history[user_id] = []
        
        self.chat_history[user_id].append({
            'role': role,
            'content': content
        })
        
        # Keep only last 20 messages
        if len(self.chat_history[user_id]) > 20:
            self.chat_history[user_id] = self.chat_history[user_id][-20:]
    
    def get_user_count(self) -> int:
        """Get total number of users"""
        return len(self.users)
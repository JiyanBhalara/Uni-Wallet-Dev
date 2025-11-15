from typing import List, Optional
from datetime import datetime
from models.schemas import Transaction
from vector_store import get_vector_db

class TransactionService:
    """Transaction management service"""
    
    def __init__(self):
        self.vector_db = get_vector_db()
    
    def create_transaction(
        self,
        user_id: str,
        transaction_id: int,
        date: str,
        type: str,
        amount: float,
        category: str,
        description: str,
        source: str = 'manual',
        plaid_transaction_id: Optional[str] = None
    ) -> Transaction:
        """Create a new transaction"""
        
        transaction = Transaction(
            id=transaction_id,
            user_id=user_id,
            date=date,
            type=type,
            amount=amount,
            category=category,
            description=description,
            source=source,
            plaid_transaction_id=plaid_transaction_id
        )
        
        # Save to vector DB for semantic search
        self.vector_db.save_transaction(user_id, transaction.to_dict())
        
        print(f"💰 Transaction created: ${amount} - {category}")
        
        return transaction
    
    def find_similar_transactions(
        self,
        user_id: str,
        query: str,
        limit: int = 5
    ) -> List[dict]:
        """Find similar transactions using vector search"""
        return self.vector_db.find_similar_transactions(user_id, query, limit)
    
    def get_demo_transactions(self) -> List[dict]:
        """Get demo transaction data"""
        return [
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
    
    @staticmethod
    def map_plaid_category(plaid_category: List[str]) -> str:
        """Map Plaid category to our categories"""
        if not plaid_category:
            return 'Other'
        
        category_mapping = {
            'Food and Drink': 'Food',
            'Travel': 'Transport',
            'Shops': 'Shopping',
            'Recreation': 'Entertainment',
            'Service': 'Utilities',
            'Payment': 'Transfer',
            'Bank Fees': 'Fees'
        }
        
        main_category = plaid_category[0]
        return category_mapping.get(main_category, main_category)
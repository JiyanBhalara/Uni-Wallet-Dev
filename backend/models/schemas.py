from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional

@dataclass
class Transaction:
    """Transaction data model"""
    id: int
    user_id: str
    date: str
    type: str  # 'debit' or 'credit'
    amount: float
    category: str
    description: str
    source: str = 'manual'  # 'manual' or 'bank'
    plaid_transaction_id: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'type': self.type,
            'amount': self.amount,
            'category': self.category,
            'description': self.description,
            'source': self.source,
            'plaid_transaction_id': self.plaid_transaction_id
        }

@dataclass
class User:
    """User data model"""
    user_id: str
    name: str
    student_id: str
    transactions: List[Transaction] = field(default_factory=list)
    total_spent: float = 0.0
    total_income: float = 0.0
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'name': self.name,
            'student_id': self.student_id,
            'total_spent': self.total_spent,
            'total_income': self.total_income,
            'transactions_count': len(self.transactions),
            'created_at': self.created_at
        }

@dataclass
class BankAccount:
    """Bank account data model"""
    user_id: str
    access_token: str
    item_id: str
    linked_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self):
        return {
            'item_id': self.item_id,
            'linked_at': self.linked_at
        }
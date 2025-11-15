from typing import List, Optional, Dict
from plaid import ApiClient, Configuration, Environment
from plaid.apis import PlaidApi
from plaid.models import LinkTokenCreateRequest, LinkTokenCreateRequestUser, Products, CountryCode, ItemPublicTokenExchangeRequest, TransactionsSyncRequest
from datetime import datetime, timedelta
from config import Config
from models.schemas import BankAccount

class PlaidService:
    """Plaid bank integration service"""
    
    def __init__(self):
        self.client = None
        self.bank_accounts: Dict[str, List[BankAccount]] = {}
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Plaid client"""
        if not Config.PLAID_CLIENT_ID or not Config.PLAID_SECRET:
            print("⚠️  Plaid not configured (bank integration disabled)")
            return
        
        try:
            configuration = Configuration(
                host=Environment.Sandbox if Config.PLAID_ENV == 'sandbox' else Environment.Production,
                api_key={
                    'clientId': Config.PLAID_CLIENT_ID,
                    'secret': Config.PLAID_SECRET,
                }
            )
            api_client = ApiClient(configuration)
            self.client = PlaidApi(api_client)
            print("✅ Plaid initialized")
        except Exception as e:
            print(f"❌ Failed to initialize Plaid: {e}")
            self.client = None
    
    def is_configured(self) -> bool:
        """Check if Plaid is configured"""
        return self.client is not None
    
    def create_link_token(self, user_id: str) -> str:
        """Create Plaid Link token"""
        if not self.client:
            raise ValueError("Plaid not configured")
        
        request_obj = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(client_user_id=user_id),
            client_name="Smart Campus Wallet",
            products=[Products("transactions")],
            country_codes=[CountryCode('US')],
            language='en'
        )
        
        response = self.client.link_token_create(request_obj)
        return response['link_token']
    
    def exchange_public_token(self, user_id: str, public_token: str) -> BankAccount:
        """Exchange public token for access token"""
        if not self.client:
            raise ValueError("Plaid not configured")
        
        request_obj = ItemPublicTokenExchangeRequest(public_token=public_token)
        response = self.client.item_public_token_exchange(request_obj)
        
        bank_account = BankAccount(
            user_id=user_id,
            access_token=response['access_token'],
            item_id=response['item_id']
        )
        
        if user_id not in self.bank_accounts:
            self.bank_accounts[user_id] = []
        
        self.bank_accounts[user_id].append(bank_account)
        
        print(f"✅ Bank linked for user {user_id}")
        
        return bank_account
    
    def sync_transactions(self, user_id: str, days: int = 30) -> List[dict]:
        """Sync transactions from Plaid"""
        if not self.client:
            raise ValueError("Plaid not configured")
        
        if user_id not in self.bank_accounts or not self.bank_accounts[user_id]:
            raise ValueError("No bank account linked")
        
        all_transactions = []
        
        for bank_account in self.bank_accounts[user_id]:
            try:
                request_obj = TransactionsSyncRequest(
                    access_token=bank_account.access_token,
                )
                
                response = self.client.transactions_sync(request_obj)
                transactions = response.get('added', [])
                
                for txn in transactions:
                    all_transactions.append({
                        'date': str(txn['date']),
                        'amount': abs(float(txn['amount'])),
                        'type': 'debit' if txn['amount'] > 0 else 'credit',
                        'description': txn['name'],
                        'category': txn.get('category', ['Other'])[0],
                        'plaid_transaction_id': txn['transaction_id']
                    })
                
            except Exception as e:
                print(f"❌ Error syncing from account {bank_account.item_id}: {e}")
        
        print(f"✅ Synced {len(all_transactions)} transactions")
        
        return all_transactions
    
    def has_linked_bank(self, user_id: str) -> bool:
        """Check if user has linked bank"""
        return user_id in self.bank_accounts and len(self.bank_accounts[user_id]) > 0
    
    def get_linked_accounts_count(self, user_id: str) -> int:
        """Get number of linked accounts"""
        return len(self.bank_accounts.get(user_id, []))
from sentence_transformers import SentenceTransformer
import chromadb
from datetime import datetime

class SimpleVectorDB:
    def __init__(self):
        print("🚀 Starting Vector Database...")
        print("📥 Loading the brain (embedding model)...")
        self.brain = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Brain loaded!")
        
        print("📦 Creating storage box...")
        self.storage = chromadb.Client()
        self.conversations_shelf = self.storage.create_collection("conversations")
        self.transactions_shelf = self.storage.create_collection("transactions")
        print("✅ Storage ready!")
    
    def text_to_numbers(self, text):
        """Convert text into embeddings"""
        return self.brain.encode(text).tolist()
    
    def save_conversation(self, user_id, user_message, ai_response):
        """Save conversation to vector database"""
        full_chat = f"User asked: {user_message}\nAI said: {ai_response}"
        numbers = self.text_to_numbers(full_chat)
        chat_id = f"{user_id}_{datetime.now().timestamp()}"
        
        self.conversations_shelf.add(
            embeddings=[numbers],
            documents=[full_chat],
            metadatas=[{
                "user_id": user_id,
                "user_message": user_message,
                "ai_response": ai_response,
                "time": datetime.now().isoformat()
            }],
            ids=[chat_id]
        )
        print(f"💾 Saved conversation to vector DB!")
    
    def find_similar_chats(self, user_id, current_question, how_many=3):
        """Find similar past conversations"""
        question_numbers = self.text_to_numbers(current_question)
        
        results = self.conversations_shelf.query(
            query_embeddings=[question_numbers],
            n_results=how_many,
            where={"user_id": user_id}
        )
        
        if results['documents'] and results['documents'][0]:
            return results['documents'][0]
        return []
    
    def save_transaction(self, user_id, transaction):
        """Save transaction to vector database"""
        description = f"{transaction['category']} expense of ${transaction['amount']}: {transaction['description']}"
        numbers = self.text_to_numbers(description)
        txn_id = f"{user_id}_txn_{transaction['id']}"
        
        self.transactions_shelf.add(
            embeddings=[numbers],
            documents=[description],
            metadatas=[{
                "user_id": user_id,
                "category": transaction['category'],
                "amount": transaction['amount'],
                "type": transaction['type'],
                "date": transaction['date'],
                "description": transaction['description']
            }],
            ids=[txn_id]
        )
        print(f"💰 Saved transaction to vector DB!")
    
    def find_similar_transactions(self, user_id, search_query, how_many=5):
        """Find transactions similar to search query"""
        search_numbers = self.text_to_numbers(search_query)
        
        results = self.transactions_shelf.query(
            query_embeddings=[search_numbers],
            n_results=how_many,
            where={"user_id": user_id}
        )
        
        if results['metadatas'] and results['metadatas'][0]:
            return results['metadatas'][0]
        return []

vector_db = None

def get_vector_db():
    """Get or create the vector database singleton"""
    global vector_db
    if vector_db is None:
        vector_db = SimpleVectorDB()
    return vector_db
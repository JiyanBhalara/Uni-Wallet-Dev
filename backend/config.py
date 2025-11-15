import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

class Config:
    """Application configuration"""
    
    # Flask
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # Ollama Cloud
    OLLAMA_HOST = "https://ollama.com"
    OLLAMA_API_KEY = os.getenv('OLLAMA_API_KEY')
    OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'gpt-oss:20b-cloud')
    
    # Plaid
    PLAID_CLIENT_ID = os.getenv('PLAID_CLIENT_ID')
    PLAID_SECRET = os.getenv('PLAID_SECRET')
    PLAID_ENV = os.getenv('PLAID_ENV', 'sandbox')
    
    @classmethod
    def validate(cls):
        """Validate required configuration"""
        if not cls.OLLAMA_API_KEY:
            raise ValueError("OLLAMA_API_KEY is required")
        
        if cls.OLLAMA_API_KEY:
            cls.OLLAMA_API_KEY = cls.OLLAMA_API_KEY.strip().strip('"').strip("'")
        
        return True

Config.validate()
from flask import jsonify
from functools import wraps
import traceback

def handle_errors(f):
    """Decorator for error handling"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            print(f"❌ Validation Error: {e}")
            return jsonify({
                'status': 'error',
                'error': str(e),
                'type': 'validation_error'
            }), 400
        except Exception as e:
            print(f"❌ Server Error: {e}")
            traceback.print_exc()
            return jsonify({
                'status': 'error',
                'error': str(e),
                'type': 'server_error'
            }), 500
    
    return decorated_function
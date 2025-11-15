"""
Test Plaid Integration - Backend Only
No HTML needed!
"""

import requests
import webbrowser
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading

API_URL = "http://localhost:5000/api"
USER_ID = "plaid_test_user"

def test_plaid_flow():
    print("="*60)
    print("🏦 PLAID INTEGRATION TEST (BACKEND ONLY)")
    print("="*60)
    
    # Step 1: Check if Plaid is configured
    print("\n1. Checking Plaid configuration...")
    response = requests.get(f"{API_URL}/bank/status?user_id={USER_ID}")
    status = response.json()
    
    if not status.get('plaid_enabled'):
        print("❌ Plaid not configured!")
        print("   Add PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV to .env")
        return
    
    print(f"✅ Plaid enabled: {status['plaid_enabled']}")
    
    # Step 2: Create link token
    print("\n2. Creating link token...")
    response = requests.post(
        f"{API_URL}/bank/create-link-token",
        json={"user_id": USER_ID}
    )
    data = response.json()
    
    if 'link_token' not in data:
        print(f"❌ Failed to create link token: {data}")
        return
    
    link_token = data['link_token']
    print(f"✅ Link token created: {link_token[:20]}...")
    
    # Step 3: Generate Plaid Link URL and open in browser
    print("\n3. Opening Plaid Link in browser...")
    print("   You'll need to:")
    print("   - Select 'First Platypus Bank'")
    print("   - Username: user_good")
    print("   - Password: pass_good")
    print("   - Select an account")
    print("   - Copy the public_token from the URL or console")
    
    # Create a minimal HTML file temporarily
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Plaid Test</title>
        <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
    </head>
    <body>
        <h1>Plaid Link Test</h1>
        <h2>Instructions:</h2>
        <ol>
            <li>Click the button below</li>
            <li>Select "First Platypus Bank"</li>
            <li>Login: user_good / pass_good</li>
            <li>Select any account</li>
            <li>Copy the public_token that appears below</li>
        </ol>
        <button id="btn" onclick="handler.open()">Connect Bank</button>
        <div id="result"></div>
        <script>
            var handler = Plaid.create({{
                token: '{link_token}',
                onSuccess: function(public_token, metadata) {{
                    document.getElementById('result').innerHTML = 
                        '<h2>SUCCESS!</h2>' +
                        '<p>Copy this public_token:</p>' +
                        '<textarea style="width:100%;height:100px">' + public_token + '</textarea>' +
                        '<p>Institution: ' + metadata.institution.name + '</p>';
                }}
            }});
        </script>
    </body>
    </html>
    """
    
    # Write temporary HTML file
    with open('temp_plaid_test.html', 'w') as f:
        f.write(html_content)
    
    # Open in browser
    webbrowser.open('http://localhost:8888/temp_plaid_test.html')
    
    # Start a simple HTTP server
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass
    
    server = HTTPServer(('localhost', 8888), QuietHandler)
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    
    # Wait for user to complete Plaid Link
    print("\n⏳ Waiting for you to complete Plaid Link in browser...")
    public_token = input("\n📋 Paste the public_token here: ").strip()
    
    server.shutdown()
    
    if not public_token:
        print("❌ No token provided")
        return
    
    # Step 4: Exchange public token
    print("\n4. Exchanging public token for access token...")
    response = requests.post(
        f"{API_URL}/bank/exchange-token",
        json={
            "user_id": USER_ID,
            "public_token": public_token
        }
    )
    result = response.json()
    
    if result.get('status') != 'success':
        print(f"❌ Token exchange failed: {result}")
        return
    
    print(f"✅ Token exchanged successfully!")
    print(f"   Account: {result.get('account', {})}")
    
    # Step 5: Sync transactions
    print("\n5. Syncing transactions from bank...")
    response = requests.post(
        f"{API_URL}/bank/sync-transactions",
        json={"user_id": USER_ID}
    )
    result = response.json()
    
    if result.get('status') != 'success':
        print(f"❌ Sync failed: {result}")
        return
    
    print(f"✅ Transactions synced!")
    print(f"   Synced: {result['transactions_synced']} transactions")
    print(f"   Total spent: ${result['new_total_spent']:.2f}")
    print(f"   Total income: ${result['new_total_income']:.2f}")
    
    # Step 6: View transactions
    print("\n6. Fetching all transactions...")
    response = requests.get(f"{API_URL}/transactions?user_id={USER_ID}")
    data = response.json()
    
    print(f"\n📋 Transactions ({len(data['transactions'])}):")
    print("-" * 60)
    for txn in data['transactions'][:10]:  # Show first 10
        print(f"{txn['date']} | ${txn['amount']:>8.2f} | {txn['description'][:30]}")
    
    print("\n" + "="*60)
    print("✅ PLAID TEST COMPLETE!")
    print("="*60)

if __name__ == "__main__":
    test_plaid_flow()
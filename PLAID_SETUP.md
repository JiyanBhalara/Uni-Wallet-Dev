# Plaid Sandbox Integration Setup Guide

## Overview
This integration allows users to link their bank accounts using Plaid's sandbox environment. Linked accounts automatically create wallet entries and can be used for transactions throughout the app.

## Key Features
- **Wallet Integration**: Each linked bank account creates a BankLinked wallet entry
- **Real-time Balances**: Account balances sync from Plaid and display in the dashboard
- **Transaction Sync**: Import transactions from linked accounts
- **Seamless UX**: Bank linking button integrated into the dashboard
- **Unified View**: Bank accounts appear alongside campus wallets

## Prerequisites
1. Plaid account (sandbox environment)
2. .NET 8.0 SDK
3. Node.js 18+ and npm
4. MySQL database

## Backend Setup

### 1. Sign Up for Plaid
1. Go to https://dashboard.plaid.com/signup
2. Create an account (free for development)
3. Navigate to Dashboard → Team Settings → Keys
4. Copy your:
   - Client ID
   - Sandbox Secret

### 2. Update Configuration
Edit `backend/api/appsettings.json`:
```json
{
  "Plaid": {
    "ClientId": "YOUR_PLAID_CLIENT_ID_HERE",
    "Secret": "YOUR_PLAID_SANDBOX_SECRET_HERE",
    "Environment": "sandbox"
  }
}
```

### 3. Run Database Migration
```bash
cd backend/api
dotnet ef database update
```

This will create the `LinkedAccounts` table and add Plaid fields to `Transactions`.

### 4. Restart Backend
```bash
dotnet run
```

## Frontend Setup

### 1. Install react-plaid-link
```bash
cd frontend/web
npm install react-plaid-link
```

### 2. Start Frontend
```bash
npm run dev
```

## Testing with Plaid Sandbox

### Test Bank Credentials
When linking a bank account in sandbox mode, use these credentials:

**For successful connection:**
- Username: `user_good`
- Password: `pass_good`

**Other test scenarios:**
- Account locked: `user_locked` / `pass_locked`
- Invalid credentials: `user_bad` / `pass_bad`

### Test Banks Available
- Chase
- Bank of America
- Wells Fargo
- Citi
- US Bank
- And many more...

## User Flow

### 1. Link Bank Account
1. Navigate to Dashboard
2. In the "Other Wallets" section, click "Link Bank Account" button
3. Plaid Link modal opens
4. Select a bank (e.g., "Chase")
5. Enter test credentials: `user_good` / `pass_good`
6. Select accounts to link
7. Confirm

### 2. View Linked Accounts
- Linked bank accounts appear as wallets in the dashboard
- Each account shows:
  - Institution name and account type
  - Last 4 digits (mask)
  - Current balance from Plaid
  - Wallet type: "Linked Bank"

### 3. Sync Transactions
- Use the sync button on linked accounts page
- Transactions from the last 30 days are imported
- Balances are refreshed from Plaid

### 4. Use for Transactions
- Bank-linked wallets can be used like any other wallet
- Transactions are tracked in the linked wallet
- View all activity in the Activity page

## API Endpoints

### POST /api/plaid/create-link-token
Creates a link token for Plaid Link initialization.
```json
{
  "userId": 1
}
```

### POST /api/plaid/exchange-token
Exchanges public token for access token and saves account.
```json
{
  "userId": 1,
  "publicToken": "public-sandbox-xxx"
}
```

### GET /api/plaid/accounts/{userId}
Gets all linked accounts for a user.

### POST /api/plaid/sync/{linkedAccountId}
Syncs transactions from Plaid for a specific account.

### DELETE /api/plaid/unlink/{linkedAccountId}
Unlinks a bank account (soft delete).

## Database Schema

### LinkedAccounts Table
- `Id` (int, PK): Primary key
- `UserId` (int, FK): User who linked the account
- `AccessToken` (string): Encrypted Plaid access token
- `ItemId` (string): Plaid item identifier
- `InstitutionId` (string): Bank institution ID
- `InstitutionName` (string): Bank name (e.g., "Chase")
- `AccountId` (string): Plaid account identifier
- `AccountName` (string): Account nickname
- `AccountType` (string): checking, savings, credit
- `AccountMask` (string): Last 4 digits
- `LinkedAt` (DateTime): When account was linked
- `LastSyncedAt` (DateTime?): Last transaction sync time
- `IsActive` (bool): Account active status
- `WalletId` (int?, FK): **NEW** - Reference to the wallet entry

### Wallets Table (Updated)
- Added `WalletType.BankLinked = 3` enum value
- Bank-linked wallets are automatically created when accounts are linked
- Display name format: "{InstitutionName} {AccountType} ••{Mask}"
- Balance synced from Plaid on link and sync operations

### Transactions Table (Updated)
- Added `PlaidTransactionId` (string?): Plaid transaction ID
- Added `LinkedAccountId` (int?, FK): Reference to linked account
- Transactions from Plaid use the bank-linked wallet's ID

## Features

### Automatic Wallet Creation
- Each linked bank account creates a BankLinked wallet entry
- Wallet displays in dashboard alongside campus wallets
- Initial balance pulled from Plaid API
- Can be used for all wallet operations

### Balance Synchronization
- Balance refreshed when syncing transactions
- Real-time balance display in dashboard
- Uses Plaid's `/accounts/get` endpoint

### Transaction Import
- Syncs transactions from Plaid on demand
- Avoids duplicates using `PlaidTransactionId`
- Maps Plaid categories to app categories
- Transactions linked to the correct bank wallet

### Manual Transactions Still Work
- Users can still add transactions manually
- Manual transactions have no `PlaidTransactionId`
- Both types show in Activity page

### Account Management
- View all linked accounts in dedicated page (optional)
- Link multiple bank accounts
- Unlink accounts (soft delete)
- Each account has its own wallet entry

## Troubleshooting

### "Failed to create link token"
- Check your Plaid Client ID and Secret in appsettings.json
- Ensure backend is running on port 5000
- Check backend logs for detailed errors

### "Failed to link account"
- Make sure database migration ran successfully
- Check that user exists in database
- Verify frontend can reach backend API

### No transactions synced
- Sandbox accounts have limited test data
- Try syncing multiple times
- Check backend logs for Plaid API errors

### CORS errors
- Ensure frontend is running on localhost:3000
- Check CORS configuration in Program.cs

## Next Steps

### Moving to Production
1. Upgrade Plaid account to production
2. Get production credentials
3. Update `appsettings.json` environment to "production"
4. Implement proper token encryption
5. Add webhook endpoints for real-time updates
6. Implement automatic transaction sync schedule

### Security Considerations
- Encrypt `AccessToken` at rest (consider using Data Protection API)
- Use HTTPS in production
- Implement rate limiting
- Add audit logging
- Follow Plaid security best practices

## Resources
- [Plaid Documentation](https://plaid.com/docs/)
- [Plaid Quickstart](https://plaid.com/docs/quickstart/)
- [Sandbox Testing Guide](https://plaid.com/docs/sandbox/)
- [react-plaid-link](https://github.com/plaid/react-plaid-link)

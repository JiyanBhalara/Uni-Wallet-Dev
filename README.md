# 🏦 UniWallet – Smart Campus Wallet  
**Smarter Wallet, Smarter You**

UniWallet is an **AI-powered campus wallet** that lets students manage **all** their finances in one place – bank accounts (via Plaid), campus wallets, meal plans, dining dollars, events, and rewards – with an integrated AI financial coach powered by **Ollama GPT-OSS (20B)**.

Built in 48 hours for **HackFest 2025 @ Rutgers Newark**.

---

## ✨ Key Features

- **Unified Wallets**
  - Campus, Meal Plan, Dining Dollars, Bank-linked wallets
  - Real-time balances and recent activity

- **Smart Transactions**
  - Categorized spending (Dining, Transport, Books, Events, etc.)
  - Transaction history per wallet
  - NanoID-based transaction IDs for safe sharing

- **Budgets & Alerts**
  - Per-category budgets (weekly/monthly)
  - 80% + 100% over-budget alerts
  - Visual overview of where money is going

- **AI Financial Coach (FinBot)**
  - Chatbot powered by **Ollama GPT-OSS:20B**
  - Uses user profile + transaction data for:
    - Budget suggestions
    - Spending explanations
    - Savings ideas and coaching

- **Plaid Bank Linking (Sandbox)**
  - Link real bank accounts in sandbox mode
  - Sync balances and transactions into UniWallet
  - Bank-linked wallets appear alongside campus wallets  
  - Details in `PLAID_SETUP.md`

- **Campus Life & Rewards**
  - Campus events & registrations
  - Rewards for attending events and using the wallet
  - Redeem points for cashback into wallets

> Goal: replace 5+ apps (bank app, meal portal, budgeting app, Splitwise-type tracking, event payment)  
> with **one smart wallet that actually thinks with you.**

---

## 🏗️ Architecture

```mermaid
flowchart LR
  Browser["Next.js Web App (frontend/web)"] <--> API[".NET 8 Web API (backend/api)"]
  API <--> DB["MySQL Database"]

  API --> AIService["AIChatService (C#)"]
  AIService --> Py["ai_chat.py (Python)"]
  Py --> Ollama["Ollama Cloud\nGPT-OSS:20b-cloud"]

  API <--> Plaid["Plaid Sandbox API"]
````

---

## 🧰 Tech Stack

**Frontend**

* Next.js 16 (App Router, TypeScript)
* React 19
* Tailwind CSS 4
* NextAuth (credentials auth)
* Recharts, Lucide Icons
* `react-plaid-link` for Plaid

**Backend**

* .NET 8 Web API (`backend/api`)
* Entity Framework Core (code-first)
* MySQL (via `DefaultConnection`)

**AI**

* C# `AIChatService` running a Python script:

  * `backend/ai_chat.py`
  * Calls **Ollama Cloud** with `gpt-oss:20b-cloud`
* Uses user + transaction context for better financial reasoning

**Integration**

* Plaid Sandbox for bank linking
* Custom controllers:

  * `WalletsController`, `TransactionsController`, `BudgetsController`
  * `ChatController`, `EventsController`, `RewardsController`, `PaymentMethodsController`, `PlaidController`

---

## 📁 Project Structure

```text
Uni-Wallet-Dev/
├─ backend/
│  ├─ ai_chat.py                 # Python AI chat script (Ollama)
│  └─ api/                       # .NET 8 Web API
│     ├─ Controllers/            # REST endpoints
│     ├─ Data/                   # AppDbContext, seeding
│     ├─ Models/                 # Wallet, Transaction, Budget, User, Event, Rewards, etc.
│     ├─ Migrations/             # EF Core migrations
│     ├─ Services/               # AIChatService, PlaidService, Email services
│     ├─ appsettings.json        # Local dev config (do NOT commit secrets in real projects)
│     └─ SmartCampusWallet.Api.csproj
├─ frontend/
│  └─ web/
│     ├─ src/app/                # Next.js routes (dashboard, wallets, activity, budgeting, events, rewards, coach)
│     ├─ src/components/         # UI components (AIChat, WalletActions, etc.)
│     ├─ src/lib/                # API client, chat service, utilities
│     ├─ src/types/              # TS types (budget, event, payment-method, etc.)
│     └─ package.json
├─ PLAID_SETUP.md                # Plaid sandbox setup
├─ Smart-Campus-Wallet.sln       # Solution file
└─ README.md                     # You are here
```

---

## 🚀 Getting Started (Local Dev)

### 1️⃣ Clone & Branch

```bash
git clone https://github.com/JiyanBhalara/Uni-Wallet-Dev.git
cd Uni-Wallet-Dev

# Make sure you're on the backend branch
git checkout backend
```

---

### 2️⃣ Backend API (.NET 8 + MySQL)

#### Prereqs

* .NET 8 SDK
* MySQL running locally (or update connection string)

#### Configure connection string & secrets

> ⚠️ For real deployments, **do NOT** hard-code secrets in `appsettings.json`.
> Use environment variables or user-secrets.

Update `backend/api/appsettings.json` for:

* `ConnectionStrings:DefaultConnection`
* `Email` settings (if you use email)
* `Plaid` settings (can be overridden via env vars)

#### Apply migrations & run

```bash
cd backend/api

# Restore dependencies
dotnet restore

# Apply EF Core migrations (creates DB)
dotnet ef database update

# Run API (defaults to http://localhost:5000 or 5211)
dotnet run
```

---

### 3️⃣ Frontend (Next.js 16)

#### Prereqs

* Node.js 18+
* npm or yarn

#### Setup & run

```bash
cd frontend/web

# Install dependencies
npm install

# Configure environment
# create .env.local with:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Dev server (http://localhost:8080)
npm run dev
```

Now open: **[http://localhost:8080](http://localhost:8080)**

Log in using the credentials flow and you’ll land on the dashboard.

---

### 4️⃣ AI Chat (Ollama Cloud)

The C# backend calls `ai_chat.py`, which calls Ollama Cloud.

Required environment variables (for the API process):

```bash
export OLLAMA_HOST="https://api.ollama.com"       # or your Ollama endpoint
export OLLAMA_API_KEY="YOUR_OLLAMA_API_KEY"
export OLLAMA_MODEL="gpt-oss:20b-cloud"          # default used in code
```

These are read in `AIChatService` and passed to `ai_chat.py`.

When you open the **Financial Coach** page or the floating chat in the UI,
messages go to `/api/chat`, which triggers the Python script and returns AI responses.

---

### 5️⃣ Plaid Sandbox (Optional but Cool)

To enable live bank-like accounts:

1. Create a **Plaid** sandbox account.
2. Configure Plaid keys in configuration (or env vars – see `Plaid` section in `appsettings.json`).
3. Follow the step-by-step guide in **`PLAID_SETUP.md`**.
4. Use the Plaid Link button in the dashboard to link a test bank.

This will:

* Create **BankLinked** wallets
* Sync balances & transactions into the app

---

## 🧪 Quick Demo Flow

1. **Sign up / log in** from the web UI.
2. **Create wallets** for campus, meal plan, or link a bank (Plaid).
3. **Add transactions** manually or via synced accounts.
4. **Set budgets** per category (Dining, Books, Events, etc.).
5. Open **FinBot / Financial Coach**:

   * Ask: *“How am I doing on my dining budget this month?”*
   * Ask: *“How can I save $100 before semester ends?”*
6. Explore **Events & Rewards** – attend events, earn points, and redeem into wallets.

---

## 👥 Team

* **Project Manager**
* **2× AI/ML / Backend Engineers** – AIChat integration, budgeting logic, Ollama config
* **2× Full-Stack Developers** – Next.js app, .NET API, Plaid, UX

---

## 📝 Notes

* This repo is a **hackathon project** – the focus is on end-to-end functionality and showcasing the concept.
* Before using in production, you should:

  * Move secrets to environment variables
  * Harden authentication & authorization
  * Add proper logging, monitoring, and tests


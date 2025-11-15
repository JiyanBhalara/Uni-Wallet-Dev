// src/app/page.tsx
import { api } from "@/lib/api";

interface User {
  id: number;
  fullName: string;
  email: string;
  universityName: string;
  semester: string;
}

interface Wallet {
  id: number;
  userId: number;
  type: number;           // EF enum comes as number (0=Campus, 1=MealPlan, etc.)
  displayName: string;
  balance: number;
  currency: string;
  isPrimary: boolean;
}

interface Transaction {
  id: number;
  userId: number;
  walletId: number;
  amount: number;
  currency: string;
  timestamp: string;      // JSON → string
  description: string;
  category: string;
  isOnCampus: boolean;
}

interface EventItem {
  id: number;
  title: string;
  startsAt: string;
  location: string;
  price: number;
  currency: string;
}

export default async function Home() {
  const [me, wallets, transactions, events] = await Promise.all([
    api.getMe() as Promise<User>,
    api.getWallets() as Promise<Wallet[]>,
    api.getTransactions() as Promise<Transaction[]>,
    api.getEvents() as Promise<EventItem[]>,
  ]);

  return (
    <main className="p-6 space-y-6">
      <div className="text-xl font-bold">Hello, {me.fullName}</div>

      <section>
        <h2 className="text-lg font-semibold mb-2">Wallets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="border rounded-xl p-4 bg-slate-900 text-white"
            >
              <p className="text-sm opacity-70">{w.type}</p>
              <h3 className="text-lg font-bold">{w.displayName}</h3>
              <p className="text-xl mt-2">
                {w.balance} {w.currency}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Recent Transactions</h2>
        <ul className="space-y-2">
          {transactions.slice(0, 5).map((t) => (
            <li key={t.id} className="border p-3 rounded-xl bg-white">
              <div className="font-semibold">{t.description}</div>
              <div className="text-sm text-gray-600">
                {t.category} · {t.timestamp.split("T")[0]}
              </div>
              <div
                className={`font-bold ${
                  t.amount < 0 ? "text-red-500" : "text-green-500"
                }`}
              >
                {t.amount}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Upcoming Events</h2>
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="border p-3 rounded-xl bg-white">
              <div className="font-semibold">{e.title}</div>
              <div className="text-sm text-gray-600">
                {new Date(e.startsAt).toLocaleDateString()} — {e.location}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

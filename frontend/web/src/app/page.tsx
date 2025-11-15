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
  type: number;
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
  timestamp: string;
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

  const primaryWallet = wallets.find((w) => w.isPrimary) ?? wallets[0];

  return (
    <main className="min-h-screen bg-[var(--sc-cream)] flex justify-center px-4 py-6 md:py-10">
      <div className="w-full max-w-5xl space-y-8">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--sc-green-dark)]">
              Smart Campus Wallet
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold text-[var(--sc-green-dark)]">
              Hello, {me.fullName.split(" ")[0]}
            </h1>
            <p className="text-xs text-[var(--sc-green)]">
              {me.universityName} · {me.semester}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-xs font-medium text-[var(--sc-green-dark)]">
                Student
              </p>
              <p className="text-[0.7rem] text-[var(--sc-green)]">
                {me.email}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] flex items-center justify-center text-sm font-semibold shadow-md">
              {me.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          </div>
        </header>

        {/* Wallet cards row */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          {/* Primary big card – Apple Wallet style */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--sc-green-dark)] to-[var(--sc-green)] text-[var(--sc-cream)] p-5 md:p-6 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[rgba(254,250,224,0.7)]">
                  Campus Wallet
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  {primaryWallet.displayName}
                </h2>
              </div>
              <span className="rounded-full bg-[rgba(254,250,224,0.18)] px-3 py-1 text-[0.7rem]">
                Tap &amp; Pay Ready
              </span>
            </div>

            <div className="mt-8 flex justify-between items-end">
              <div>
                <p className="text-[0.65rem] uppercase tracking-wide text-[rgba(254,250,224,0.7)]">
                  Available balance
                </p>
                <p className="mt-1 text-3xl md:text-4xl font-semibold">
                  {primaryWallet.currency}{" "}
                  {primaryWallet.balance.toFixed(2)}
                </p>
              </div>
              <div className="text-right text-[0.65rem] text-[rgba(254,250,224,0.7)]">
                <p>Last updated just now</p>
                <p>On-campus &amp; off-campus spend</p>
              </div>
            </div>

            {/* subtle pill at bottom like Apple Wallet */}
            <div className="mt-6 flex gap-2 text-[0.7rem]">
              <span className="rounded-full bg-[rgba(254,250,224,0.16)] px-3 py-1">
                Campus card • Default
              </span>
              <span className="rounded-full bg-[rgba(254,250,224,0.12)] px-3 py-1">
                Smart budget active
              </span>
            </div>
          </div>

          {/* Side stack of smaller cards */}
          <div className="space-y-3">
            {wallets
              .filter((w) => w.id !== primaryWallet.id)
              .map((w) => (
                <div
                  key={w.id}
                  className="rounded-3xl bg-white shadow-md border border-[rgba(40,54,24,0.08)] px-4 py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--sc-green)]">
                      {walletTypeLabel(w.type)}
                    </p>
                    <p className="text-sm font-semibold text-[var(--sc-green-dark)]">
                      {w.displayName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.65rem] text-[var(--sc-green)]">
                      Balance
                    </p>
                    <p className="text-base font-semibold text-[var(--sc-gold-dark)]">
                      {w.currency === "SWIPES"
                        ? `${w.balance} swipes`
                        : `${w.currency} ${w.balance.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Lower grid: transactions + events */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
          {/* Transactions */}
          <div className="rounded-3xl bg-white shadow-md border border-[rgba(40,54,24,0.08)] p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--sc-green-dark)]">
                Recent activity
              </h3>
              <span className="text-[0.7rem] text-[var(--sc-green)]">
                Last {Math.min(5, transactions.length)} transactions
              </span>
            </div>
            <ul className="divide-y divide-[rgba(40,54,24,0.06)]">
              {transactions.slice(0, 5).map((t) => (
                <li key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--sc-green-dark)]">
                      {t.description}
                    </p>
                    <p className="text-[0.7rem] text-[var(--sc-green)]">
                      {t.category} · {t.isOnCampus ? "On-campus" : "Off-campus"} ·{" "}
                      {t.timestamp.split("T")[0]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        t.amount < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {t.amount < 0 ? "-" : "+"}
                      {t.currency} {Math.abs(t.amount).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Events */}
          <div className="rounded-3xl bg-gradient-to-b from-[var(--sc-gold)] to-[var(--sc-gold-dark)] text-[var(--sc-cream)] p-4 md:p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Upcoming campus events</h3>
              <span className="text-[0.7rem] opacity-80">
                {events.length} scheduled
              </span>
            </div>
            <ul className="space-y-2.5">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="rounded-2xl bg-[rgba(254,250,224,0.12)] px-3 py-2.5 flex justify-between items-start"
                >
                  <div>
                    <p className="text-sm font-semibold">{e.title}</p>
                    <p className="text-[0.7rem] opacity-85">
                      {new Date(e.startsAt).toLocaleDateString()} • {e.location}
                    </p>
                  </div>
                  <p className="text-[0.75rem] font-semibold">
                    {e.price === 0 ? "Free" : `${e.currency} ${e.price.toFixed(2)}`}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.7rem] opacity-85">
              Pay for events directly with your Campus Wallet — no extra forms, no cash.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function walletTypeLabel(type: number): string {
  switch (type) {
    case 0:
      return "Campus Wallet";
    case 1:
      return "Meal Plan";
    case 2:
      return "Dining Dollars";
    case 3:
      return "Linked Bank";
    default:
      return "Wallet";
  }
}

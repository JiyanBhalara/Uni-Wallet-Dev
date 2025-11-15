// app/page.tsx
import { api } from "@/lib/api";
import { PaymentMethod } from "@/types/payment-method";
import WalletActions from "@/components/WalletActions";
import {
  Wallet as WalletIcon,
  TrendingUp,
  Calendar,
  CreditCard,
  MapPin,
  Clock,
  Utensils,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

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
  const [me, wallets, transactions, events, paymentMethods] = await Promise.all([
    api.getMe() as Promise<User>,
    api.getWallets() as Promise<Wallet[]>,
    api.getTransactions() as Promise<Transaction[]>,
    api.getEvents() as Promise<EventItem[]>,
    api.getPaymentMethods() as Promise<PaymentMethod[]>,
  ]);

  const primaryWallet = wallets.find((w) => w.isPrimary) ?? wallets[0];
  const mealPlanWallet = wallets.find((w) => w.type === 1);

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const latestTransaction = sortedTransactions[0];
  const totalPaymentMethods = paymentMethods.length;

  const otherWallets = wallets.filter(
    (w) =>
      w.id !== primaryWallet.id &&
      (!mealPlanWallet || w.id !== mealPlanWallet.id)
  );

  return (
    <main className="min-h-screen bg-[var(--sc-cream)] flex justify-center px-3 sm:px-4 py-4 sm:py-6 md:py-10">
      <div className="w-full max-w-5xl space-y-6 sm:space-y-8">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <WalletIcon className="w-4 h-4 text-[var(--sc-green-dark)]" />
              <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.2em] text-[var(--sc-green-dark)] font-medium">
                Smart Campus Wallet
              </p>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--sc-green-dark)] truncate">
              Hello, {me.fullName.split(" ")[0]}
            </h1>
            <p className="text-[0.65rem] sm:text-xs text-[var(--sc-green)] truncate flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {me.universityName} · {me.semester}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="hidden text-right md:block">
              <p className="text-xs font-medium text-[var(--sc-green-dark)]">
                Student
              </p>
              <p className="text-[0.7rem] text-[var(--sc-green)]">
                {me.email}
              </p>
            </div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-[var(--sc-green-dark)] to-[var(--sc-green)] text-[var(--sc-cream)] flex items-center justify-center text-xs sm:text-sm font-semibold shadow-lg flex-shrink-0 ring-2 ring-[var(--sc-green-dark)]/20">
              {me.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          </div>
        </header>

        {/* Wallet cards row */}
        <section className="grid gap-3 sm:gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          {/* Primary big card */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[var(--sc-green-dark)] to-[var(--sc-green)] text-[var(--sc-cream)] p-4 sm:p-5 md:p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            {/* Decorative background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(254,250,224,0.05)] rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[rgba(254,250,224,0.03)] rounded-full blur-2xl -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[0.6rem] sm:text-[0.65rem] uppercase tracking-[0.2em] text-[rgba(254,250,224,0.7)] font-medium">
                    Campus Wallet
                  </p>
                  <h2 className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold truncate">
                    {primaryWallet.displayName}
                  </h2>
                </div>
                <span className="rounded-full bg-[rgba(254,250,224,0.18)] backdrop-blur-sm px-2 sm:px-3 py-1 text-[0.65rem] sm:text-[0.7rem] whitespace-nowrap flex items-center gap-1.5 border border-[rgba(254,250,224,0.2)]">
                  <Sparkles className="w-3 h-3" />
                  Tap &amp; Pay Ready
                </span>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between sm:items-end gap-3 sm:gap-0">
                <div>
                  <p className="text-[0.6rem] sm:text-[0.65rem] uppercase tracking-wide text-[rgba(254,250,224,0.7)] font-medium">
                    Available balance
                  </p>
                  <p className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold">
                    {primaryWallet.currency} {primaryWallet.balance.toFixed(2)}
                  </p>
                </div>
                <div className="text-left sm:text-right text-[0.6rem] sm:text-[0.65rem] text-[rgba(254,250,224,0.7)] flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 sm:justify-end">
                    <Clock className="w-3 h-3" />
                    Last updated just now
                  </span>
                  <span className="hidden sm:flex items-center gap-1 sm:justify-end">
                    <TrendingUp className="w-3 h-3" />
                    On-campus &amp; off-campus spend
                  </span>
                </div>
              </div>

              {/* bottom row: pills + actions */}
              <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2 text-[0.65rem] sm:text-[0.7rem]">
                  <span className="rounded-full bg-[rgba(254,250,224,0.16)] backdrop-blur-sm px-2.5 sm:px-3 py-1 border border-[rgba(254,250,224,0.15)] flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3" />
                    Campus card · Default
                  </span>
                  <span className="rounded-full bg-[rgba(254,250,224,0.12)] backdrop-blur-sm px-2.5 sm:px-3 py-1 border border-[rgba(254,250,224,0.1)]">
                    Smart budget active
                  </span>
                  <span className="rounded-full bg-[rgba(254,250,224,0.12)] backdrop-blur-sm px-2.5 sm:px-3 py-1 border border-[rgba(254,250,224,0.1)]">
                    {totalPaymentMethods} payment method
                    {totalPaymentMethods !== 1 ? "s" : ""} linked
                  </span>
                </div>

                {/* Actions (client component) */}
                <WalletActions
                  walletId={primaryWallet.id}
                  paymentMethods={paymentMethods}
                />
              </div>
            </div>
          </div>

          {/* Side stack of smaller cards */}
          <div className="space-y-2 sm:space-y-3">
            {/* Dedicated Meal Plan card */}
            {mealPlanWallet && (
              <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[var(--sc-gold)] to-[var(--sc-gold-dark)] text-[var(--sc-green-dark)] shadow-md hover:shadow-lg transition-all duration-300 border border-[rgba(40,54,24,0.08)] px-3 sm:px-4 py-3 sm:py-3.5 flex justify-between items-center gap-2 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-[rgba(40,54,24,0.7)]" />
                    <p className="text-[0.6rem] sm:text-[0.65rem] uppercase tracking-[0.18em] text-[rgba(40,54,24,0.7)] font-medium">
                      Meal Plan
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold truncate mt-1">
                    {mealPlanWallet.displayName}
                  </p>
                  <p className="mt-1 text-[0.65rem] sm:text-[0.7rem] text-[rgba(40,54,24,0.8)] truncate">
                    {formatMealPlanText(mealPlanWallet)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[0.6rem] sm:text-[0.65rem] text-[rgba(40,54,24,0.75)] font-medium">
                    Swipes
                  </p>
                  <p className="text-sm sm:text-base font-bold whitespace-nowrap">
                    {mealPlanDisplayValue(mealPlanWallet)}
                  </p>
                </div>
              </div>
            )}

            {/* Other wallets */}
            {otherWallets.map((w) => (
              <div
                key={w.id}
                className="rounded-2xl sm:rounded-3xl bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-[rgba(40,54,24,0.08)] hover:border-[rgba(40,54,24,0.12)] px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center gap-2 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <WalletIcon className="w-3.5 h-3.5 text-[var(--sc-green)]" />
                    <p className="text-[0.6rem] sm:text-[0.65rem] uppercase tracking-[0.18em] text-[var(--sc-green)] font-medium">
                      {walletTypeLabel(w.type)}
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[var(--sc-green-dark)] truncate mt-0.5">
                    {w.displayName}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[0.6rem] sm:text-[0.65rem] text-[var(--sc-green)] font-medium">
                    Balance
                  </p>
                  <p className="text-sm sm:text-base font-bold text-[var(--sc-gold-dark)] whitespace-nowrap">
                    {w.currency === "SWIPES"
                      ? `${w.balance} swipes`
                      : `${w.currency} ${w.balance.toFixed(2)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compact recent transaction strip */}
        {latestTransaction && (
          <section>
            <div className="rounded-2xl sm:rounded-3xl bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-[rgba(40,54,24,0.08)] hover:border-[rgba(40,54,24,0.12)] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  latestTransaction.amount < 0
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600"
                }`}>
                  {latestTransaction.amount < 0 ? (
                    <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.18em] text-[var(--sc-green)] font-medium">
                    Most recent transaction
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm font-semibold text-[var(--sc-green-dark)] truncate">
                    {latestTransaction.description}
                  </p>
                  <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] truncate flex items-center gap-1.5 mt-0.5">
                    <span>{latestTransaction.category}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {latestTransaction.isOnCampus ? "On-campus" : "Off-campus"}
                    </span>
                    <span>·</span>
                    <span>{latestTransaction.timestamp.split("T")[0]}</span>
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p
                  className={`text-sm sm:text-base font-bold whitespace-nowrap ${
                    latestTransaction.amount < 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {latestTransaction.amount < 0 ? "-" : "+"}
                  {latestTransaction.currency}{" "}
                  {Math.abs(latestTransaction.amount).toFixed(2)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Lower grid: transactions + events */}
        <section className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
          {/* Transactions */}
          <div className="rounded-2xl sm:rounded-3xl bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border border-[rgba(40,54,24,0.08)] p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--sc-green-dark)]" />
                <h3 className="text-sm sm:text-base font-semibold text-[var(--sc-green-dark)]">
                  Recent activity
                </h3>
              </div>
              <span className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] font-medium whitespace-nowrap px-2 py-0.5 rounded-full bg-[var(--sc-green)]/5">
                Last {Math.min(5, sortedTransactions.length)}
              </span>
            </div>
            <ul className="divide-y divide-[rgba(40,54,24,0.06)]">
              {sortedTransactions.slice(0, 5).map((t) => (
                <li
                  key={t.id}
                  className="py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 hover:bg-[var(--sc-green)]/[0.02] transition-colors duration-200 -mx-2 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      t.amount < 0
                        ? "bg-red-50 text-red-600"
                        : "bg-green-50 text-green-600"
                    }`}>
                      {t.amount < 0 ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-[var(--sc-green-dark)] truncate">
                        {t.description}
                      </p>
                      <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] truncate flex items-center gap-1.5 mt-0.5">
                        <span className="hidden sm:inline">{t.category}</span>
                        <span className="hidden sm:inline">·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="sm:hidden">
                            {t.isOnCampus ? "On" : "Off"}-campus
                          </span>
                          <span className="hidden sm:inline">
                            {t.isOnCampus ? "On-campus" : "Off-campus"}
                          </span>
                        </span>
                        <span>·</span>
                        <span>{t.timestamp.split("T")[0]}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-xs sm:text-sm font-bold whitespace-nowrap ${
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
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[var(--sc-gold)] to-[var(--sc-gold-dark)] text-[var(--sc-cream)] p-3 sm:p-4 md:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(254,250,224,0.08)] rounded-full blur-2xl -mr-16 -mt-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <h3 className="text-sm sm:text-base font-semibold">
                    Upcoming events
                  </h3>
                </div>
                <span className="text-[0.65rem] sm:text-[0.7rem] font-medium whitespace-nowrap px-2 py-0.5 rounded-full bg-[rgba(254,250,224,0.15)] border border-[rgba(254,250,224,0.2)]">
                  {events.length} scheduled
                </span>
              </div>
              <ul className="space-y-2 sm:space-y-2.5">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-xl sm:rounded-2xl bg-[rgba(254,250,224,0.12)] backdrop-blur-sm border border-[rgba(254,250,224,0.15)] px-2.5 sm:px-3 py-2 sm:py-2.5 flex justify-between items-start gap-2 hover:bg-[rgba(254,250,224,0.18)] transition-colors duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold truncate">
                        {e.title}
                      </p>
                      <p className="text-[0.65rem] sm:text-[0.7rem] opacity-85 truncate flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(e.startsAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <MapPin className="w-3 h-3" />
                        <span>{e.location}</span>
                      </p>
                    </div>
                    <p className="text-[0.7rem] sm:text-[0.75rem] font-bold whitespace-nowrap flex-shrink-0 px-2 py-0.5 rounded-full bg-[rgba(254,250,224,0.12)]">
                      {e.price === 0
                        ? "Free"
                        : `${e.currency} ${e.price.toFixed(2)}`}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 sm:mt-4 p-2.5 rounded-xl bg-[rgba(254,250,224,0.08)] border border-[rgba(254,250,224,0.12)]">
                <p className="text-[0.65rem] sm:text-[0.7rem] opacity-90 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Pay for events directly with your Campus Wallet — no extra forms, no cash.</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* Helpers */

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

function formatMealPlanText(w: Wallet): string {
  if (w.currency === "SWIPES" && w.balance < 0) {
    return "Unlimited meal swipes this semester";
  }
  if (w.currency === "SWIPES") {
    return `${w.balance} swipes left`;
  }
  return `${w.currency} ${w.balance.toFixed(2)} remaining`;
}

function mealPlanDisplayValue(w: Wallet): string {
  if (w.currency === "SWIPES" && w.balance < 0) {
    return "Unlimited";
  }
  if (w.currency === "SWIPES") {
    return `${w.balance}`;
  }
  return w.balance.toFixed(2);
}
// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { PaymentMethod } from "@/types/payment-method";
import WalletActions from "@/components/WalletActions";
import AddTransactionMenu from "@/components/AddTransactionMenu";
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
  id: string;
  userId: number;
  walletId: number;
  amount: number;
  merchant: string;
  paymentMethod: string;
  location: string;
  date: string;
  category: string;
}

interface EventItem {
  id: number;
  title: string;
  startsAt: string;
  location: string;
  price: number;
  currency: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<{
    me: User | null;
    wallets: Wallet[];
    transactions: Transaction[];
    events: EventItem[];
    paymentMethods: PaymentMethod[];
  }>({
    me: null,
    wallets: [],
    transactions: [],
    events: [],
    paymentMethods: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!session?.user?.email) {
      return;
    }

    try {
      const userEmail = session.user.email;
      const [me, wallets, transactions, events, paymentMethods] =
        await Promise.all([
          api.getMe(userEmail) as Promise<User>,
          api.getWallets(userEmail) as Promise<Wallet[]>,
          api.getTransactions(userEmail) as Promise<Transaction[]>,
          api.getEvents(userEmail) as Promise<EventItem[]>,
          api.getPaymentMethods(userEmail) as Promise<PaymentMethod[]>,
        ]);
      setData({ me, wallets, transactions, events, paymentMethods });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <main className="w-full">
        <div className="w-full max-w-[1400px] mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[rgba(40,54,24,0.06)] rounded-xl w-48" />
            <div className="h-48 bg-[rgba(40,54,24,0.06)] rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  const { me, wallets, transactions, events, paymentMethods } = data;

  if (!me || wallets.length === 0) {
    return (
      <main className="w-full">
        <div className="w-full max-w-[1400px] mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
          <div className="text-center py-12">
            <p className="text-[var(--sc-green)]">No data available</p>
          </div>
        </div>
      </main>
    );
  }

  const primaryWallet = wallets.find((w) => w.isPrimary) ?? wallets[0];
  const mealPlanWallet = wallets.find((w) => w.type === 1);

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestTransaction = sortedTransactions[0];
  const totalPaymentMethods = paymentMethods.length;

  const otherWallets = wallets.filter(
    (w) =>
      w.id !== primaryWallet.id &&
      (!mealPlanWallet || w.id !== mealPlanWallet.id)
  );

  return (
    <main className="w-full">
      <div className="w-full max-w-[1400px] mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
        {/* ===== HEADER SECTION ===== */}
        <header className="flex flex-col gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--sc-green-dark)] leading-tight">
                Hello, {me.fullName.split(" ")[0]} 👋
              </h1>
              <p className="text-xs sm:text-sm text-[var(--sc-green)] mt-0.5 flex items-center gap-1.5 flex-wrap">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{me.universityName}</span>
                <span>·</span>
                <span>{me.semester}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-[var(--sc-green-dark)]">
                  Student
                </p>
                <p className="text-[0.7rem] text-[var(--sc-green)] truncate max-w-[180px]">
                  {me.email}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-[var(--sc-green-dark)] to-[var(--sc-green)] text-[var(--sc-cream)] flex items-center justify-center text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300 flex-shrink-0 cursor-pointer">
                {me.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            </div>
          </div>
        </header>

        {/* ===== WALLET CARDS SECTION ===== */}
        <section className="grid gap-3 sm:gap-4 lg:grid-cols-[2fr_1fr] xl:grid-cols-[2.2fr_1fr] animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Primary Wallet Card */}
          <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] bg-gradient-to-br from-[var(--sc-green-dark)] via-[var(--sc-green)] to-[#3d5c24] text-[var(--sc-cream)] p-5 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-40 h-40 sm:w-56 sm:h-56 bg-white/5 rounded-full blur-3xl -mr-20 sm:-mr-28 -mt-20 sm:-mt-28 group-hover:bg-white/8 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-44 sm:h-44 bg-black/5 rounded-full blur-2xl -ml-16 sm:-ml-22 -mb-16 sm:-mb-22" />

            <div className="relative z-10 space-y-5 sm:space-y-6">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.25em] text-[rgba(254,250,224,0.75)] font-medium mb-1.5">
                    Campus Wallet
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold truncate">
                    {primaryWallet.displayName}
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(254,250,224,0.18)] backdrop-blur-sm px-2.5 sm:px-3 py-1 text-[0.65rem] sm:text-[0.7rem] font-medium whitespace-nowrap border border-[rgba(254,250,224,0.2)]">
                  <Sparkles className="w-3 h-3" />
                  Tap &amp; Pay Ready
                </span>
              </div>

              {/* Balance Display */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] sm:text-xs uppercase tracking-wide text-[rgba(254,250,224,0.75)] font-medium mb-1.5">
                    Available balance
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold tracking-tight">
                    {primaryWallet.currency === "USD"
                      ? "$"
                      : primaryWallet.currency}{" "}
                    {primaryWallet.balance.toFixed(2)}
                  </p>
                </div>
                <div className="text-left sm:text-right space-y-0.5">
                  <p className="text-[0.65rem] sm:text-xs text-[rgba(254,250,224,0.7)] flex items-center gap-1.5 sm:justify-end">
                    <Clock className="w-3 h-3" />
                    Last updated just now
                  </p>
                  <p className="hidden sm:flex text-[0.65rem] sm:text-xs text-[rgba(254,250,224,0.7)] items-center gap-1.5 sm:justify-end">
                    <TrendingUp className="w-3 h-3" />
                    On-campus &amp; off-campus spend
                  </p>
                </div>
              </div>

              {/* Tags and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-[rgba(254,250,224,0.15)]">
                <div className="flex flex-wrap gap-2 text-[0.65rem] sm:text-[0.7rem]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(254,250,224,0.15)] px-2.5 py-1 border border-[rgba(254,250,224,0.18)]">
                    <CreditCard className="w-3 h-3" />
                    Campus card · Default
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[rgba(254,250,224,0.12)] px-2.5 py-1 border border-[rgba(254,250,224,0.15)]">
                    Smart budget active
                  </span>
                  <span className="hidden sm:inline-flex items-center rounded-full bg-[rgba(254,250,224,0.12)] px-2.5 py-1 border border-[rgba(254,250,224,0.15)]">
                    {totalPaymentMethods} method
                    {totalPaymentMethods !== 1 ? "s" : ""} linked
                  </span>
                </div>

                {/* Wallet Actions Component */}
                <div className="flex-shrink-0">
                  <WalletActions
                    walletId={primaryWallet.id}
                    paymentMethods={paymentMethods}
                    onRefresh={fetchData}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Wallets Column */}
          <div className="space-y-3">
            {/* Meal Plan Wallet Card */}
            {mealPlanWallet && (
              <div className="rounded-[20px] sm:rounded-[24px] bg-gradient-to-br from-[#dda15e] to-[#c4914e] text-[var(--sc-green-dark)] shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-4.5 flex justify-between items-center gap-3 group cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Utensils className="w-3.5 h-3.5 text-[rgba(40,54,24,0.6)] flex-shrink-0" />
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[rgba(40,54,24,0.7)] font-medium">
                      Meal Plan
                    </p>
                  </div>
                  <p className="text-sm sm:text-base font-bold truncate">
                    {mealPlanWallet.displayName}
                  </p>
                  <p className="mt-1 text-[0.7rem] text-[rgba(40,54,24,0.75)] truncate">
                    {formatMealPlanText(mealPlanWallet)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[0.65rem] text-[rgba(40,54,24,0.7)] font-medium uppercase tracking-wide">
                    Swipes
                  </p>
                  <p className="text-lg sm:text-xl font-bold whitespace-nowrap mt-0.5">
                    {mealPlanDisplayValue(mealPlanWallet)}
                  </p>
                </div>
              </div>
            )}

            {/* Other Wallets */}
            {otherWallets.map((w) => (
              <div
                key={w.id}
                className="rounded-[20px] sm:rounded-[24px] bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-[rgba(40,54,24,0.06)] p-4 flex justify-between items-center gap-3 group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <WalletIcon className="w-3.5 h-3.5 text-[var(--sc-green)] flex-shrink-0" />
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--sc-green)] font-medium">
                      {walletTypeLabel(w.type)}
                    </p>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-[var(--sc-green-dark)] truncate">
                    {w.displayName}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[0.65rem] text-[var(--sc-green)] font-medium uppercase tracking-wide">
                    Balance
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-[#bc6c25] whitespace-nowrap mt-0.5">
                    {w.currency === "SWIPES"
                      ? `${w.balance}`
                      : `${
                          w.currency === "USD" ? "$" : w.currency
                        } ${w.balance.toFixed(2)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== RECENT TRANSACTION HIGHLIGHT ===== */}
        {latestTransaction && (
          <section>
            <div className="rounded-[20px] sm:rounded-[24px] bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-[rgba(40,54,24,0.06)] p-4 sm:p-5 flex items-center justify-between gap-4 group cursor-pointer">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Transaction Icon */}
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    latestTransaction.amount < 0
                      ? "bg-red-50 text-red-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {latestTransaction.amount < 0 ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.15em] text-[var(--sc-green)] font-medium flex items-center gap-1.5 mb-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--sc-green)] animate-pulse" />
                    Most recent transaction
                  </p>
                  <p className="text-sm sm:text-base font-bold text-[var(--sc-green-dark)] truncate">
                    {latestTransaction.merchant}
                  </p>
                  <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)] truncate flex items-center gap-1.5 mt-1">
                    <span>{latestTransaction.category}</span>
                    <span>·</span>
                    <MapPin className="w-3 h-3" />
                    <span>
                      {latestTransaction.location}
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline">
                      {latestTransaction.date.split("T")[0]}
                    </span>
                  </p>
                </div>
              </div>

              {/* Transaction Amount */}
              <div className="text-right flex-shrink-0">
                <p
                  className={`text-base sm:text-lg font-bold whitespace-nowrap ${
                    latestTransaction.amount < 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {latestTransaction.amount < 0 ? "-" : "+"}
                  ${Math.abs(latestTransaction.amount).toFixed(2)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ===== TRANSACTIONS & EVENTS SECTION ===== */}
        <section className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
          {/* Recent Transactions Card */}
          <div className="rounded-[16px] sm:rounded-[20px] lg:rounded-[24px] bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border border-[rgba(40,54,24,0.06)] p-3 sm:p-4 lg:p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-[rgba(40,54,24,0.05)]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--sc-green-dark)]" />
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-[var(--sc-green-dark)]">
                  Recent activity
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] sm:text-[0.7rem] lg:text-xs text-[var(--sc-green)] font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[var(--sc-green)]/5">
                  Last {Math.min(5, sortedTransactions.length)}
                </span>
                <AddTransactionMenu
                  userEmail={me.email}
                  wallets={wallets}
                  defaultWalletId={primaryWallet.id}
                  onCreated={fetchData}
                />
              </div>
            </div>

            {/* Transactions List */}
            <ul className="divide-y divide-[rgba(40,54,24,0.04)]">
              {sortedTransactions.slice(0, 5).map((t) => (
                <li
                  key={t.id}
                  className="py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 hover:bg-[var(--sc-green)]/[0.02] transition-colors duration-200 -mx-1 sm:-mx-2 px-1 sm:px-2 rounded-lg group cursor-pointer"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {/* Transaction Icon */}
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        t.amount < 0
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {t.amount < 0 ? (
                        <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </div>

                    {/* Transaction Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.7rem] sm:text-xs lg:text-sm font-bold text-[var(--sc-green-dark)] truncate">
                        {t.merchant}
                      </p>
                      <p className="text-[0.65rem] sm:text-[0.7rem] lg:text-xs text-[var(--sc-green)] truncate flex items-center gap-1 sm:gap-1.5 mt-0.5">
                        <span className="hidden sm:inline">{t.category}</span>
                        <span className="hidden sm:inline">·</span>
                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="sm:hidden">
                          {t.location}
                        </span>
                        <span className="hidden sm:inline">
                          {t.location}
                        </span>
                        <span>·</span>
                        <span className="hidden xs:inline">
                          {t.date.split("T")[0]}
                        </span>
                        <span className="xs:hidden">
                          {t.date.split("T")[0].slice(5)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Transaction Amount */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-[0.7rem] sm:text-xs lg:text-sm font-bold whitespace-nowrap ${
                        t.amount < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {t.amount < 0 ? "-" : "+"}
                      ${Math.abs(t.amount).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Upcoming Events Card */}
          <div className="rounded-[16px] sm:rounded-[20px] lg:rounded-[24px] bg-gradient-to-br from-[#dda15e] to-[#c4914e] text-[var(--sc-cream)] p-3 sm:p-4 lg:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full blur-2xl -mr-12 sm:-mr-16 -mt-12 sm:-mt-16" />

            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-[rgba(254,250,224,0.15)]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold">
                    Upcoming events
                  </h3>
                </div>
                <span className="text-[0.65rem] sm:text-[0.7rem] lg:text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[rgba(254,250,224,0.15)] border border-[rgba(254,250,224,0.2)]">
                  {events.length} scheduled
                </span>
              </div>

              {/* Events List */}
              <ul className="space-y-2 sm:space-y-2.5">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-lg sm:rounded-xl bg-[rgba(254,250,224,0.12)] backdrop-blur-sm border border-[rgba(254,250,224,0.15)] p-2.5 sm:p-3 flex justify-between items-start gap-2 sm:gap-3 hover:bg-[rgba(254,250,224,0.18)] transition-colors duration-200 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.7rem] sm:text-xs lg:text-sm font-bold truncate">
                        {e.title}
                      </p>
                      <p className="text-[0.65rem] sm:text-[0.7rem] lg:text-xs opacity-90 truncate flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>
                          {new Date(e.startsAt).toLocaleDateString()}
                        </span>
                        <span className="hidden sm:inline">·</span>
                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 hidden sm:inline" />
                        <span className="hidden sm:inline truncate">
                          {e.location}
                        </span>
                      </p>
                    </div>
                    <span className="text-[0.65rem] sm:text-[0.7rem] lg:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[rgba(254,250,224,0.15)] border border-[rgba(254,250,224,0.2)] flex-shrink-0">
                      {e.price === 0
                        ? "Free"
                        : `${
                            e.currency === "USD" ? "$" : e.currency
                          } ${e.price.toFixed(2)}`}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Info Banner */}
              <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-[rgba(254,250,224,0.1)] border border-[rgba(254,250,224,0.12)]">
                <p className="text-[0.65rem] sm:text-[0.7rem] lg:text-xs opacity-95 flex items-start gap-1.5 sm:gap-2">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    Pay for events directly with your Campus Wallet — no extra
                    forms, no cash needed.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ===== HELPER FUNCTIONS ===== */

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
  return `${
    w.currency === "USD" ? "$" : w.currency
  } ${w.balance.toFixed(2)} remaining`;
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

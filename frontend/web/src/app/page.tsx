// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PaymentMethod } from "@/types/payment-method";
import { EventItem } from "@/types/event";
import WalletActions from "@/components/WalletActions";
import AddTransactionMenu from "@/components/AddTransactionMenu";
import { BankLinkButton } from "@/components/bank-link-button";
import AddDiningDollarsModal from "@/components/AddDiningDollarsModal";
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
  ArrowRight,
  Landmark,
  X,
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

  const [showAllBankAccounts, setShowAllBankAccounts] = useState(false);
  const [showAddDiningDollars, setShowAddDiningDollars] = useState(false);

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

  // Separate bank-linked wallets from other wallets
  const bankLinkedWallets = wallets.filter((w) => w.type === 3);
  const diningDollarsWallet = wallets.find((w) => w.type === 2);
  const otherWallets = wallets.filter(
    (w) =>
      w.id !== primaryWallet.id &&
      (!mealPlanWallet || w.id !== mealPlanWallet.id) &&
      w.type !== 3 && // Exclude bank-linked wallets
      w.type !== 2 // Exclude dining dollars (we'll show it separately)
  );

  // Available wallets for dining dollars transfer (campus wallet + bank accounts)
  const availableWalletsForDining = wallets.filter((w) => 
    w.type === 0 || w.type === 3 // Campus wallet or bank-linked wallets
  );

  return (
    <main className="w-full">
      <div className="w-full max-w-[1400px] mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
        {/* ===== HEADER SECTION ===== */}
        <header className="flex flex-col gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--sc-green-dark)] leading-tight">
                Hello, {me.fullName.split(" ")[0]} 👋
              </h1>
              <p className="text-sm sm:text-base text-[var(--sc-green)] mt-0.5 flex items-center gap-1.5 flex-wrap">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{me.universityName}</span>
                <span>·</span>
                <span>{me.semester}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-[var(--sc-green-dark)]">
                  Student
                </p>
                <p className="text-xs text-[var(--sc-green)] truncate max-w-[180px]">
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
        <section className="grid gap-3 sm:gap-4 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[1.8fr_1fr] animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Primary Wallet Card */}
          <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] bg-gradient-to-br from-[var(--sc-green-dark)] via-[var(--sc-green)] to-[#3d5c24] text-[var(--sc-cream)] p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-40 h-40 sm:w-56 sm:h-56 bg-white/5 rounded-full blur-3xl -mr-20 sm:-mr-28 -mt-20 sm:-mt-28 group-hover:bg-white/8 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-44 sm:h-44 bg-black/5 rounded-full blur-2xl -ml-16 sm:-ml-22 -mb-16 sm:-mb-22" />

            <div className="relative space-y-5 sm:space-y-6">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  
                  <h2 className="text-xl sm:text-2xl font-bold truncate">
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
                  <p className="text-xs sm:text-sm uppercase tracking-wide text-[rgba(254,250,224,0.75)] font-medium mb-1.5">
                    Available balance
                  </p>
                  <p className="text-4xl sm:text-3xl font-bold tracking-tight">
                    {primaryWallet.currency === "USD"
                      ? "$"
                      : primaryWallet.currency}{" "}
                    {(primaryWallet.balance ?? 0).toFixed(2)}
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
              <div className="flex flex-col gap-1 pt-2 ">

                {/* Wallet Actions Component */}
                <div className="flex-shrink-0">
                  <div className="space-y-2">
                    <WalletActions
                      walletId={primaryWallet.id}
                      paymentMethods={paymentMethods}
                      onRefresh={fetchData}
                    />
                    {/* Link Bank Account Button */}
                    {me && (
                      <>
                        <button
                          onClick={() => {
                            const linkBtn = document.querySelector('[data-bank-link-trigger]') as HTMLButtonElement;
                            linkBtn?.click();
                          }}
                          className="w-full text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[rgba(254,250,224,0.35)] hover:bg-[rgba(254,250,224,0.18)] hover:border-[rgba(254,250,224,0.5)] transition-all duration-200 whitespace-nowrap font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Landmark className="w-3.5 h-3.5 transition-transform group-hover:scale-110 duration-200" />
                          <span>Link Bank Account</span>
                        </button>
                        {/* Hidden Plaid Button */}
                        <div className="hidden">
                          <BankLinkButton
                            userId={me.id}
                            onSuccess={fetchData}
                          />
                        </div>
                      </>
                    )}
                  </div>
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
                    <p className="text-xs uppercase tracking-[0.2em] text-[rgba(40,54,24,0.7)] font-medium">
                      Meal Plan
                    </p>
                  </div>
                  <p className="text-base sm:text-lg font-bold truncate">
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

            {/* Dining Dollars Wallet Card */}
            {diningDollarsWallet && (
              <div className="rounded-[20px] sm:rounded-[24px] bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-[rgba(40,54,24,0.06)] p-4 group">
                <div className="flex justify-between items-center gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <WalletIcon className="w-3.5 h-3.5 text-[var(--sc-green)] flex-shrink-0" />
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--sc-green)] font-medium">
                        Dining Dollars
                      </p>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-[var(--sc-green-dark)] truncate">
                      {diningDollarsWallet.displayName}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[0.65rem] text-[var(--sc-green)] font-medium uppercase tracking-wide">
                      Balance 
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-[#bc6c25] whitespace-nowrap mt-0.5">
                      ${(diningDollarsWallet.balance ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddDiningDollars(true)}
                  className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-[var(--sc-gold)] to-[var(--sc-gold-dark)] hover:from-[var(--sc-gold-dark)] hover:to-[#9a5819] text-white text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Dining Dollars
                </button>
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
                      ? `${w.balance ?? 0}`
                      : `${
                          w.currency === "USD" ? "$" : w.currency
                        } ${(w.balance ?? 0).toFixed(2)}`}
                  </p>
                </div>
              </div>
            ))}

            {/* Bank Linked Account (show first one) */}
            {bankLinkedWallets.length > 0 && (
              <div className="rounded-[20px] sm:rounded-[24px] bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-[rgba(40,54,24,0.06)] p-4 flex justify-between items-center gap-3 group cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Landmark className="w-3.5 h-3.5 text-[var(--sc-green)] flex-shrink-0" />
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--sc-green)] font-medium">
                      Linked Bank
                    </p>
                  </div>
                  <p className="text-lg sm:text-base font-bold text-[var(--sc-green-dark)] truncate">
                    {bankLinkedWallets[0].displayName}
                  </p>
                  {bankLinkedWallets.length > 1 && (
                    <button
                      onClick={() => setShowAllBankAccounts(true)}
                      className="cursor-pointer text-[0.65rem] text-[var(--sc-gold)] hover:text-[var(--sc-gold-dark)] font-medium mt-1 flex items-center gap-1"
                    >
                      <span>+{bankLinkedWallets.length - 1} more</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[0.65rem] text-[var(--sc-green)] font-medium uppercase tracking-wide">
                    Balance
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-[#bc6c25] whitespace-nowrap mt-0.5">
                    ${(bankLinkedWallets[0].balance ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Bank Accounts Modal */}
        {showAllBankAccounts && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setShowAllBankAccounts(false)}
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center px-3 pointer-events-none">
              <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white shadow-2xl p-4 sm:p-6 pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-4 fade-in duration-300 border border-[rgba(40,54,24,0.08)] max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(40,54,24,0.08)]">
                  <div>
                    <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.2em] text-[var(--sc-green)]">
                      Your Accounts
                    </p>
                    <h2 className="text-base sm:text-lg font-semibold text-[var(--sc-green-dark)] mt-0.5">
                      Linked Bank Accounts
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowAllBankAccounts(false)}
                    className="w-8 h-8 rounded-full hover:bg-[var(--sc-green)]/5 flex items-center justify-center transition-colors duration-200 text-[var(--sc-green)] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {bankLinkedWallets.map((w) => (
                    <div
                      key={w.id}
                      className="rounded-xl bg-[var(--sc-cream)]/40 border border-[rgba(40,54,24,0.08)] p-4 flex justify-between items-center gap-3 hover:bg-[var(--sc-cream)]/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[var(--sc-green)]/10 flex items-center justify-center flex-shrink-0">
                          <Landmark className="w-5 h-5 text-[var(--sc-green-dark)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[var(--sc-green-dark)] truncate">
                            {w.displayName}
                          </p>
                          <p className="text-xs text-[var(--sc-green)] mt-0.5">
                            Linked Bank Account
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-[var(--sc-green)] font-medium uppercase tracking-wide">
                          Balance
                        </p>
                        <p className="text-lg font-bold text-[#bc6c25] whitespace-nowrap mt-0.5">
                          ${(w.balance ?? 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

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
                  <p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-[var(--sc-green)] font-medium flex items-center gap-1.5 mb-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--sc-green)] animate-pulse" />
                    Most recent transaction
                  </p>
                  <p className="text-base sm:text-lg font-bold text-[var(--sc-green-dark)] truncate">
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
                  ${Math.abs(latestTransaction.amount ?? 0).toFixed(2)}
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
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[var(--sc-green-dark)]">
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
                      <p className="text-xs sm:text-sm lg:text-base font-bold text-[var(--sc-green-dark)] truncate">
                        {t.merchant}
                      </p>
                      <p className="text-[0.75rem] sm:text-xs lg:text-sm text-[var(--sc-green)] truncate flex items-center gap-1 sm:gap-1.5 mt-0.5">
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
                      ${Math.abs(t.amount ?? 0).toFixed(2)}
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
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold">
                    Upcoming events
                  </h3>
                </div>
                <span className="text-[0.65rem] sm:text-[0.7rem] lg:text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[rgba(254,250,224,0.15)] border border-[rgba(254,250,224,0.2)]">
                  {events.length} scheduled
                </span>
              </div>

              {/* Events List */}
              <ul className="space-y-2 sm:space-y-2.5">
                {events.slice(0, 5).map((e) => (
                  <li
                    key={e.id}
                    className="rounded-lg sm:rounded-xl bg-[rgba(254,250,224,0.12)] backdrop-blur-sm border border-[rgba(254,250,224,0.15)] p-2.5 sm:p-3 flex justify-between items-start gap-2 sm:gap-3 hover:bg-[rgba(254,250,224,0.18)] transition-colors duration-200 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm lg:text-base font-bold truncate">
                        {e.name}
                      </p>
                      <p className="text-[0.75rem] sm:text-xs lg:text-sm opacity-90 truncate flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>
                          {new Date(e.startTime).toLocaleDateString()}
                        </span>
                        <span className="hidden sm:inline">·</span>
                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 hidden sm:inline" />
                        <span className="hidden sm:inline truncate">
                          {e.location}
                        </span>
                      </p>
                    </div>
                    <span className="text-[0.65rem] sm:text-[0.7rem] lg:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[rgba(254,250,224,0.15)] border border-[rgba(254,250,224,0.2)] flex-shrink-0">
                      {(e.cost ?? 0) === 0 ? "Free" : `$${(e.cost ?? 0).toFixed(2)}`}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Show All Events Link */}
              {events.length > 5 && (
                <Link
                  href="/events"
                  className="mt-3 sm:mt-4 flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-[rgba(254,250,224,0.1)] hover:bg-[rgba(254,250,224,0.18)] border border-[rgba(254,250,224,0.12)] hover:border-[rgba(254,250,224,0.2)] transition-all duration-200 group"
                >
                  <span className="text-[0.7rem] sm:text-xs lg:text-sm font-semibold">
                    Show all {events.length} events
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              )}

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

      {/* Add Dining Dollars Modal */}
      {diningDollarsWallet && (
        <AddDiningDollarsModal
          isOpen={showAddDiningDollars}
          onClose={() => setShowAddDiningDollars(false)}
          onSuccess={fetchData}
          diningDollarsWalletId={diningDollarsWallet.id}
          availableWallets={availableWalletsForDining}
        />
      )}
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
  if (w.currency === "SWIPES" && (w.balance ?? 0) < 0) {
    return "Unlimited meal swipes this semester";
  }
  if (w.currency === "SWIPES") {
    return `${w.balance ?? 0} swipes left`;
  }
  return `${
    w.currency === "USD" ? "$" : w.currency
  } ${(w.balance ?? 0).toFixed(2)} remaining`;
}

function mealPlanDisplayValue(w: Wallet): string {
  if (w.currency === "SWIPES" && (w.balance ?? 0) < 0) {
    return "Unlimited";
  }
  if (w.currency === "SWIPES") {
    return `${w.balance ?? 0}`;
  }
  return (w.balance ?? 0).toFixed(2);
}

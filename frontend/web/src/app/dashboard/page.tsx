"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import WalletActions from "@/components/WalletActions";
import { BankLinkButton } from "@/components/bank-link-button";
import AddTransactionMenu from "@/components/AddTransactionMenu";
import type { PaymentMethod } from "@/types/payment-method";
import {
  Wallet as WalletIcon,
  TrendingUp,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
} from "lucide-react";
import Link from "next/link";

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
  eventCode: string;
  name: string;
  category: string;
  location: string;
  startTime: string;
  endTime: string;
  tags: string;
  cost: number;
  rsvped: boolean;
  checkedIn: boolean;
}

interface LinkedAccount {
  id: number;
  name: string;
  type: string;
  mask: string;
  institution: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<{
    me: User | null;
    wallets: Wallet[];
    transactions: Transaction[];
    events: EventItem[];
    paymentMethods: PaymentMethod[];
    linkedAccounts: LinkedAccount[];
  }>({
    me: null,
    wallets: [],
    transactions: [],
    events: [],
    paymentMethods: [],
    linkedAccounts: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchData = async () => {
    if (!session?.user?.email) {
      return;
    }

    try {
      const userEmail = session.user.email;
      const userId = (session.user as any).id;
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5234";
      
      const [me, wallets, transactions, events, paymentMethods, linkedAccountsRes] = await Promise.all([
        api.getMe(userEmail) as Promise<User>,
        api.getWallets(userEmail) as Promise<Wallet[]>,
        api.getTransactions(userEmail) as Promise<Transaction[]>,
        api.getEvents(userEmail) as Promise<EventItem[]>,
        api.getPaymentMethods(userEmail) as Promise<PaymentMethod[]>,
        fetch(`${apiUrl}/api/plaid/accounts/${userId}`).then(r => r.ok ? r.json() : []),
      ]);
      
      const linkedAccounts = linkedAccountsRes as LinkedAccount[];
      setData({ me, wallets, transactions, events, paymentMethods, linkedAccounts });
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

  const { me, wallets, transactions, events } = data;

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
  const { paymentMethods, linkedAccounts } = data;

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestTransaction = sortedTransactions[0];

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
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-[var(--sc-green-dark)] to-[var(--sc-green)] text-[var(--sc-cream)] flex items-center justify-center text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300 flex-shrink-0">
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
            <div className="absolute top-0 right-0 w-40 h-40 sm:w-56 sm:h-56 bg-white/5 rounded-full blur-3xl -mr-20 sm:-mr-28 -mt-20 sm:-mt-28 group-hover:bg-white/8 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-44 sm:h-44 bg-black/5 rounded-full blur-2xl -ml-16 sm:-ml-22 -mb-16 sm:-mb-22" />

            <div className="relative space-y-5 sm:space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold truncate">
                    {primaryWallet.displayName}
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(254,250,224,0.18)] backdrop-blur-sm px-2.5 sm:px-3 py-1 text-[0.65rem] sm:text-[0.7rem] font-medium whitespace-nowrap border border-[rgba(254,250,224,0.2)]">
                  <Sparkles className="w-3 h-3" />
                  PRIMARY
                </span>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-[rgba(254,250,224,0.7)] mb-1.5 sm:mb-2">
                  Available Balance
                </p>
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  ${(primaryWallet.balance ?? 0).toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <WalletActions
                  walletId={primaryWallet.id}
                  paymentMethods={paymentMethods}
                  onRefresh={fetchData}
                />
                <BankLinkButton
                  userId={me.id}
                  onSuccess={fetchData}
                />
                <Link href="/wallets">
                  <button className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[rgba(254,250,224,0.15)] hover:bg-[rgba(254,250,224,0.25)] border border-[rgba(254,250,224,0.25)] hover:border-[rgba(254,250,224,0.35)] transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2">
                    <span>View All Wallets</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Secondary Wallets Column */}
          <div className="space-y-3">
            {mealPlanWallet && (
              <div className="rounded-[20px] sm:rounded-[24px] bg-gradient-to-br from-[#dda15e] to-[#c4914e] text-[var(--sc-green-dark)] shadow-lg hover:shadow-xl transition-all duration-300 p-4 flex justify-between items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-[rgba(40,54,24,0.7)] font-medium mb-1">
                    Meal Plan
                  </p>
                  <p className="text-base sm:text-lg font-bold truncate">
                    {mealPlanWallet.displayName}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[0.65rem] text-[rgba(40,54,24,0.7)] font-medium uppercase tracking-wide">
                    Swipes
                  </p>
                  <p className="text-lg sm:text-xl font-bold whitespace-nowrap mt-0.5">
                    {Math.floor(mealPlanWallet.balance ?? 0)}
                  </p>
                </div>
              </div>
            )}

            {wallets.filter((w) => w.id !== primaryWallet.id && w.type !== 1).slice(0, 2).map((w) => (
              <div
                key={w.id}
                className="rounded-[20px] sm:rounded-[24px] bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-[rgba(40,54,24,0.06)] p-4 flex justify-between items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <WalletIcon className="w-3.5 h-3.5 text-[var(--sc-green)] flex-shrink-0" />
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--sc-green)] font-medium">
                      {w.type === 2 ? "Dining Dollars" : w.type === 3 ? "Linked Bank" : "Wallet"}
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
                    ${(w.balance ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}

            {/* Linked Bank Accounts */}
            {linkedAccounts.slice(0, showAllAccounts ? linkedAccounts.length : 2).map((account) => (
              <div
                key={account.id}
                className="rounded-[20px] sm:rounded-[24px] bg-gradient-to-br from-[#6c9a8b] to-[#5a8577] text-white shadow-md hover:shadow-lg transition-all duration-300 p-4 flex justify-between items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] font-medium opacity-90">
                      Linked Bank
                    </p>
                  </div>
                  <p className="text-sm sm:text-base font-bold truncate">
                    {account.institution}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {account.name} ••••{account.mask}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[0.65rem] font-medium uppercase tracking-wide opacity-90">
                    {account.type}
                  </p>
                </div>
              </div>
            ))}

            {/* Show All Accounts Button */}
            {linkedAccounts.length > 2 && (
              <button
                onClick={() => setShowAllAccounts(!showAllAccounts)}
                className="w-full rounded-[20px] sm:rounded-[24px] bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-[rgba(40,54,24,0.06)] p-3 flex items-center justify-center gap-2 text-[var(--sc-green-dark)] font-medium text-sm cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>{showAllAccounts ? 'Show less' : `Show all ${linkedAccounts.length} linked accounts`}</span>
                <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${showAllAccounts ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        </section>

        {/* ===== RECENT TRANSACTION HIGHLIGHT ===== */}
        {latestTransaction && (
          <section>
            <div className="rounded-[20px] sm:rounded-[24px] bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-[rgba(40,54,24,0.06)] p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
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
                    <span>{latestTransaction.location}</span>
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p
                  className={`text-base sm:text-lg font-bold whitespace-nowrap ${
                    latestTransaction.amount < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {latestTransaction.amount < 0 ? "-" : "+"}$
                  {Math.abs(latestTransaction.amount ?? 0).toFixed(2)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ===== TRANSACTIONS & EVENTS SECTION ===== */}
        <section className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
          {/* Recent Transactions Card */}
          <div className="rounded-[16px] sm:rounded-[20px] lg:rounded-[24px] bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border border-[rgba(40,54,24,0.06)] p-3 sm:p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-[rgba(40,54,24,0.05)]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--sc-green-dark)]" />
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[var(--sc-green-dark)]">
                  Recent activity
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <AddTransactionMenu
                  userEmail={session?.user?.email || ""}
                  wallets={wallets.map(w => ({
                    id: w.id,
                    displayName: w.displayName,
                    currency: w.currency,
                    balance: w.balance
                  }))}
                  defaultWalletId={primaryWallet.id}
                  onCreated={fetchData}
                />
                <Link href="/activity">
                  <span className="text-[0.65rem] sm:text-[0.7rem] lg:text-xs text-[var(--sc-green)] hover:text-[var(--sc-green-dark)] font-medium cursor-pointer">
                    View all →
                  </span>
                </Link>
              </div>
            </div>

            <ul className="divide-y divide-[rgba(40,54,24,0.04)]">
              {sortedTransactions.slice(0, 5).map((t) => (
                <li
                  key={t.id}
                  className="py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 hover:bg-[var(--sc-green)]/[0.02] transition-colors duration-200 -mx-1 sm:-mx-2 px-1 sm:px-2 rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        t.amount < 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                      }`}
                    >
                      {t.amount < 0 ? (
                        <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm lg:text-base font-bold text-[var(--sc-green-dark)] truncate">
                        {t.merchant}
                      </p>
                      <p className="text-[0.65rem] sm:text-xs text-[var(--sc-green)] truncate">
                        {t.category} · {t.date.split("T")[0]}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-[0.7rem] sm:text-xs lg:text-sm font-bold whitespace-nowrap ${
                        t.amount < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount ?? 0).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Upcoming Events Card */}
          <div className="rounded-[16px] sm:rounded-[20px] lg:rounded-[24px] bg-gradient-to-br from-[#dda15e] to-[#c4914e] text-[var(--sc-cream)] p-3 sm:p-4 lg:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full blur-2xl -mr-12 sm:-mr-16 -mt-12 sm:-mt-16" />

            <div className="relative">
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

              <ul className="space-y-2 sm:space-y-2.5">
                {events.slice(0, 3).map((e) => (
                  <li
                    key={e.id}
                    className="rounded-lg sm:rounded-xl bg-[rgba(254,250,224,0.12)] backdrop-blur-sm border border-[rgba(254,250,224,0.15)] p-2.5 sm:p-3 flex justify-between items-start gap-2 sm:gap-3 hover:bg-[rgba(254,250,224,0.18)] transition-colors duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm lg:text-base font-bold truncate">
                        {e.name}
                      </p>
                      <p className="text-[0.7rem] sm:text-xs opacity-90 truncate flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>{new Date(e.startTime).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <span className="text-[0.65rem] sm:text-[0.7rem] lg:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[rgba(254,250,224,0.15)] border border-[rgba(254,250,224,0.2)] flex-shrink-0">
                      {(e.cost ?? 0) === 0 ? "Free" : `$${(e.cost ?? 0).toFixed(2)}`}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href="/events">
                <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-[rgba(254,250,224,0.1)] hover:bg-[rgba(254,250,224,0.18)] border border-[rgba(254,250,224,0.12)] hover:border-[rgba(254,250,224,0.2)] transition-all duration-200 cursor-pointer">
                  <span className="text-[0.7rem] sm:text-xs lg:text-sm font-semibold">
                    Show all {events.length} events
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

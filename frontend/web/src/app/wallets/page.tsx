"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Wallet as WalletIcon, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";

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

export default function WalletsPage() {
  const { data: session, status } = useSession();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCount, setShowCount] = useState(10);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.email) return;
      
      try {
        const [walletsData, transactionsData] = await Promise.all([
          api.getWallets(session.user.email) as Promise<Wallet[]>,
          api.getTransactions(session.user.email) as Promise<Transaction[]>
        ]);
        setWallets(walletsData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <main className="space-y-3 sm:space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[rgba(40,54,24,0.06)] rounded-xl w-48"></div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="h-32 bg-[rgba(40,54,24,0.06)] rounded-2xl"></div>
            <div className="h-32 bg-[rgba(40,54,24,0.06)] rounded-2xl"></div>
          </div>
        </div>
      </main>
    );
  }

  // Sort transactions by date, newest first
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const displayedTransactions = sortedTransactions.slice(0, showCount);
  const hasMore = showCount < sortedTransactions.length;
  const canShowLess = showCount > 5;

  const handleShowMore = () => {
    setShowCount(prev => Math.min(prev + 10, sortedTransactions.length));
  };

  const handleShowLess = () => {
    setShowCount(5);
  };

  return (
    <main className="space-y-4 sm:space-y-5 md:space-y-6">
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-[var(--sc-green-dark)]">
        Your wallets & balances
      </h1>
      
      {/* Wallets Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {wallets.map((w) => (
          <Card 
            key={w.id}
            className="border-2 border-[var(--sc-green-dark)] bg-white hover:shadow-lg transition-shadow duration-300"
          >
            <CardHeader className="pb-2 sm:pb-3">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm uppercase tracking-[0.16em] sm:tracking-[0.18em] text-[var(--sc-green)] font-semibold">
                      {walletTypeLabel(w.type)}
                    </p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-[var(--sc-green-dark)] mt-0.5 sm:mt-1 truncate">
                      {w.displayName}
                    </p>
                  </div>
                  {w.isPrimary && (
                    <span className="inline-flex items-center text-[0.65rem] sm:text-[0.7rem] rounded-full bg-[var(--sc-gold)] text-[var(--sc-green-dark)] px-2 sm:px-3 py-0.5 sm:py-1 font-semibold whitespace-nowrap ml-2">
                      Default
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3 sm:pb-4">
              <div className="p-3 sm:p-4 rounded-xl bg-[var(--sc-cream)] border border-[var(--sc-green)]/20">
                <p className="text-xs sm:text-sm text-[var(--sc-green)] font-medium mb-1">Balance</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--sc-green-dark)] break-words">
                  {w.currency === "SWIPES"
                    ? `${w.balance ?? 0} swipes`
                    : `${w.currency} ${(w.balance ?? 0).toFixed(2)}`}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transactions Section */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-[var(--sc-green-dark)]">
          Recent Transactions
        </h2>
        
        {sortedTransactions.length === 0 ? (
          <Card className="border border-[var(--sc-green)]/20">
            <CardContent className="py-8 sm:py-10 md:py-12 text-center px-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto rounded-full bg-[var(--sc-cream)] border border-[var(--sc-green)]/20 flex items-center justify-center mb-3 sm:mb-4">
                <WalletIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[var(--sc-green)]" />
              </div>
              <p className="text-sm sm:text-base font-medium text-[var(--sc-green-dark)]">No transactions yet</p>
              <p className="text-xs sm:text-sm text-[var(--sc-green)] mt-1">Your transaction history will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-[var(--sc-green)]/20">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm md:text-base min-w-[550px] sm:min-w-[600px]">
                  <thead>
                    <tr className="border-b-2 border-[var(--sc-green-dark)] bg-[var(--sc-cream)]">
                      <th className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-left font-semibold text-[var(--sc-green-dark)]">Date</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-left font-semibold text-[var(--sc-green-dark)]">Merchant</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-left font-semibold text-[var(--sc-green-dark)] hidden md:table-cell">Category</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-left font-semibold text-[var(--sc-green-dark)] hidden sm:table-cell">Location</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-right font-semibold text-[var(--sc-green-dark)]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTransactions.map((t, idx) => (
                      <tr
                        key={t.id}
                        className={`border-b border-[var(--sc-green)]/10 hover:bg-[var(--sc-cream)]/50 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-[var(--sc-cream)]/30'
                        }`}
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-[var(--sc-green-dark)] font-medium whitespace-nowrap text-xs sm:text-sm md:text-base">
                          {new Date(t.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: new Date().getFullYear() !== new Date(t.date).getFullYear() ? 'numeric' : undefined
                          })}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-[var(--sc-green-dark)] font-medium max-w-[100px] sm:max-w-[150px] truncate">
                          {t.merchant}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-[var(--sc-green)] hidden md:table-cell">
                          {t.category}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 hidden sm:table-cell">
                          <span className="inline-block rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm md:text-base bg-[var(--sc-green)]/10 text-[var(--sc-green-dark)] font-medium border border-[var(--sc-green)]/20 truncate max-w-[80px] sm:max-w-full">
                            {t.location}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-right font-bold whitespace-nowrap">
                          <span className={`flex items-center justify-end gap-0.5 sm:gap-1 ${
                            (t.amount ?? 0) < 0 ? 'text-[var(--sc-gold-dark)]' : 'text-[var(--sc-green)]'
                          }`}>
                            <span className="text-xs sm:text-sm md:text-base">
                              {(t.amount ?? 0) < 0 ? "-" : "+"}${Math.abs(t.amount ?? 0).toFixed(2)}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Show More/Less Buttons */}
              {(hasMore || canShowLess) && (
                <div className="p-3 sm:p-4 border-t-2 border-[var(--sc-green-dark)] bg-[var(--sc-cream)]/50 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                  {hasMore && (
                    <button
                      onClick={handleShowMore}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-sm sm:text-base font-semibold hover:bg-[var(--sc-green)] transition-colors cursor-pointer"
                    >
                      Show More
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                  {canShowLess && (
                    <button
                      onClick={handleShowLess}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-[var(--sc-green-dark)] text-[var(--sc-green-dark)] text-sm sm:text-base font-semibold hover:bg-[var(--sc-green-dark)] hover:text-[var(--sc-cream)] transition-colors cursor-pointer"
                    >
                      Show Less
                      <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

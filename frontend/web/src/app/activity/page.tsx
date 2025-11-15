// app/activity/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ActivityCharts from "@/components/activity/ActivityCharts";

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

export default function ActivityPage() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      if (!session?.user?.email) return;
      
      try {
        const data = await api.getTransactions(session.user.email) as Transaction[];
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchTransactions();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <main className="space-y-4 sm:space-y-5">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[rgba(40,54,24,0.06)] rounded-xl w-48"></div>
          <div className="h-64 bg-[rgba(40,54,24,0.06)] rounded-2xl"></div>
        </div>
      </main>
    );
  }

  // sort newest first so both charts + table are consistent
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <main className="space-y-4 sm:space-y-5">
      <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--sc-green-dark)]">
        Full activity
      </h1>

      {/* NEW: charts / summary section */}
      <ActivityCharts transactions={sorted} />

      {/* Existing table */}
      <Card>
        <CardHeader>
          <p className="text-xs sm:text-sm font-semibold text-[var(--sc-green-dark)]">
            Transactions
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[0.7rem] sm:text-xs md:text-sm min-w-[500px]">
              <thead>
                <tr className="text-left text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] border-b border-[rgba(40,54,24,0.06)]">
                  <th className="py-2 pr-2 font-medium">Date</th>
                  <th className="py-2 pr-2 font-medium">Description</th>
                  <th className="py-2 pr-2 font-medium hidden sm:table-cell">
                    Category
                  </th>
                  <th className="py-2 pr-2 font-medium">Campus</th>
                  <th className="py-2 pl-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[rgba(40,54,24,0.03)]"
                  >
                    <td className="py-2 pr-2 text-[var(--sc-green-dark)] whitespace-nowrap">
                      {t.timestamp.split("T")[0]}
                    </td>
                    <td className="py-2 pr-2 max-w-[150px] truncate">
                      {t.description}
                    </td>
                    <td className="py-2 pr-2 hidden sm:table-cell">
                      {t.category}
                    </td>
                    <td className="py-2 pr-2">
                      <span className="rounded-full px-1.5 sm:px-2 py-0.5 text-[0.6rem] sm:text-[0.65rem] bg-[rgba(96,108,56,0.08)] text-[var(--sc-green-dark)] whitespace-nowrap">
                        {t.isOnCampus ? "On" : "Off"}
                      </span>
                    </td>
                    <td
                      className={`py-2 pl-2 text-right font-semibold whitespace-nowrap ${
                        t.amount < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {t.amount < 0 ? "-" : "+"}
                      {t.currency === "USD" ? "$" : t.currency} {Math.abs(t.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

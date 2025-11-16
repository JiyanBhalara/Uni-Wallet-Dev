// app/activity/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ActivityCharts from "@/components/activity/ActivityCharts";

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

interface EventAttendance {
  totalRsvped: number;
  attended: number;
  missed: number;
}

export default function ActivityPage() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [eventAttendance, setEventAttendance] = useState<EventAttendance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.email) return;
      
      try {
        const [transactionsData, attendanceData] = await Promise.all([
          api.getTransactions(session.user.email) as Promise<Transaction[]>,
          api.getEventAttendanceSummary(session.user.email) as Promise<EventAttendance>
        ]);
        setTransactions(transactionsData);
        setEventAttendance(attendanceData);
      } catch (error) {
        console.error("Failed to fetch activity data:", error);
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
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <main className="space-y-4 sm:space-y-5">
      <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--sc-green-dark)]">
        Full activity
      </h1>

      {/* NEW: charts / summary section */}
      <ActivityCharts transactions={sorted} eventAttendance={eventAttendance} />

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
                  <th className="py-2 pr-2 font-medium">Merchant</th>
                  <th className="py-2 pr-2 font-medium hidden sm:table-cell">
                    Category
                  </th>
                  <th className="py-2 pr-2 font-medium">Location</th>
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
                      {t.date.split("T")[0]}
                    </td>
                    <td className="py-2 pr-2 max-w-[150px] truncate">
                      {t.merchant}
                    </td>
                    <td className="py-2 pr-2 hidden sm:table-cell">
                      {t.category}
                    </td>
                    <td className="py-2 pr-2">
                      <span className="rounded-full px-1.5 sm:px-2 py-0.5 text-[0.6rem] sm:text-[0.65rem] bg-[rgba(96,108,56,0.08)] text-[var(--sc-green-dark)] whitespace-nowrap">
                        {t.location}
                      </span>
                    </td>
                    <td
                      className={`py-2 pl-2 text-right font-semibold whitespace-nowrap ${
                        (t.amount ?? 0) < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {(t.amount ?? 0) < 0 ? "-" : "+"}
                      ${Math.abs(t.amount ?? 0).toFixed(2)}
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

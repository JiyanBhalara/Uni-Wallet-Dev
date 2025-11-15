// app/budgeting/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import BudgetSetupForm from "@/components/budgeting/BudgetSetupForm";
import BudgetTracking from "@/components/budgeting/BudgetTracking";
import type { Budget } from "@/types/budget";

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

export default function BudgetingPage() {
  const { data: session, status } = useSession();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.email) return;
      
      try {
        const [budgetsData, transactionsData] = await Promise.all([
          api.getBudgets(session.user.email),
          api.getTransactions(session.user.email) as Promise<Transaction[]>,
        ]);
        setBudgets(budgetsData);
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
      <main className="space-y-4 sm:space-y-5">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[rgba(40,54,24,0.06)] rounded-xl w-48"></div>
          <div className="h-48 bg-[rgba(40,54,24,0.06)] rounded-2xl"></div>
        </div>
      </main>
    );
  }

  const hasBudgets = budgets.length > 0;

  return (
    <main className="space-y-4 sm:space-y-5">
      <header className="space-y-1">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--sc-green-dark)]">
          Budgeting & goals
        </h1>
        <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)]">
          Set monthly budgets for different categories and track how close you
          are to your goals.
        </p>
      </header>

      {!hasBudgets && (
        <Card className="border-[rgba(40,54,24,0.12)] bg-white">
          <CardContent className="py-4 sm:py-5 space-y-3">
            <p className="text-[0.8rem] sm:text-sm text-[var(--sc-green-dark)] font-medium">
              You haven&apos;t set up any budgets yet.
            </p>
            <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)]">
              Start by deciding how much you want to spend on things like
              dining, transport, books, and events this month. We&apos;ll warn
              you automatically when you get close to your limits.
            </p>
            <BudgetSetupForm initialBudgets={[]} />
          </CardContent>
        </Card>
      )}

      {hasBudgets && (
        <>
          <BudgetTracking budgets={budgets} transactions={transactions} />

          <Card className="border-[rgba(40,54,24,0.12)] bg-white">
            <CardHeader className="pb-2">
              <p className="text-xs sm:text-sm font-semibold text-[var(--sc-green-dark)]">
                Adjust budgets & goals
              </p>
              <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)]">
                You can update your category limits at any time. Changes apply
                from now going forward.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <BudgetSetupForm initialBudgets={budgets} />
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}

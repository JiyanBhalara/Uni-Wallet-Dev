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
    <main className="space-y-4 sm:space-y-5 lg:space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--sc-green-dark)]">
          Budgeting & Goals
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-[var(--sc-green)]">
          Set monthly budgets for different categories and track how close you
          are to your goals.
        </p>
      </header>

      {!hasBudgets && (
        <Card className="border-[rgba(40,54,24,0.12)] bg-white">
          <CardContent className="py-5 sm:py-6 md:py-8 space-y-4">
            <p className="text-base sm:text-lg md:text-xl text-[var(--sc-green-dark)] font-semibold">
              You haven&apos;t set up any budgets yet.
            </p>
            <p className="text-sm sm:text-base md:text-lg text-[var(--sc-green)]">
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
            <CardHeader className="pb-3">
              <p className="text-base sm:text-lg md:text-xl font-bold text-[var(--sc-green-dark)]">
                Adjust Budgets & Goals
              </p>
              <p className="text-sm sm:text-base text-[var(--sc-green)] mt-1">
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

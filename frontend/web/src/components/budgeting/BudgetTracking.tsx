// src/components/budgeting/BudgetTracking.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Budget } from "@/types/budget";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

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

interface Props {
  budgets: Budget[];
  transactions: Transaction[];
}

const COLORS = ["#606C38", "#283618", "#DDA15E", "#BC6C25", "#A3B18A", "#CCD5AE"];

export default function BudgetTracking({ budgets, transactions }: Props) {
  const { perCategory, totalLimit, totalSpent } = useMemo(
    () => computeBudgets(budgets, transactions),
    [budgets, transactions]
  );

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-3 sm:gap-4">
      {/* Left: list with progress bars */}
      <Card className="border-[rgba(40,54,24,0.12)] bg-white">
        <CardHeader className="pb-2">
          <p className="text-xs sm:text-sm font-semibold text-[var(--sc-green-dark)]">
            Category budgets
          </p>
          <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)]">
            See how much you&apos;ve spent so far this period compared to your
            budget.
          </p>
        </CardHeader>
        <CardContent className="pt-1 space-y-3 sm:space-y-3.5">
          <div className="flex items-center justify-between text-[0.7rem] sm:text-xs text-[var(--sc-green)]">
            <span>
              Total spent:{" "}
              <span className="font-semibold text-[var(--sc-green-dark)]">
                ${Math.abs(totalSpent).toFixed(2)}
              </span>
            </span>
            <span>
              Total budget:{" "}
              <span className="font-semibold text-[var(--sc-green-dark)]">
                ${totalLimit.toFixed(2)}
              </span>
            </span>
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            {perCategory.map((row, idx) => (
              <div
                key={row.category}
                className="rounded-xl border border-[rgba(40,54,24,0.06)] px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[var(--sc-cream)]/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[0.75rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                      {row.category}
                    </p>
                    <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)]">
                      ${row.spent.toFixed(2)} of ${row.limit.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right text-[0.65rem] sm:text-[0.7rem]">
                    <span
                      className={
                        row.ratio >= 1
                          ? "text-red-600 font-semibold"
                          : row.ratio >= 0.8
                          ? "text-[var(--sc-gold-dark)] font-semibold"
                          : "text-[var(--sc-green-dark)]"
                      }
                    >
                      {Math.round(row.ratio * 100)}%
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 h-1.5 rounded-full bg-[rgba(40,54,24,0.06)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(row.ratio, 1) * 100}%`,
                      backgroundColor:
                        row.ratio >= 1
                          ? "#BC4749"
                          : row.ratio >= 0.8
                          ? "#DDA15E"
                          : COLORS[idx % COLORS.length],
                    }}
                  />
                </div>

                {row.ratio >= 0.8 && row.ratio < 1 && (
                  <p className="mt-1 text-[0.6rem] sm:text-[0.65rem] text-[var(--sc-gold-dark)]">
                    You&apos;re close to hitting your {row.periodType.toLowerCase()}{" "}
                    budget for {row.category}.
                  </p>
                )}
                {row.ratio >= 1 && (
                  <p className="mt-1 text-[0.6rem] sm:text-[0.65rem] text-red-600">
                    You&apos;ve gone over your {row.periodType.toLowerCase()}{" "}
                    budget for {row.category}.
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Right: pie chart */}
      <Card className="border-[rgba(40,54,24,0.12)] bg-white">
        <CardHeader className="pb-2">
          <p className="text-xs sm:text-sm font-semibold text-[var(--sc-green-dark)]">
            Budget usage by category
          </p>
          <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)]">
            Which categories are eating most of your budget this period?
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {perCategory.length === 0 ? (
            <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)]">
              Add some budgets to see a breakdown here.
            </p>
          ) : (
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={perCategory}
                    dataKey="spent"
                    nameKey="category"
                    outerRadius="80%"
                  >
                    {perCategory.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `$${Number(value).toFixed(2)} spent`,
                      name,
                    ]}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function computeBudgets(budgets: Budget[], transactions: Transaction[]) {
  const now = new Date();

  const perCategory = budgets.map((b) => {
    const periodType = b.periodType === 0 ? "Monthly" : "Weekly";
    const { start, end } = getPeriodRange(now, b.periodType);

    const spent = transactions
      .filter((t) => {
        if (!t.category) return false;
        if (t.amount >= 0) return false; // only spending
        const catMatch =
          t.category.trim().toLowerCase() === b.category.trim().toLowerCase();
        if (!catMatch) return false;

        const ts = new Date(t.timestamp);
        return ts >= start && ts < end;
      })
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const ratio = b.limitAmount > 0 ? spent / b.limitAmount : 0;

    return {
      category: b.category,
      periodType,
      limit: Number(b.limitAmount),
      spent,
      ratio,
    };
  });

  const totalLimit = perCategory.reduce((s, r) => s + r.limit, 0);
  const totalSpent = -1 * perCategory.reduce((s, r) => s + r.spent, 0);

  return { perCategory, totalLimit, totalSpent };
}

function getPeriodRange(now: Date, periodType: number) {
  if (periodType === 1) {
    // weekly
    const day = now.getDay(); // 0=Sun
    const diff = (day + 6) % 7; // days since Monday
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  } else {
    // monthly
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }
}

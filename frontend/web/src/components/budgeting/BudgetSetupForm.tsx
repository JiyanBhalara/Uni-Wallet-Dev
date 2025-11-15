// src/components/budgeting/BudgetSetupForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import type { Budget } from "@/types/budget";

const DEFAULT_CATEGORIES = [
  "Dining",
  "Groceries",
  "Transport",
  "Books",
  "Events",
  "Entertainment",
  "Other",
];

interface Props {
  initialBudgets: Budget[];
}

interface BudgetRow {
  category: string;
  limitAmount: string;
  periodType: "Monthly" | "Weekly";
}

export default function BudgetSetupForm({ initialBudgets }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const initialMap = new Map(
    initialBudgets.map((b) => [
      b.category,
      {
        category: b.category,
        limitAmount: b.limitAmount.toString(),
        periodType: b.periodType === 0 ? "Monthly" : "Weekly",
      } as BudgetRow,
    ])
  );

  const [rows, setRows] = useState<BudgetRow[]>(
    DEFAULT_CATEGORIES.map((cat) => {
      const existing = initialMap.get(cat);
      return (
        existing ?? {
          category: cat,
          limitAmount: "",
          periodType: "Monthly",
        }
      );
    })
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    index: number,
    field: keyof BudgetRow,
    value: string
  ) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const toSend = rows
      .filter((r) => r.limitAmount.trim() !== "")
      .map((r) => ({
        category: r.category,
        limitAmount: Number(r.limitAmount),
        periodType: r.periodType,
      }));

    if (toSend.length === 0) {
      setError("Set at least one category with a budget.");
      return;
    }

    const anyInvalid = toSend.some(
      (r) => !r.limitAmount || r.limitAmount <= 0
    );
    if (anyInvalid) {
      setError("Budgets must be positive amounts.");
      return;
    }

    setSaving(true);
    try {
      if (!session?.user?.email) {
        setError("User not authenticated");
        return;
      }
      await api.saveBudgets(session.user.email, { budgets: toSend });
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to save budgets. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr] gap-2 sm:gap-3 text-[0.7rem] sm:text-xs">
        <div className="hidden sm:block text-[var(--sc-green)] font-medium">
          Category
        </div>
        <div className="hidden sm:block text-[var(--sc-green)] font-medium">
          Monthly / weekly budget
        </div>
        <div className="hidden sm:block text-[var(--sc-green)] font-medium">
          Period
        </div>

        {rows.map((row, idx) => (
          <div
            key={row.category}
            className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-subgrid col-span-3 items-center gap-2 sm:gap-3 border-b border-[rgba(40,54,24,0.04)] pb-2 last:border-b-0 last:pb-0"
          >
            <div className="text-[0.75rem] sm:text-xs text-[var(--sc-green-dark)]">
              {row.category}
            </div>
            <div>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-2.5 py-1.5 text-[0.7rem] sm:text-xs bg-[var(--sc-cream)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent"
                placeholder="0.00"
                value={row.limitAmount}
                onChange={(e) =>
                  handleChange(idx, "limitAmount", e.target.value)
                }
              />
            </div>
            <div>
              <select
                className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-2.5 py-1.5 text-[0.7rem] sm:text-xs bg-[var(--sc-cream)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent"
                value={row.periodType}
                onChange={(e) =>
                  handleChange(
                    idx,
                    "periodType",
                    e.target.value as BudgetRow["periodType"]
                  )
                }
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-[0.7rem] sm:text-xs text-red-600">{error}</p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-[0.7rem] sm:text-xs font-medium hover:bg-[var(--sc-green)] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save budgets"}
        </button>
      </div>
    </form>
  );
}

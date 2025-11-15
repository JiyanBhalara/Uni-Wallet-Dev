// src/types/budget.ts
export type BudgetPeriodType = "Monthly" | "Weekly";

export interface Budget {
  id: number;
  userId: number;
  category: string;
  periodType: number; // 0=Monthly,1=Weekly (EF enum)
  limitAmount: number;
  isActive: boolean;
  createdAt: string;
  lastAlertSentAt?: string | null;
}

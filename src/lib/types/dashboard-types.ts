import type { AccountType } from "@/db/queries";

export type DashboardCards = {
  title: string;
  content: string;
  badge: string;
};

export type DashboardSavingsGoalsCards = {
  title: string;
  content: string;
  value: number;
};

export type DashboardSavingsGoals = {
  id: string;
  name: string;
  goalAmount: number;
  amountSaved: number;
  monthlyAllocation?: number;
  value: number;
  accountType: AccountType;
  dueDate?: Date | null;
  remaining?: number;
};

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
  dueDate?: Date | null;
  remaining?: number;
};

type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  date: string;
  recipient: string;
  type: TransactionType;
  category: string;
  note: string;
  amount: number;
};

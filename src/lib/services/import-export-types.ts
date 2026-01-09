export type ImportType = "transactions" | "budgets" | "accounts" | "saving-goals" | "transfers" | "full-export" | "full-json";
export type ImportMode = "append" | "replace";

export type ValidationReport = {
    validRows: number;
    invalidRows: number;
    missingAccounts: string[];
    newCategories: string[];
    allCategories: string[];
    potentialDuplicates: number;
    totalRows: number;
};

export interface FullJsonValidationReport {
    accounts: { count: number; valid: boolean };
    budgets: { count: number; valid: boolean };
    transactions: { count: number; valid: boolean };
    savingGoals: { count: number; valid: boolean };
    transfers: { count: number; valid: boolean };
    totalItems: number;
    version?: string;
    exportedAt?: string;
}

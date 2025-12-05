import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import {
  financialAccounts,
  transactionCategories,
  transactions,
  budgets,
  savingGoals,
  quickTasks,
} from "../src/db/schema";
import type { AccountType } from "../src/db/queries";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    console.log("Starting static database seeding...");

    // Fetch existing user and hub
    const user = await db.query.users.findFirst();
    if (!user) throw new Error("No user found — please sign up first");

    const hub = await db.query.hubs.findFirst({
      where: (h, { eq }) => eq(h.userId, user.id),
    });
    if (!hub) throw new Error("No hub found for user");

    const userId = user.id;
    const hubId = hub.id;

    console.log(`Using user: ${user.email}`);
    console.log(`Using hub: ${hub.name}`);

    // Financial Accounts
    const accountData = [
      {
        id: crypto.randomUUID(),
        name: "Main Checking Account",
        type: "checking",
        initialBalance: 5000,
      },
      {
        id: crypto.randomUUID(),
        name: "Emergency Savings",
        type: "savings",
        initialBalance: 10000,
      },
      {
        id: crypto.randomUUID(),
        name: "Credit Card Account",
        type: "credit-card",
        initialBalance: -500,
      },
      {
        id: crypto.randomUUID(),
        name: "Cash Wallet",
        type: "cash",
        initialBalance: 200,
      },
    ];

    await db.insert(financialAccounts).values(
      accountData.map((a) => ({
        id: a.id,
        userId,
        hubId,
        name: a.name,
        type: a.type as AccountType,
        initialBalance: a.initialBalance,
        iban: "",
        note: `${a.type} account`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );

    console.log("Financial accounts created (4 total)");

    // Transaction Categories
    const categoryNames = [
      "Groceries",
      "Transport",
      "Entertainment",
      "Utilities",
      "Dining",
      "Shopping",
      "Healthcare",
      "Salary",
      "Rent",
      "Insurance",
    ];

    const categories = categoryNames.map((name) => ({
      id: crypto.randomUUID(),
      hubId,
      name: name.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(transactionCategories).values(categories);
    console.log("Transaction categories created (10)");

    const categoryMap = Object.fromEntries(
      categoryNames.map((name, i) => [name, categories[i].id]),
    );

    // Transactions (30 days)
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const checkingAccountId = accountData.find(
      (a) => a.type === "checking",
    )!.id;

    const pattern = [
      { category: "Groceries", amount: 100, freq: 2 },
      { category: "Transport", amount: 40, freq: 4 },
      { category: "Entertainment", amount: 60, freq: 3 },
      { category: "Dining", amount: 50, freq: 3 },
      { category: "Salary", amount: 3000, freq: 2, type: "income" },
      { category: "Rent", amount: 1500, freq: 1 },
    ];

    let txCount = 0;
    for (const p of pattern) {
      const type = p.type || "expense";
      const interval = Math.floor(30 / p.freq);
      for (let i = 0; i < p.freq; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i * interval);
        await db.insert(transactions).values({
          id: crypto.randomUUID(),
          financialAccountId: checkingAccountId,
          hubId,
          userId,
          transactionCategoryId: categoryMap[p.category],
          type: type as "income" | "expense",
          source: `${p.category}`,
          amount: p.amount,
          note: `${p.category} ${type}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        txCount++;
      }
    }
    console.log(`Transactions created (${txCount} over 30 days)`);

    // Budgets
    const budgetsData = [
      { category: "Groceries", allocated: 400, spent: 350 },
      { category: "Transport", allocated: 200, spent: 150 },
      { category: "Entertainment", allocated: 300, spent: 240 },
      { category: "Dining", allocated: 300, spent: 280 },
    ];

    await db.insert(budgets).values(
      budgetsData.map((b) => ({
        id: crypto.randomUUID(),
        hubId,
        userId,
        transactionCategoryId: categoryMap[b.category],
        allocatedAmount: b.allocated,
        spentAmount: b.spent,
        warningPercentage: 80,
        markerColor:
          b.spent / b.allocated > 0.8
            ? "red"
            : b.spent / b.allocated > 0.6
              ? "orange"
              : "green",
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
    console.log("Budgets created (4)");

    // Saving Goals
    const goalData = [
      {
        name: "Emergency Fund",
        goalAmount: 10000,
        amountSaved: 3500,
        monthlyAllocation: 500,
      },
      {
        name: "Vacation Fund",
        goalAmount: 5000,
        amountSaved: 1200,
        monthlyAllocation: 300,
      },
    ];

    await db.insert(savingGoals).values(
      goalData.map((g) => ({
        id: crypto.randomUUID(),
        hubId,
        userId,
        name: g.name,
        goalAmount: g.goalAmount,
        amountSaved: g.amountSaved,
        monthlyAllocation: g.monthlyAllocation,
        dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );

    console.log("Saving goals created (2)");

    // Quick Tasks
    const tasks = [
      "Review monthly budget",
      "Pay rent",
      "Update savings tracker",
      "Plan vacation expenses",
    ];

    await db.insert(quickTasks).values(
      tasks.map((name, i) => ({
        id: crypto.randomUUID(),
        userId,
        hubId,
        name,
        checked: i % 2 === 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );

    console.log("Quick tasks created (4)");

    console.log("\n========================================");
    console.log("Database seeding complete!");
    console.log("========================================\n");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await pool.end();
  }
}

main();

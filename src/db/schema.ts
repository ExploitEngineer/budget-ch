import {
  pgTable,
  text,
  varchar,
  doublePrecision,
  primaryKey,
  timestamp,
  boolean,
  uuid,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const accessRole = pgEnum("access_role", ["admin", "member"]);

export const transactionType = pgEnum("transaction_type", [
  "income",
  "expense",
]);
export const accountType = pgEnum("account_type", [
  "checking",
  "savings",
  "credit-card",
  "cash",
]);

export const BudgetColorMakerType = pgEnum("budgets_type", [
  "standard",
  "green",
  "orange",
  "red",
]);

export type QuickTask = InferSelectModel<typeof quickTasks>;

/* AUTH SCHEMAS */

export type UserType = InferSelectModel<typeof users>;

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const hubs = pgTable("hubs", {
  id: uuid().notNull().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const hubMembers = pgTable(
  "hub_members",
  {
    hubId: uuid("hub_id")
      .notNull()
      .references(() => hubs.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessRole: accessRole().notNull().default("member"),
    isOwner: boolean("is_owner").default(true).notNull(),
    joinedAt: timestamp(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.hubId] })],
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const financialAccounts = pgTable("financial_accounts", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hubs.id, { onDelete: "cascade" }),
  name: text("account_name").notNull(),
  type: accountType().notNull().default("cash"),
  initialBalance: doublePrecision("initial_balance").notNull().default(0),
  iban: varchar("iban", { length: 34 }),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const transactionCategories = pgTable("transaction_categories", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  financialAccountId: uuid("financial_account_id")
    .notNull()
    .references(() => financialAccounts.id, { onDelete: "cascade" }),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hubs.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  transactionCategoryId: uuid("transaction_category_id")
    .notNull()
    .references(() => transactionCategories.id, { onDelete: "cascade" }),
  addedAt: timestamp("transaction_added_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  accountType: accountType().notNull().default("cash"),
  type: transactionType().notNull().default("income"),
  source: text("source"),
  amount: doublePrecision("amount").notNull().default(0),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const budgets = pgTable("budgets", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hubs.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  transactionCategoryId: uuid("transaction_category_id")
    .notNull()
    .references(() => transactionCategories.id, { onDelete: "cascade" }),
  allocatedAmount: doublePrecision("allocated_amount").notNull().default(0),
  spentAmount: doublePrecision("spent_amount").notNull().default(0),
  warningPercentage: integer("warning_percentage").notNull(),
  markerColor: text("marker_color").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const savingGoals = pgTable("saving_goals", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hubs.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("saving_goal_name").notNull(),
  goalAmount: doublePrecision("goal_amount").notNull().default(0),
  amountSaved: doublePrecision("amount_saved").notNull().default(0),
  monthlyAllocation: doublePrecision("monthly_allocation").notNull().default(0),
  accountType: accountType().notNull().default("cash"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const quickTasks = pgTable("quick_tasks", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  checked: boolean().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const accountTransfers = pgTable("account_transfers", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  financialAccountId: uuid("financial_account_id")
    .notNull()
    .references(() => financialAccounts.id, { onDelete: "cascade" }),
  sourceAccount: accountType().notNull(),
  destinationAccount: accountType().notNull(),
  note: text("note"),
  transferAmount: doublePrecision("transfer_amount").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

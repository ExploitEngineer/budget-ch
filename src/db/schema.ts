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
  "transfer",
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

export const subscriptionPlanValues = ["individual", "family"] as const;
export type SubscriptionPlan = (typeof subscriptionPlanValues)[number];
export const subscriptionPlanEnum = pgEnum(
  "subscription_plan",
  subscriptionPlanValues,
);

export const subscriptionStatusValues = [
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "trialing",
  "unpaid",
] as const;
export type SubscriptionStatus = (typeof subscriptionStatusValues)[number];
export const subscriptionStatusEnum = pgEnum(
  "subscription_status",
  subscriptionStatusValues,
);

export type QuickTask = InferSelectModel<typeof quickTasks>;
export type UserType = InferSelectModel<typeof users>;

/* AUTH SCHEMAS START */

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

/* AUTH SCHEMAS END */

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 })
    .notNull()
    .unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
  subscriptionPlan: subscriptionPlanEnum().notNull().default("individual"),
  status: subscriptionStatusEnum().notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start", {
    withTimezone: true,
  }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", {
    withTimezone: true,
  }).notNull(),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  cancelAt: timestamp("cancel_at", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type SubscriptionType = InferSelectModel<typeof subscriptions>;

export const hubs = pgTable("hubs", {
  id: uuid().notNull().primaryKey().defaultRandom(),
  // Owner User ID
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
    isOwner: boolean("is_owner").default(false).notNull(),
    joinedAt: timestamp(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.hubId] })],
);

export const hubInvitations = pgTable("hub_invitations", {
  id: uuid().primaryKey().defaultRandom(),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hubs.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: accessRole().notNull().default("member"),
  token: text("token").notNull(),
  accepted: boolean("accepted").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const financialAccounts = pgTable("financial_accounts", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hubs.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
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

// TODO Add the userId to track who created the category
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

export const recurringTransactionTemplates = pgTable(
  "recurring_transaction_templates",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => hubs.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Transaction related fields
    financialAccountId: uuid("financial_account_id")
      .notNull()
      .references(() => financialAccounts.id, { onDelete: "cascade" }),
    transactionCategoryId: uuid("transaction_category_id").references(
      () => transactionCategories.id,
      { onDelete: "set null" },
    ),
    type: transactionType().notNull().default("income"),
    source: text("source"),
    amount: doublePrecision("amount").notNull().default(0),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    // Recurrence related fields
    frequencyDays: integer("frequency_days").notNull().default(30),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    // Null for infinite recurrence
    endDate: timestamp("end_date", { withTimezone: true }),
    status: text("status", { enum: ['active', 'inactive'] }).notNull().default('active'),
  },
);

export type RecurringTransactionTemplateType = InferSelectModel<typeof recurringTransactionTemplates>;

// If you update the transactions table, update the recurringTransactionTemplates table accordingly.
export const transactions = pgTable("transactions", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hubs.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  financialAccountId: uuid("financial_account_id")
    .notNull()
    .references(() => financialAccounts.id, { onDelete: "cascade" }),
  destinationAccountId: uuid("destination_account_id").references(
    () => financialAccounts.id,
    { onDelete: "cascade" },
  ),
  transactionCategoryId: uuid("transaction_category_id").references(
    () => transactionCategories.id,
    { onDelete: "set null" },
  ),
  type: transactionType().notNull().default("income"),
  recurringTemplateId: uuid("recurring_template_id").references(
    () => recurringTransactionTemplates.id,
    { onDelete: "set null" },
  ),
  source: text("source"),
  amount: doublePrecision("amount").notNull().default(0),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  transactionCategoryId: uuid("transaction_category_id").references(
    () => transactionCategories.id,
    { onDelete: "set null" },
  ),
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
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("saving_goal_name").notNull(),
  goalAmount: doublePrecision("goal_amount").notNull().default(0),
  amountSaved: doublePrecision("amount_saved").notNull().default(0),
  monthlyAllocation: doublePrecision("monthly_allocation").notNull().default(0),
  financialAccountId: uuid("financial_account_id").references(
    () => financialAccounts.id,
    { onDelete: "set null" },
  ),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const quickTasks = pgTable("quick_tasks", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hubs.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  checked: boolean().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  householdSize: text("household_size"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type UserSettingsType = InferSelectModel<typeof userSettings>;

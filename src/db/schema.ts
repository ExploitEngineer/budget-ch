import {
  pgTable,
  text,
  varchar,
  numeric,
  doublePrecision,
  primaryKey,
  timestamp,
  boolean,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

export const accessRole = pgEnum("access_role", ["admin", "member"]);
export const accountType = pgEnum("account_type", [
  "checking",
  "savings",
  "credit-card",
  "cash",
]);
export const transactionType = pgEnum("transaction_type", [
  "income",
  "expense",
]);

/* AUTH SCHEMAS */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
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

export const hub_members = pgTable(
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
    joinedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
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

export const financial_accounts = pgTable("financial_accounts", {
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
});

export const transactions = pgTable(
  "transactions",
  {
    financialAccountId: uuid("financial_account_id")
      .notNull()
      .references(() => financial_accounts.id),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => hubs.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    transactionCategoryId: uuid("transaction_category_id")
      .notNull()
      .references(() => transaction_categories.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    type: transactionType().notNull().default("income"),
    source: text("source").notNull(),
    addedAt: timestamp("transaction_added_at"),
    note: text("note").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.transactionCategoryId] }),
  ],
);

export const transaction_categories = pgTable("transaction_categories", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  name: text("name").notNull(),
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

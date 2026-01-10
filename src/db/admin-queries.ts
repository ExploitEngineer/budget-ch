import db from "./db";
import {
  users,
  subscriptions,
  adminInvitations,
  adminAuditLogs,
  hubs,
  hubMembers,
  financialAccounts,
  transactions,
  transactionCategories,
  budgets,
  budgetInstances,
  savingGoals,
  quickTasks,
  notifications,
  userSettings,
  recurringTransactionTemplates,
  sessions,
  accounts,
  verifications,
  twoFactor,
  hubInvitations,
} from "./schema";
import type {
  UserType,
  SubscriptionType,
  AdminInvitation,
  AdminAuditLog,
  AdminActionType,
} from "./schema";
import { eq, desc, sql, inArray, and, or, ilike, count } from "drizzle-orm";

// ============================================
// USER MANAGEMENT QUERIES
// ============================================

export interface UserWithSubscription extends UserType {
  subscription: SubscriptionType | null;
}

export interface GetUsersFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export async function getAllUsersWithFiltersDB({
  search,
  page = 1,
  limit = 20,
}: GetUsersFilters = {}): Promise<{
  users: UserWithSubscription[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause;
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause = or(
        ilike(users.email, searchTerm),
        ilike(users.name, searchTerm),
        ilike(users.id, searchTerm),
      );
    }

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);
    const total = countResult?.count ?? 0;

    // Get paginated users
    const userResults = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get subscriptions for these users
    const userIds = userResults.map((u) => u.id);
    const userSubscriptions =
      userIds.length > 0
        ? await db
            .select()
            .from(subscriptions)
            .where(inArray(subscriptions.userId, userIds))
        : [];

    // Merge users with subscriptions
    const subscriptionMap = new Map(
      userSubscriptions.map((s) => [s.userId, s]),
    );
    const usersWithSubscription: UserWithSubscription[] = userResults.map(
      (user) => ({
        ...user,
        subscription: subscriptionMap.get(user.id) ?? null,
      }),
    );

    return {
      users: usersWithSubscription,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    console.error("Error fetching users with filters:", err);
    throw err;
  }
}

export async function getUserWithSubscriptionDB(
  userId: string,
): Promise<UserWithSubscription | null> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return null;

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    return {
      ...user,
      subscription: subscription ?? null,
    };
  } catch (err) {
    console.error("Error fetching user with subscription:", err);
    throw err;
  }
}

export async function lockUserDB(userId: string): Promise<UserType> {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ isLocked: true })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return updatedUser;
  } catch (err) {
    console.error("Error locking user:", err);
    throw err;
  }
}

export async function unlockUserDB(userId: string): Promise<UserType> {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ isLocked: false })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return updatedUser;
  } catch (err) {
    console.error("Error unlocking user:", err);
    throw err;
  }
}

export async function anonymizeUserDB(userId: string): Promise<void> {
  try {
    // Get user's hubs
    const userMemberships = await db.query.hubMembers.findMany({
      where: eq(hubMembers.userId, userId),
    });
    const hubIds = userMemberships.map((m) => m.hubId);

    // Get owned hubs
    const ownedHubs = await db.query.hubs.findMany({
      where: eq(hubs.userId, userId),
    });
    const ownedHubIds = ownedHubs.map((h) => h.id);
    const allHubIds = [...new Set([...hubIds, ...ownedHubIds])];

    // Start transaction
    await db.transaction(async (tx) => {
      // 1. Anonymize user profile
      await tx
        .update(users)
        .set({
          name: "Deleted (anonymized)",
          email: `deleted_${userId}@anonymized.local`,
          emailVerified: false,
          image: null,
          stripeCustomerId: null,
          twoFactorEnabled: false,
          language: "en",
          notificationsEnabled: false,
          reportFrequency: "off",
          isLocked: true,
        })
        .where(eq(users.id, userId));

      // 2. Delete user settings
      await tx.delete(userSettings).where(eq(userSettings.userId, userId));

      // 3. Delete sessions
      await tx.delete(sessions).where(eq(sessions.userId, userId));

      // 4. Delete OAuth accounts
      await tx.delete(accounts).where(eq(accounts.userId, userId));

      // 5. Delete two-factor
      await tx.delete(twoFactor).where(eq(twoFactor.userId, userId));

      // 6. Delete subscription
      await tx.delete(subscriptions).where(eq(subscriptions.userId, userId));

      // 7. Delete hub memberships (except owned hubs)
      await tx.delete(hubMembers).where(eq(hubMembers.userId, userId));

      // 8. Delete owned hubs and their data
      if (ownedHubIds.length > 0) {
        // Delete hub-related data (cascades should handle most, but be explicit)
        await tx.delete(hubs).where(inArray(hubs.id, ownedHubIds));
      }

      // 9. Set userId to null on transactions, budgets, etc. in non-owned hubs
      // This keeps the financial data but removes user association
      if (allHubIds.length > 0) {
        await tx
          .update(transactions)
          .set({ userId: null })
          .where(eq(transactions.userId, userId));

        await tx
          .update(budgets)
          .set({ userId: null })
          .where(eq(budgets.userId, userId));

        await tx
          .update(savingGoals)
          .set({ userId: null })
          .where(eq(savingGoals.userId, userId));

        await tx
          .update(quickTasks)
          .set({ userId: null })
          .where(eq(quickTasks.userId, userId));

        await tx
          .update(financialAccounts)
          .set({ userId: null })
          .where(eq(financialAccounts.userId, userId));

        await tx
          .update(recurringTransactionTemplates)
          .set({ userId: null })
          .where(eq(recurringTransactionTemplates.userId, userId));

        await tx
          .update(notifications)
          .set({ userId: null })
          .where(eq(notifications.userId, userId));
      }
    });
  } catch (err) {
    console.error("Error anonymizing user:", err);
    throw err;
  }
}

export async function deleteUserPermanentlyDB(userId: string): Promise<void> {
  try {
    // Delete user - cascades should handle related data
    await db.delete(users).where(eq(users.id, userId));
  } catch (err) {
    console.error("Error deleting user permanently:", err);
    throw err;
  }
}

// ============================================
// ADMIN INVITATION QUERIES
// ============================================

export interface CreateAdminInvitationInput {
  email: string;
  role: "user" | "root_admin";
  subscriptionPlan?: string | null;
  subscriptionMonths?: number | null;
  token: string;
  expiresAt: Date;
  createdBy: string;
}

export async function createAdminInvitationDB(
  input: CreateAdminInvitationInput,
): Promise<AdminInvitation> {
  try {
    const [invitation] = await db
      .insert(adminInvitations)
      .values({
        email: input.email,
        role: input.role,
        subscriptionPlan: input.subscriptionPlan,
        subscriptionMonths: input.subscriptionMonths,
        token: input.token,
        expiresAt: input.expiresAt,
        createdBy: input.createdBy,
      })
      .returning();

    return invitation;
  } catch (err) {
    console.error("Error creating admin invitation:", err);
    throw err;
  }
}

export async function getAdminInvitationByTokenDB(
  token: string,
): Promise<AdminInvitation | null> {
  try {
    const invitation = await db.query.adminInvitations.findFirst({
      where: eq(adminInvitations.token, token),
    });
    return invitation ?? null;
  } catch (err) {
    console.error("Error fetching admin invitation by token:", err);
    throw err;
  }
}

export async function markInvitationAcceptedDB(
  invitationId: string,
): Promise<AdminInvitation> {
  try {
    const [updated] = await db
      .update(adminInvitations)
      .set({ accepted: true })
      .where(eq(adminInvitations.id, invitationId))
      .returning();

    if (!updated) {
      throw new Error("Invitation not found");
    }

    return updated;
  } catch (err) {
    console.error("Error marking invitation as accepted:", err);
    throw err;
  }
}

export async function getAdminInvitationsDB(): Promise<AdminInvitation[]> {
  try {
    const invitations = await db.query.adminInvitations.findMany({
      orderBy: desc(adminInvitations.createdAt),
    });
    return invitations;
  } catch (err) {
    console.error("Error fetching admin invitations:", err);
    throw err;
  }
}

// ============================================
// AUDIT LOG QUERIES
// ============================================

export interface CreateAuditLogInput {
  action: AdminActionType;
  affectedUserId?: string | null;
  adminId: string;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function createAuditLogDB(
  input: CreateAuditLogInput,
): Promise<AdminAuditLog> {
  try {
    const [log] = await db
      .insert(adminAuditLogs)
      .values({
        action: input.action,
        affectedUserId: input.affectedUserId,
        adminId: input.adminId,
        reference: input.reference,
        metadata: input.metadata,
      })
      .returning();

    return log;
  } catch (err) {
    console.error("Error creating audit log:", err);
    throw err;
  }
}

export interface GetAuditLogsFilters {
  search?: string;
  action?: AdminActionType;
  page?: number;
  limit?: number;
}

export interface AuditLogWithAdmin extends AdminAuditLog {
  admin: { id: string; name: string; email: string } | null;
  affectedUser: { id: string; name: string; email: string } | null;
}

export async function getAuditLogsWithFiltersDB({
  search,
  action,
  page = 1,
  limit = 20,
}: GetAuditLogsFilters = {}): Promise<{
  logs: AuditLogWithAdmin[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const offset = (page - 1) * limit;

    // Build where clause
    const conditions: any[] = [];

    if (action) {
      conditions.push(eq(adminAuditLogs.action, action));
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(adminAuditLogs.affectedUserId, searchTerm),
          ilike(adminAuditLogs.reference, searchTerm),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(adminAuditLogs)
      .where(whereClause);
    const total = countResult?.count ?? 0;

    // Get paginated logs
    const logs = await db
      .select()
      .from(adminAuditLogs)
      .where(whereClause)
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get admin and affected user details
    const adminIds = [...new Set(logs.map((l) => l.adminId))];
    const affectedUserIds = [
      ...new Set(logs.map((l) => l.affectedUserId).filter(Boolean) as string[]),
    ];
    const allUserIds = [...new Set([...adminIds, ...affectedUserIds])];

    const userDetails =
      allUserIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
            })
            .from(users)
            .where(inArray(users.id, allUserIds))
        : [];

    const userMap = new Map(userDetails.map((u) => [u.id, u]));

    const logsWithDetails: AuditLogWithAdmin[] = logs.map((log) => ({
      ...log,
      admin: userMap.get(log.adminId) ?? null,
      affectedUser: log.affectedUserId
        ? userMap.get(log.affectedUserId) ?? null
        : null,
    }));

    return {
      logs: logsWithDetails,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    throw err;
  }
}

export async function getAllAuditLogsForExportDB(filters?: {
  search?: string;
  action?: AdminActionType;
}): Promise<AuditLogWithAdmin[]> {
  try {
    const conditions: any[] = [];

    if (filters?.action) {
      conditions.push(eq(adminAuditLogs.action, filters.action));
    }

    if (filters?.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(adminAuditLogs.affectedUserId, searchTerm),
          ilike(adminAuditLogs.reference, searchTerm),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db
      .select()
      .from(adminAuditLogs)
      .where(whereClause)
      .orderBy(desc(adminAuditLogs.createdAt));

    // Get user details
    const adminIds = [...new Set(logs.map((l) => l.adminId))];
    const affectedUserIds = [
      ...new Set(logs.map((l) => l.affectedUserId).filter(Boolean) as string[]),
    ];
    const allUserIds = [...new Set([...adminIds, ...affectedUserIds])];

    const userDetails =
      allUserIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
            })
            .from(users)
            .where(inArray(users.id, allUserIds))
        : [];

    const userMap = new Map(userDetails.map((u) => [u.id, u]));

    return logs.map((log) => ({
      ...log,
      admin: userMap.get(log.adminId) ?? null,
      affectedUser: log.affectedUserId
        ? userMap.get(log.affectedUserId) ?? null
        : null,
    }));
  } catch (err) {
    console.error("Error fetching audit logs for export:", err);
    throw err;
  }
}

// ============================================
// KPI QUERIES
// ============================================

export interface KPIStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  subscriptionsByPlan: {
    individual: number;
    family: number;
  };
  mrr: number;
  previousMrr: number;
}

export async function getKPIStatsDB(): Promise<KPIStats> {
  try {
    // Total users
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users);
    const totalUsers = totalUsersResult?.count ?? 0;

    // Blocked users
    const [blockedUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isLocked, true));
    const blockedUsers = blockedUsersResult?.count ?? 0;

    // Active users (users who have logged in - have sessions)
    const [activeUsersResult] = await db
      .select({ count: sql<number>`count(distinct ${sessions.userId})` })
      .from(sessions);
    const activeUsers = activeUsersResult?.count ?? 0;

    // Total subscriptions
    const [totalSubscriptionsResult] = await db
      .select({ count: count() })
      .from(subscriptions);
    const totalSubscriptions = totalSubscriptionsResult?.count ?? 0;

    // Active subscriptions
    const [activeSubscriptionsResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));
    const activeSubscriptions = activeSubscriptionsResult?.count ?? 0;

    // Subscriptions by plan
    const [individualResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, "active"),
          eq(subscriptions.subscriptionPlan, "individual"),
        ),
      );
    const individualCount = individualResult?.count ?? 0;

    const [familyResult] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, "active"),
          eq(subscriptions.subscriptionPlan, "family"),
        ),
      );
    const familyCount = familyResult?.count ?? 0;

    // MRR calculation (simplified - would need actual price data from Stripe)
    // For now, estimate based on subscription counts
    // Individual: ~9.90 CHF/month, Family: ~14.90 CHF/month
    const individualMrr = individualCount * 9.9;
    const familyMrr = familyCount * 14.9;
    const mrr = individualMrr + familyMrr;

    // Previous MRR (would need historical data - placeholder for now)
    const previousMrr = mrr * 0.95; // Placeholder: assume 5% growth

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      totalSubscriptions,
      activeSubscriptions,
      subscriptionsByPlan: {
        individual: individualCount,
        family: familyCount,
      },
      mrr: Math.round(mrr * 100) / 100,
      previousMrr: Math.round(previousMrr * 100) / 100,
    };
  } catch (err) {
    console.error("Error fetching KPI stats:", err);
    throw err;
  }
}

// ============================================
// HELPER: Generate Reference ID
// ============================================

export function generateReferenceId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "REQ-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

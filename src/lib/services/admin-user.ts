"use server";

import { headers } from "next/headers";
import { requireRootAdmin } from "./admin-auth";
import {
  getAllUsersWithFiltersDB,
  getUserWithSubscriptionDB,
  lockUserDB,
  unlockUserDB,
  anonymizeUserDB,
  deleteUserPermanentlyDB,
  createAuditLogDB,
  generateReferenceId,
  type GetUsersFilters,
  type UserWithSubscription,
} from "@/db/admin-queries";
import { exportFullUserDataById } from "./admin-export";

// ============================================
// GET USERS
// ============================================

export async function getUsers(filters: GetUsersFilters = {}) {
  const hdrs = await headers();
  await requireRootAdmin(hdrs);

  return await getAllUsersWithFiltersDB(filters);
}

export async function getUser(userId: string): Promise<UserWithSubscription | null> {
  const hdrs = await headers();
  await requireRootAdmin(hdrs);

  return await getUserWithSubscriptionDB(userId);
}

// ============================================
// LOCK USER
// ============================================

export async function lockUser(userId: string) {
  const hdrs = await headers();
  const { userId: adminId } = await requireRootAdmin(hdrs);

  // Prevent admin from locking themselves
  if (userId === adminId) {
    return { success: false, message: "Cannot lock your own account" };
  }

  try {
    const user = await lockUserDB(userId);
    const reference = generateReferenceId();

    await createAuditLogDB({
      action: "user_locked",
      affectedUserId: userId,
      adminId,
      reference,
      metadata: { email: user.email },
    });

    return { success: true, message: "User locked successfully", data: user };
  } catch (err) {
    console.error("Error locking user:", err);
    return { success: false, message: `Failed to lock user: ${(err as Error).message}` };
  }
}

// ============================================
// UNLOCK USER
// ============================================

export async function unlockUser(userId: string) {
  const hdrs = await headers();
  const { userId: adminId } = await requireRootAdmin(hdrs);

  try {
    const user = await unlockUserDB(userId);
    const reference = generateReferenceId();

    await createAuditLogDB({
      action: "user_unlocked",
      affectedUserId: userId,
      adminId,
      reference,
      metadata: { email: user.email },
    });

    return { success: true, message: "User unlocked successfully", data: user };
  } catch (err) {
    console.error("Error unlocking user:", err);
    return { success: false, message: `Failed to unlock user: ${(err as Error).message}` };
  }
}

// ============================================
// ANONYMIZE USER
// ============================================

export async function anonymizeUser(userId: string) {
  const hdrs = await headers();
  const { userId: adminId } = await requireRootAdmin(hdrs);

  // Prevent admin from anonymizing themselves
  if (userId === adminId) {
    return { success: false, message: "Cannot anonymize your own account" };
  }

  try {
    // Get user info before anonymization for audit log
    const userBefore = await getUserWithSubscriptionDB(userId);
    if (!userBefore) {
      return { success: false, message: "User not found" };
    }

    await anonymizeUserDB(userId);
    const reference = generateReferenceId();

    await createAuditLogDB({
      action: "user_anonymized",
      affectedUserId: userId,
      adminId,
      reference,
      metadata: {
        originalEmail: userBefore.email,
        originalName: userBefore.name,
      },
    });

    return { success: true, message: "User anonymized successfully" };
  } catch (err) {
    console.error("Error anonymizing user:", err);
    return { success: false, message: `Failed to anonymize user: ${(err as Error).message}` };
  }
}

// ============================================
// DELETE USER PERMANENTLY
// ============================================

export async function deleteUserPermanently(userId: string) {
  const hdrs = await headers();
  const { userId: adminId } = await requireRootAdmin(hdrs);

  // Prevent admin from deleting themselves
  if (userId === adminId) {
    return { success: false, message: "Cannot delete your own account" };
  }

  try {
    // Get user info before deletion for audit log
    const userBefore = await getUserWithSubscriptionDB(userId);
    if (!userBefore) {
      return { success: false, message: "User not found" };
    }

    const reference = generateReferenceId();

    // Create audit log before deletion (since user will be gone)
    await createAuditLogDB({
      action: "user_deleted",
      affectedUserId: null, // User will be deleted
      adminId,
      reference,
      metadata: {
        deletedUserId: userId,
        deletedEmail: userBefore.email,
        deletedName: userBefore.name,
      },
    });

    await deleteUserPermanentlyDB(userId);

    return { success: true, message: "User deleted permanently" };
  } catch (err) {
    console.error("Error deleting user:", err);
    return { success: false, message: `Failed to delete user: ${(err as Error).message}` };
  }
}

// ============================================
// EXPORT USER DATA (GDPR)
// ============================================

export async function exportUserData(userId: string) {
  const hdrs = await headers();
  const { userId: adminId } = await requireRootAdmin(hdrs);

  try {
    const result = await exportFullUserDataById(userId);

    if (!result.success) {
      return result;
    }

    const reference = generateReferenceId();

    await createAuditLogDB({
      action: "user_exported",
      affectedUserId: userId,
      adminId,
      reference,
      metadata: { exportedAt: new Date().toISOString() },
    });

    return result;
  } catch (err) {
    console.error("Error exporting user data:", err);
    return { success: false, message: `Failed to export user data: ${(err as Error).message}` };
  }
}

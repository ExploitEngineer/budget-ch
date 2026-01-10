"use server";

import { auth } from "@/lib/auth/auth";
import type { UserType } from "@/db/schema";

export interface RootAdminContext {
  userId: string;
  user: UserType;
}

/**
 * Validates that the current session belongs to a admin user.
 * Throws an error if not authenticated or not a admin.
 */
export async function requireRootAdmin(
  headers: Headers,
): Promise<RootAdminContext> {
  const session = await auth.api.getSession({ headers });

  if (!session?.user) {
    throw new Error("Unauthorized: Not authenticated");
  }

  const user = session.user as UserType;

  if (user.role !== "admin") {
    throw new Error("Access denied: Root admin privileges required");
  }

  if (user.banned) {
    throw new Error("Access denied: Account is locked");
  }

  return {
    userId: user.id,
    user,
  };
}

/**
 * Checks if a user is a root admin without throwing.
 * Returns the admin context if valid, null otherwise.
 */
export async function isRootAdmin(
  headers: Headers,
): Promise<RootAdminContext | null> {
  try {
    return await requireRootAdmin(headers);
  } catch {
    return null;
  }
}

/**
 * Gets the current authenticated user's role.
 * Returns null if not authenticated.
 */
export async function getUserRole(
  headers: Headers,
): Promise<"user" | "admin" | null> {
  const session = await auth.api.getSession({ headers });

  if (!session?.user) {
    return null;
  }

  const user = session.user as UserType;
  return user.role;
}

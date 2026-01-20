import { auth } from "@/lib/auth/auth";
import { getHubMemberRoleDB, getOwnedHubDB } from "@/db/queries";
import { headers } from "next/headers";

/**
 * Validates that the current user has access to the specified hub
 * @param hubId - The hub ID to validate access for
 * @returns Object with success status, userId if successful, and appropriate status code
 */
export async function validateHubAccess(hubId: string): Promise<{
  success: boolean;
  userId?: string;
  message?: string;
  status?: number; // HTTP status code hint for callers
}> {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return { success: false, message: "Unauthorized", status: 401 };
    }

    const userId = session.user.id;

    // Verify user has access to this hub
    const hubMember = await getHubMemberRoleDB(userId, hubId);
    const ownedHub = await getOwnedHubDB(userId);

    // User has access if they are a member OR they own the hub
    const hasAccess = !!hubMember || ownedHub?.id === hubId;

    if (!hasAccess) {
      return {
        success: false,
        message: "You don't have access to this hub",
        status: 403,
      };
    }

    return { success: true, userId };
  } catch (err: any) {
    console.error("Error validating hub access:", err);
    // Transient errors (DB connection, timeout) should return 503 (Service Unavailable)
    // so clients know to retry, rather than 403 which implies permanent access denial
    return {
      success: false,
      message: err.message || "Service temporarily unavailable",
      status: 503,
    };
  }
}

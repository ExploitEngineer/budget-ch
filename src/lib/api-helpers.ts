import { auth } from "@/lib/auth/auth";
import { getHubMemberRoleDB, getOwnedHubDB } from "@/db/queries";
import { headers } from "next/headers";

/**
 * Validates that the current user has access to the specified hub
 * @param hubId - The hub ID to validate access for
 * @returns Object with success status and userId if successful
 */
export async function validateHubAccess(hubId: string): Promise<{
  success: boolean;
  userId?: string;
  message?: string;
}> {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });
    
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = session.user.id;

    // Verify user has access to this hub
    const hubMember = await getHubMemberRoleDB(userId, hubId);
    const ownedHub = await getOwnedHubDB(userId);

    if (!hubMember && ownedHub?.id !== hubId) {
      return {
        success: false,
        message: "You don't have access to this hub",
      };
    }

    return { success: true, userId };
  } catch (err: any) {
    console.error("Error validating hub access:", err);
    return {
      success: false,
      message: err.message || "Failed to validate hub access",
    };
  }
}

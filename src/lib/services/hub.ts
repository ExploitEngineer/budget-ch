"use server";

import {
  getHubsByUserDB,
  getFirstHubMemberDB,
  getOwnedHubDB,
  getHubMemberRoleDB,
  getHubSettingsDB,
  updateHubSettingsDB,
} from "@/db/queries";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { getContext } from "../auth/actions";
import { requireAdminRole } from "../auth/permissions";
import { getDefaultHubId } from "./hub-logic";

export interface Hub {
  id: string;
  name: string;
  budgetCarryOver: boolean;
  budgetEmailWarnings: boolean;
}

export interface GetHubsResponse {
  success: boolean;
  message?: string;
  data?: Hub[];
}

// GET Default Hub ID for Current User [Action]
export async function getDefaultHubIdAction(): Promise<{
  success: boolean;
  data?: string | null;
  message?: string;
}> {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return { success: false, message: "User not found" };
    }

    const userId = session.user.id;
    const defaultHubId = await getDefaultHubId(userId);

    return {
      success: true,
      data: defaultHubId,
    };
  } catch (error) {
    console.error("Error in getDefaultHubIdAction:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to get default hub",
    };
  }
}

// GET Hubs for Current User [Action]
export async function getHubs(): Promise<GetHubsResponse> {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return { success: false, message: "User not found" };
    }

    const userId = session.user.id;
    const result = await getHubsByUserDB(userId);

    if (!result.success) {
      return {
        success: false,
        message: result.message || "Failed to fetch hubs",
      };
    }

    return {
      success: true,
      message: "Hubs fetched successfully",
      data: result.data as Hub[],
    };
  } catch (error) {
    console.error("Error in getHubs service:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to fetch hubs",
    };
  }
}

// Validate Hub Access for Current User [Action]
export async function validateHubAccessAction(hubId: string): Promise<{
  success: boolean;
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

    // User has access if they are a member OR they own the hub
    const hasAccess = !!hubMember || ownedHub?.id === hubId;

    if (!hasAccess) {
      return {
        success: false,
        message: "You don't have access to this hub",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error validating hub access:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to validate hub access",
    };
  }
}

export async function getActiveHubIdCookieOptions(
  maxAge: number = 60 * 60 * 24 * 30,
): Promise<{
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  maxAge: number;
  path: string;
}> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAge,
    path: "/",
  };
}

export async function getHubSettings() {
  try {
    const hdrs = await headers();
    const { hubId } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    // The type returned by getHubSettingsDB is now explicitly handled in db/queries.ts
    // This function will simply return the result from the DB query.
    return await getHubSettingsDB(hubId);
  } catch (err: any) {
    console.error("Error in getHubSettings service:", err);
    return {
      success: false,
      message: err.message || "Unexpected server error",
    };
  }
}

export async function updateHubSettings(data: Partial<{
  budgetCarryOver: boolean;
  budgetEmailWarnings: boolean;
}>) {
  try {
    const hdrs = await headers();
    const { hubId, userRole } = await getContext(hdrs, false);

    if (!hubId) {
      return { success: false, message: "Missing hubId parameter." };
    }

    requireAdminRole(userRole);

    return await updateHubSettingsDB(hubId, data);
  } catch (err: any) {
    console.error("Error in updateHubSettings service:", err);
    return {
      success: false,
      message: err.message || "Unexpected server error",
    };
  }
}

"use server";

import { getHubsByUserDB, getFirstHubMemberDB, getOwnedHubDB } from "@/db/queries";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export interface Hub {
  id: string;
  name: string;
}

export interface GetHubsResponse {
  success: boolean;
  message?: string;
  data?: Hub[];
}

// Get user's default hub (owned hub or first member hub)
export async function getDefaultHubId(userId: string): Promise<string | null> {
  try {
    const hubMemberRow = await getFirstHubMemberDB(userId);
    const ownedHub = await getOwnedHubDB(userId);
    
    // Prefer member hub first, then owned hub
    return hubMemberRow?.hubId ?? ownedHub?.id ?? null;
  } catch (error) {
    console.error("Error getting default hub:", error);
    return null;
  }
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

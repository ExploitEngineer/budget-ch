"use server";

import { getHubsByUserDB } from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "@/lib/auth/actions";

export interface Hub {
  id: string;
  name: string;
}

export interface GetHubsResponse {
  success: boolean;
  message?: string;
  data?: Hub[];
}

// GET Hubs for Current User [Action]
export async function getHubs(): Promise<GetHubsResponse> {
  try {
    const hdrs = await headers();
    const { userId } = await getContext(hdrs, false);

    if (!userId) {
      return { success: false, message: "User not found" };
    }

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

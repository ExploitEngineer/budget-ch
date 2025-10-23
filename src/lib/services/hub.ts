"use server";

import { createHubDB } from "@/db/queries";

export async function createHub(userId: string, userName: string) {
  try {
    const hubId = await createHubDB(userId, userName);
    return {
      status: "success",
      message: `Hub created successfully for ${userName}`,
      data: { hubId },
    };
  } catch (err: any) {
    console.error("[Service] CreateHub failed:", err);
    return {
      status: "error",
      message: err.message || "Unexpected error creating hub",
    };
  }
}

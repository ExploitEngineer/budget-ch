"use server";

import { createHub } from "@/db/queries";

export async function CreateHub(userId: string, userName: string) {
  try {
    const hubId = await createHub(userId, userName);
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

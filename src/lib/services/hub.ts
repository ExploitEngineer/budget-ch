"use server";

import { createHub } from "@/db/queries";

export async function CreateHub(userId: string, userName: string) {
  try {
    const hubId = await createHub(userId, userName);
    return {
      msg: `Hub created for user:${userName} successfully`,
      status: "success",
      hubId,
    };
  } catch (err) {
    return {
      msg: `Error creating Hub for user:${userName}, ${err} `,
      status: "error",
    };
  }
}

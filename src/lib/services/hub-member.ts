"use server";

import { createHubMemberDB } from "@/db/queries";
import type { createHubMemberArgs } from "@/db/queries";

export async function createHubMember({
  userId,
  hubId,
  accessRole,
  isOwner,
  userName,
}: createHubMemberArgs) {
  try {
    await createHubMemberDB({ userId, hubId, accessRole, isOwner });
    return {
      message: `user:${userName} successfully added into Hub Member`,
      status: "success",
    };
  } catch (err) {
    return {
      message: `Error adding user:${userName} into Hub Member, ${err} `,
      status: "error",
    };
  }
}

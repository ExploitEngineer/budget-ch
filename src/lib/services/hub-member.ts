"use server";

import { createHubMember } from "@/db/queries";
import type { AccessRole } from "@/db/queries";

export async function CreateHubMember(
  userId: string,
  hubId: string,
  accessRole: AccessRole,
  isOwner: boolean,
  userName: string,
) {
  try {
    await createHubMember(userId, hubId, accessRole, isOwner);
    return {
      msg: `user:${userName} successfully added into Hub Member`,
      status: "success",
    };
  } catch (err) {
    return {
      msg: `Error adding user:${userName} into Hub Member, ${err} `,
      status: "error",
    };
  }
}

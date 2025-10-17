import db from "./db";
import { hubs, hub_members } from "./schema";

type AccessRole = "admin" | "member";
export type createHubMemberArgs = {
  userId: string;
  hubId: string;
  accessRole: AccessRole;
  isOwner: boolean;
  userName?: string;
};

export async function createHub(userId: string, userName: string) {
  try {
    const [hub] = await db
      .insert(hubs)
      .values({
        userId,
        name: `${userName}'s Hub`,
      })
      .returning({ id: hubs.id });

    return hub.id;
  } catch (err) {
    console.error("Error creating Hub: ", err);
    return null;
  }
}

export async function createHubMember({
  userId,
  hubId,
  accessRole,
  isOwner,
}: createHubMemberArgs) {
  try {
    await db.insert(hub_members).values({
      userId,
      hubId,
      accessRole,
      isOwner,
    });
  } catch (err) {
    console.error("Error creating Hub Member: ", err);
  }
}

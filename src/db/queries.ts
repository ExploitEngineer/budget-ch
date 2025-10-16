// Define all db related queries here
import db from "./db";
import { hubs, hub_members } from "./schema";

export type AccessRole = "admin" | "member";

export async function createHub(userId: string, userName: string) {
  try {
    const [hub] = await db
      .insert(hubs)
      .values({
        userId,
        name: userName + " " + "hub",
      })
      .returning({ id: hubs.id });

    return hub.id;
  } catch (err) {
    console.error("Error creating Hub: ", err);
    return null;
  }
}

export async function createHubMember(
  userId: string,
  hubId: string,
  accessRole: AccessRole,
  isOwner: boolean,
) {
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

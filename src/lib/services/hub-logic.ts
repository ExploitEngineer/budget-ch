import { getFirstHubMemberDB, getOwnedHubDB } from "@/db/queries";

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

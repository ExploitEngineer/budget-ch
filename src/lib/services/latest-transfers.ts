"use server";

import { getHubTransfersDB } from "@/db/queries";
import { getContext } from "@/lib/auth/actions";
import { headers } from "next/headers";
export async function getAccountTransfers(hubIdArg?: string) {
  try {
    const hdrs = await headers();
    const { hubId: sessionHubId } = await getContext(hdrs, false);

    const hubId = hubIdArg || sessionHubId;

    if (!hubId) {
      return {
        status: true,
        message: "No hub found.",
        data: [],
      };
    }

    const result = await getHubTransfersDB(hubId);

    return {
      status: result?.status ?? false,
      message: result?.message ?? "",
      data: result?.data ?? [],
    };
  } catch (err: any) {
    console.error("Error in getAccountTransfers:", err);
    return {
      status: false,
      message: err?.message || "Failed to fetch latest transfers",
      data: [],
    };
  }
}

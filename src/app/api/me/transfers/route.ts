import { getAccountTransfers } from "@/lib/services/latest-transfers";
import { apiError, apiSuccess } from "@/lib/api-response";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const transfers = await getAccountTransfers();

  if (!transfers.status) {
    return apiError({ message: transfers.message ?? "Failed to fetch transfers", status: 500 });
  }

  return apiSuccess({ data: transfers.data, message: transfers.message, status: 200 });
}

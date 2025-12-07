import { getTransactions } from "@/lib/services/transaction";
import { apiError, apiSuccess } from "@/lib/api-response";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hubId = searchParams.get("hub");
  if (!hubId) {
    return apiError({ message: "Hub ID is required", status: 400 });
  }
  const transactions = await getTransactions(hubId);
  if (!transactions.success) {
    return apiError({ message: transactions.message ?? "Failed to fetch transactions", status: 500 });
  }
  return apiSuccess({ data: transactions.data, status: 200 });
}
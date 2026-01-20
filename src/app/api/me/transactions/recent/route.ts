import { getRecentTransactions } from "@/lib/services/transaction";
import { apiError, apiSuccess } from "@/lib/api-response";
import { validateHubAccess } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hubId = searchParams.get("hub");
  
  if (!hubId) {
    return apiError({ message: "Hub ID is required", status: 400 });
  }
  
  const access = await validateHubAccess(hubId);
  if (!access.success) {
    return apiError({ message: access.message ?? "Access denied", status: access.status ?? 403 });
  }
  
  const transactions = await getRecentTransactions(hubId);
  
  if (!transactions.success) {
    return apiError({ message: transactions.message ?? "Failed to fetch recent transactions", status: 500 });
  }
  
  return apiSuccess({ data: transactions.data, status: 200 });
}

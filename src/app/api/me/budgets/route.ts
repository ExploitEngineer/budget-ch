import { getBudgets } from "@/lib/services/budget";
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
    return apiError({ message: access.message ?? "Access denied", status: 403 });
  }
  
  const budgets = await getBudgets();
  
  if (!budgets.success) {
    return apiError({ message: budgets.message ?? "Failed to fetch budgets", status: 500 });
  }
  
  return apiSuccess({ data: budgets.data, status: 200 });
}

import { getSavingGoalsSummary } from "@/lib/services/saving-goal";
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
  
  const summary = await getSavingGoalsSummary();
  
  if (!summary.success) {
    return apiError({ message: summary.message ?? "Failed to fetch saving goals summary", status: 500 });
  }
  
  return apiSuccess({ data: summary.data, status: 200 });
}

import { getSavingGoals } from "@/lib/services/saving-goal";
import { apiError, apiSuccess } from "@/lib/api-response";
import { validateHubAccess } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hubId = searchParams.get("hub");
  const limit = searchParams.get("limit");
  
  if (!hubId) {
    return apiError({ message: "Hub ID is required", status: 400 });
  }
  
  const access = await validateHubAccess(hubId);
  if (!access.success) {
    return apiError({ message: access.message ?? "Access denied", status: 403 });
  }
  
  const limitNum = limit ? parseInt(limit, 10) : undefined;
  const goals = await getSavingGoals(limitNum);
  
  if (!goals.success) {
    return apiError({ message: goals.message ?? "Failed to fetch saving goals", status: 500 });
  }
  
  return apiSuccess({ data: goals.data, status: 200 });
}

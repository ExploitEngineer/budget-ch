import { getTopCategories } from "@/lib/services/budget";
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
  
  const categories = await getTopCategories();
  
  if (!categories.success) {
    return apiError({ message: categories.message ?? "Failed to fetch top categories", status: 500 });
  }
  
  return apiSuccess({ data: categories.data, status: 200 });
}

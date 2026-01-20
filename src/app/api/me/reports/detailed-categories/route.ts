import { getDetailedCategories } from "@/lib/services/report";
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

  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const categories = await getDetailedCategories(hubId, from, to);

  if (!categories.success) {
    return apiError({ message: categories.message ?? "Failed to fetch detailed categories", status: 500 });
  }

  return apiSuccess({ data: categories.data, status: 200 });
}

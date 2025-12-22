import { getCategoriesByExpenses } from "@/lib/services/report";
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

  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const progress = await getCategoriesByExpenses(hubId, from, to);

  if (!progress.success) {
    return apiError({ message: progress.message ?? "Failed to fetch expense categories progress", status: 500 });
  }

  return apiSuccess({ data: progress.data, status: 200 });
}

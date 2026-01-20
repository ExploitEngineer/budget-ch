import { getBudgetsAmounts } from "@/lib/services/budget";
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

  const month = searchParams.get("month")
    ? parseInt(searchParams.get("month")!)
    : undefined;
  const year = searchParams.get("year")
    ? parseInt(searchParams.get("year")!)
    : undefined;

  const amounts = await getBudgetsAmounts(month, year, hubId);

  if (!amounts.success) {
    return apiError({ message: amounts.message ?? "Failed to fetch budget amounts", status: 500 });
  }

  return apiSuccess({ data: amounts.data, status: 200 });
}

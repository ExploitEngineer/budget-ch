import { getMonthlyReportAction } from "@/lib/services/report";
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
  
  const reports = await getMonthlyReportAction();
  
  if (!reports.success) {
    return apiError({ message: reports.message ?? "Failed to fetch monthly reports", status: 500 });
  }
  
  return apiSuccess({ data: reports.data, status: 200 });
}

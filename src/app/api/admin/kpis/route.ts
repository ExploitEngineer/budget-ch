import { getKPIStats } from "@/lib/services/admin-audit";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET() {
  try {
    const result = await getKPIStats();

    if (!result.success) {
      return apiError({ message: result.message ?? "Failed to fetch KPIs", status: 500 });
    }

    return apiSuccess({ data: result.data, status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("Access denied") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return apiError({ message, status });
  }
}

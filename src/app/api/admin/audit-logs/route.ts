import { getAuditLogs } from "@/lib/services/admin-audit";
import { apiError, apiSuccess } from "@/lib/api-response";
import type { AdminActionType } from "@/db/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const action = searchParams.get("action") as AdminActionType | undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const result = await getAuditLogs({ search, action, page, limit });

    return apiSuccess({ data: result, status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("Access denied") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return apiError({ message, status });
  }
}

import { exportAuditLogsCSV } from "@/lib/services/admin-audit";
import { apiError } from "@/lib/api-response";
import type { AdminActionType } from "@/db/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const action = searchParams.get("action") as AdminActionType | undefined;

    const result = await exportAuditLogsCSV({ search, action });

    if (!result.success || !result.data) {
      return apiError({ message: result.message ?? "Failed to export audit logs", status: 500 });
    }

    // Return as CSV file download
    return new Response(result.data, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("Access denied") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return apiError({ message, status });
  }
}

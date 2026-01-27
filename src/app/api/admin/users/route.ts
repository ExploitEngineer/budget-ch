import { getUsers } from "@/lib/services/admin-user";
import { apiError, apiSuccess } from "@/lib/api-response";
import type { GetUsersFilters } from "@/db/admin-queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") as GetUsersFilters["status"] | null;
    const plan = searchParams.get("plan") as GetUsersFilters["plan"] | null;
    const sort = searchParams.get("sort") as GetUsersFilters["sort"] | null;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const result = await getUsers({
      search,
      status: status ?? undefined,
      plan: plan ?? undefined,
      sort: sort ?? undefined,
      page,
      limit,
    });

    return apiSuccess({ data: result, status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("Access denied") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return apiError({ message, status });
  }
}

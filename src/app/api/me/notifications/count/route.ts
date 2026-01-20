import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { validateHubAccess } from "@/lib/api-helpers";
import { getUnreadNotificationCount } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hubId = searchParams.get("hub");

  if (!hubId) {
    return apiError({ message: "Hub ID is required", status: 400 });
  }

  const access = await validateHubAccess(hubId);
  if (!access.success) {
    return apiError({
      message: access.message ?? "Access denied",
      status: access.status ?? 403,
    });
  }

  const count = await getUnreadNotificationCount(hubId, access.userId);

  if (!count.success) {
    return apiError({
      message: count.message ?? "Failed to fetch unread notification count",
      status: 500,
    });
  }

  return apiSuccess({ data: { count: count.data ?? 0 }, status: 200 });
}

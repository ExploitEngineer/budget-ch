import { getTasks } from "@/lib/services/tasks";
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
  
  const tasks = await getTasks();
  
  if (!tasks.success) {
    return apiError({ message: tasks.message ?? "Failed to fetch tasks", status: 500 });
  }
  
  return apiSuccess({ data: tasks.data, status: 200 });
}

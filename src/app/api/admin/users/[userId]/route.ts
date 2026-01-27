import { getUser, deleteUserPermanently } from "@/lib/services/admin-user";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const user = await getUser(userId);

    if (!user) {
      return apiError({ message: "User not found", status: 404 });
    }

    return apiSuccess({ data: user, status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("Access denied") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return apiError({ message, status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const result = await deleteUserPermanently(userId);

    if (!result.success) {
      return apiError({ message: result.message, status: 400 });
    }

    return apiSuccess({ data: null, message: result.message, status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("Access denied") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return apiError({ message, status });
  }
}

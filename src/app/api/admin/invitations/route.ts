import { createAdminInvitation, getAdminInvitations } from "@/lib/services/admin-invitation";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET() {
  try {
    const result = await getAdminInvitations();

    if (!result.success) {
      return apiError({ message: result.message ?? "Failed to fetch invitations", status: 500 });
    }

    return apiSuccess({ data: result.data, status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("Access denied") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return apiError({ message, status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, role, subscriptionPlan, subscriptionMonths } = body;

    if (!email) {
      return apiError({ message: "Email is required", status: 400 });
    }

    if (!role || !["user", "admin"].includes(role)) {
      return apiError({ message: "Valid role is required (user or admin)", status: 400 });
    }

    const result = await createAdminInvitation({
      email,
      role,
      subscriptionPlan: subscriptionPlan ?? null,
      subscriptionMonths: subscriptionMonths ?? null,
    });

    if (!result.success) {
      return apiError({ message: result.message, status: 400 });
    }

    return apiSuccess({ data: result.data, message: result.message, status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("Access denied") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return apiError({ message, status });
  }
}

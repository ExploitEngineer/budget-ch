import { getFinancialAccounts } from "@/lib/services/financial-account";
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
  
  const accounts = await getFinancialAccounts();
  
  if (!accounts.status) {
    return apiError({ message: "Failed to fetch accounts", status: 500 });
  }
  
  return apiSuccess({ data: accounts.tableData, status: 200 });
}

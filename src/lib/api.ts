import ky from "ky";
import { ApiResponse } from "./api-response";
import { Transaction } from "./types/dashboard-types";

export const apiInstance = ky.create({
  // prefixUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api`,
});

export async function getTransactions(hubId: string) {
    const response = await apiInstance.get(`/api/me/transactions`, {
        searchParams: {
            hub: hubId
        }
    });
    const data = await response.json();
    return data as ApiResponse<Transaction[]>;
}
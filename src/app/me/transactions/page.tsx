import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { transactionKeys } from "@/lib/query-keys";
import TransactionsClient from "./_components/transactions-client";
import { getTransactions } from "@/lib/services/transaction";

interface TransactionsPageProps {
  searchParams: Promise<{ hub: string }>;
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const { hub: hubId } = await searchParams;

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: transactionKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getTransactions(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch transactions");
      }
      return res.data ?? [];
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransactionsClient />
    </HydrationBoundary>
  );
}

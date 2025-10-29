export const dynamic = "force-dynamic";

import { getTransactions } from "@/lib/services/transaction";
import TransactionsClient from "./_components/transactions-client";

export default async function TransactionsPage() {
  const { success, data } = await getTransactions();
  const transactions = success && data ? data : [];

  return <TransactionsClient transactions={transactions} />;
}

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { useExportCSV } from "@/hooks/use-export-csv";
import type { TransferData } from "@/app/me/accounts/_components/latest-transfers";
import { useDashboardStore } from "@/store/dashboard-store";
import { useBudgetStore } from "@/store/budget-store";
import { useSavingGoalStore } from "@/store/saving-goal-store";
import { getAccountTransfers } from "@/lib/services/latest-transfers";
import { useQuery } from "@tanstack/react-query";
import { getFinancialAccounts } from "@/lib/services/financial-account";
import { accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function DataPrivacy() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [transfers, setTransfers] = useState<TransferData[]>([]);

  const t = useTranslations(
    "main-dashboard.settings-page.data-privacy-section",
  );

  const { transactions } = useDashboardStore();
  const { budgets } = useBudgetStore();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const { data: accounts } = useQuery({
    queryKey: accountKeys.list(hubId),
    queryFn: async () => {
      const res = await getFinancialAccounts();
      if (!res.status) {
        throw new Error("Failed to fetch accounts");
      }
      return res.tableData ?? [];
    },
  });
  const { goals } = useSavingGoalStore();

  const { exportAllDataJSON } = useExportCSV();

  async function fetchTransfers(): Promise<void> {
    try {
      const result = await getAccountTransfers();

      if (!result) {
        throw new Error("Financial Account not found");
      }

      setTransfers((result.data as TransferData[]) || []);
    } catch (err: any) {
      console.error("Error fetching transfers:", err);
    }
  }

  useEffect((): void => {
    fetchTransfers();
  }, []);

  const handleAccountDelete = async (): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await authClient.deleteUser();

      if (error) {
        toast.error(error?.message || "Error deleting user");
        return;
      }

      router.push("/goodbye");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm">{t("labels.data-export.title")}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={(): void =>
                  exportAllDataJSON({
                    transactions,
                    budgets,
                    accounts,
                    goals,
                    transfers,
                  })
                }
                className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
              >
                {t("labels.data-export.buttons.json")}
              </Button>

              {/* Delete Account Dialog Trigger */}
              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={loading}
                    variant="outline"
                    className="cursor-pointer !bg-[#EF4444] text-white transition-all duration-300"
                  >
                    {t("labels.data-export.buttons.delete-account")}
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Confirm Account Deletion</DialogTitle>
                  </DialogHeader>

                  <p className="text-muted-foreground mb-4 text-sm">
                    Are you sure you want to delete your account? This action is
                    permanent and cannot be undone.
                  </p>

                  <DialogFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="cursor-pointer"
                      onClick={(): void => setConfirmOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="cursor-pointer bg-[#EF4444] text-white transition-all duration-300 dark:hover:bg-red-600"
                      onClick={handleAccountDelete}
                      disabled={loading}
                    >
                      {loading ? <Spinner /> : "Delete Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/ui/error-state";
import { transactionKeys } from "@/lib/query-keys";
import { getRecurringTransactionTemplates } from "@/lib/services/transaction";
import RecurringTemplatesTable from "./recurring-templates-table";
import type { RecurringTemplateWithDetails } from "@/lib/types/domain-types";
import { Info } from "lucide-react";

export default function RecurringTemplatesSection() {
  const t = useTranslations("main-dashboard.transactions-page.recurring-templates");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const queryClient = useQueryClient();

  const {
    data: templates,
    isLoading,
    error,
  } = useQuery<RecurringTemplateWithDetails[]>({
    queryKey: transactionKeys.recurringTemplates(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getRecurringTransactionTemplates(hubId, "all");
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch recurring templates");
      }
      return (res.data ?? []) as RecurringTemplateWithDetails[];
    },
    enabled: !!hubId,
  });

  const handleTemplateUpdated = () => {
    queryClient.invalidateQueries({
      queryKey: transactionKeys.recurringTemplates(hubId),
    });
  };

  return (
    <Card className="bg-blue-background dark:border-border-blue">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <Separator className="dark:bg-border-blue" />
      <CardContent className="pt-4">
        {/* Info message */}
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{t("info")}</span>
        </div>

        {error ? (
          <ErrorState
            onRetry={() =>
              queryClient.invalidateQueries({
                queryKey: transactionKeys.recurringTemplates(hubId),
              })
            }
          />
        ) : isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            {t("loading")}
          </div>
        ) : !templates || templates.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <RecurringTemplatesTable
            templates={templates}
            onTemplateUpdated={handleTemplateUpdated}
          />
        )}
      </CardContent>
    </Card>
  );
}

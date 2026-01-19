"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/ui/error-state";
import { transactionKeys } from "@/lib/query-keys";
import { getRecurringTransactionTemplates } from "@/lib/services/transaction";
import RecurringTemplatesTable from "./recurring-templates-table";
import type { RecurringTemplateWithDetails } from "@/lib/types/domain-types";
import { Info } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";

export default function RecurringTemplatesSection() {
  const t = useTranslations("main-dashboard.transactions-page.recurring-templates");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const queryClient = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);

  const {
    data: templates,
    isLoading,
    error,
  } = useQuery<RecurringTemplateWithDetails[]>({
    queryKey: transactionKeys.recurringTemplates(hubId, showArchived),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getRecurringTransactionTemplates(hubId, {
        statusFilter: 'all',
        includeArchived: showArchived,
      });
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch recurring templates");
      }
      return (res.data ?? []) as RecurringTemplateWithDetails[];
    },
    enabled: !!hubId,
  });

  const handleTemplateUpdated = () => {
    // Invalidate both archived and non-archived queries
    queryClient.invalidateQueries({
      queryKey: transactionKeys.recurringTemplates(hubId, true),
    });
    queryClient.invalidateQueries({
      queryKey: transactionKeys.recurringTemplates(hubId, false),
    });
  };

  return (
    <Card className="bg-blue-background dark:border-border-blue">
      <CardContent>
        {/* Info message */}
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{t("info")}</span>
        </div>

        {/* Show archived toggle */}
        <div className="mb-4 flex items-center gap-2">
          <Checkbox
            id="show-archived"
            checked={showArchived}
            onCheckedChange={(checked) => setShowArchived(checked === true)}
          />
          <label
            htmlFor="show-archived"
            className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t("show-archived")}
          </label>
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
          <div className="py-8 flex justify-center">
            <Spinner />
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

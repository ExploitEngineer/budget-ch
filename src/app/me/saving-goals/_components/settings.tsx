
"use client"
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { savingGoalKeys } from "@/lib/query-keys";
import { getSavingGoals } from "@/lib/api";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { exportSavingGoalsToCSV } from "@/lib/utils/export-csv";
import { toggleHubAutoAllocation } from "@/lib/services/saving-goal";

export function Settings() {
  const t = useTranslations(
    "main-dashboard.saving-goals-page.settings-section",
  );
  // Need common translator for CSV headers if they reuse "cards.tax-reserves..." keys
  const tCommon = useTranslations("main-dashboard.saving-goals-page");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  // State for toggles - Sync with URL
  const showOverfunded = searchParams.get("showOverfunded") !== "false";

  const { data: goals, refetch } = useQuery({
    queryKey: savingGoalKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) return [];
      const res = await getSavingGoals(hubId);
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const handleExport = () => {
    if (!goals || goals.length === 0) {
      toast.error("No goals to export");
      return;
    }

    exportSavingGoalsToCSV({
      goals: goals,
      t: tCommon,
    });

    toast.success("Savings goals exported to CSV");
  };

  // Calculate global auto-alloc state (if any goal is enabled, we consider the master switch ON?)
  // Or better: If ALL are enabled? User said "when enabled, it will look all monthly goals... if disabled, skip everything".
  // Let's rely on the any goal enabled check to determining the state.
  const isAutoAllocEnabled = goals?.some(g => g.autoAllocationEnabled) ?? false;

  const handleAutoAllocToggle = async (newValue: boolean) => {
    // Optimistic / Loading feedback could be added here
    toast.info(newValue ? "Enabling auto-allocation..." : "Disabling auto-allocation...");

    // We import this dynamically or assume it's imported (need to add import in next step or strictly here if possible)
    // To safe, I will add import in separate step or assume I can modify imports too. 
    // I already read the file, so I can do a separate tool call for import.
    // Here I update the logic.

    // Use the imported action (added in next tool call)
    const result = await toggleHubAutoAllocation(newValue);

    if (result.success) {
      toast.success(newValue ? "Auto-allocation enabled for all goals" : "Auto-allocation disabled");
      refetch(); // Refresh data to confirm DB update
    } else {
      toast.error("Failed to update settings");
    }
  };

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Button
            variant="outline"
            onClick={handleExport}
            className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
          >
            Export CSV
          </Button>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="flex flex-wrap items-center gap-4 pt-4">
          <Badge
            variant="outline"
            className="bg-badge-background dark:border-border-blue cursor-pointer rounded-full px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => handleAutoAllocToggle(!isAutoAllocEnabled)}
          >
            <div className="flex items-center gap-2 pointer-events-none">
              <Checkbox checked={isAutoAllocEnabled} />
              <span>{t("checkboxes.monthly")}</span>
            </div>
          </Badge>

          <Badge
            variant="outline"
            className="bg-badge-background dark:border-border-blue cursor-pointer rounded-full px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("showOverfunded", (!showOverfunded).toString());
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            <div className="flex items-center gap-2 pointer-events-none">
              <Checkbox checked={showOverfunded} />
              <span>{t("checkboxes.goals")}</span>
            </div>
          </Badge>
        </CardContent>
      </Card>
    </section>
  );
}

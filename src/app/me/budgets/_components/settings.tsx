"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";
import CreateBudgetDialog from "./create-budget-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hubKeys } from "@/lib/query-keys";
import { getHubSettings, updateHubSettings } from "@/lib/services/hub";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export function Settings() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const t = useTranslations(
    "main-dashboard.budgets-page.warning-section.settings",
  );

  const { data: settingsResult, isLoading } = useQuery({
    queryKey: hubKeys.settings(hubId),
    queryFn: () => getHubSettings(),
    enabled: !!hubId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<{ budgetCarryOver: boolean; budgetEmailWarnings: boolean }>) =>
      updateHubSettings(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: hubKeys.settings(hubId) });
        toast.success(t("messages.updated"));
      } else {
        toast.error(result.message || t("messages.error"));
      }
    },
    onError: (err: any) => {
      toast.error(err.message || t("messages.error"));
    },
  });

  const settings = settingsResult?.data;

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <CreateBudgetDialog variant="outline" text={t("button")} />
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="dark:border-border-blue bg-badge-background cursor-pointer rounded-full px-3 py-2"
            asChild
          >
            <label className="flex items-center gap-2">
              {isLoading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Checkbox
                  checked={settings?.budgetCarryOver ?? false}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ budgetCarryOver: !!checked })
                  }
                  disabled={updateSettingsMutation.isPending}
                />
              )}
              <span>{t("checkboxes.carry")}</span>
            </label>
          </Badge>
          <Badge
            variant="outline"
            className="dark:border-border-blue bg-badge-background cursor-pointer rounded-full px-3 py-2"
            asChild
          >
            <label className="flex items-center gap-2">
              {isLoading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Checkbox
                  checked={settings?.budgetEmailWarnings ?? false}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ budgetEmailWarnings: !!checked })
                  }
                  disabled={updateSettingsMutation.isPending}
                />
              )}
              <span>{t("checkboxes.e-mail")}</span>
            </label>
          </Badge>
        </CardContent>
      </Card>
    </section>
  );
}

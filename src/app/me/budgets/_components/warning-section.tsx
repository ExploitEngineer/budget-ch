"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { budgetKeys } from "@/lib/query-keys";
import { getBudgets } from "@/lib/services/budget";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function WarningSection() {
  const t = useTranslations("main-dashboard.budgets-page.warning-section");
  const commonT = useTranslations("common");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const { data: budgets, isLoading } = useQuery({
    queryKey: budgetKeys.list(hubId),
    queryFn: async () => {
      const res = await getBudgets();
      if (!res.success) throw new Error(res.message);
      return res.data ?? [];
    },
    enabled: !!hubId,
  });

  const warnings = budgets?.filter((b) => {
    const totalSpent = Number(b.calculatedSpentAmount ?? 0) + Number(b.spentAmount ?? 0);
    const allocated = Number(b.allocatedAmount ?? 0);
    // Warning triggers if total spent reaches the threshold percentage or is over budget
    const thresholdPercentage = b.warningPercentage ?? 80;
    const isOverBudget = allocated > 0 && totalSpent >= allocated;
    const isNearThreshold = allocated > 0 && totalSpent >= (allocated * thresholdPercentage) / 100;

    return isOverBudget || isNearThreshold;
  });

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Button
            variant="outline"
            className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
          >
            {t("button")}
          </Button>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className="flex flex-wrap items-center gap-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground italic">
              {t("loading")}
            </p>
          ) : warnings && warnings.length > 0 ? (
            warnings.map((w) => {
              const totalSpent = Number(w.calculatedSpentAmount ?? 0) + Number(w.spentAmount ?? 0);
              const allocated = Number(w.allocatedAmount ?? 0);
              const percent = allocated > 0 ? (totalSpent / allocated) * 100 : 0;
              const isOver = totalSpent >= allocated;
              return (
                <div
                  key={w.id}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-4 py-2",
                    isOver ? "border-[#9A4249]" : "border-[#9A6F42]",
                  )}
                >
                  <p className="text-sm">
                    {w.categoryName}: {percent.toFixed(0)}% ({commonT("currency")} {totalSpent})
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {t("no-warnings")}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ActiveGoalsData } from "./data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { mainFormSchema, MainFormValues } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ActiveGoalsSectionProps {
  activeGoalsData: ActiveGoalsData[];
}

export function ActiveGoalsSection({
  activeGoalsData,
}: ActiveGoalsSectionProps) {
  const t = useTranslations(
    "main-dashboard.saving-goals-page.active-goals-section",
  );
  return (
    <section>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <CardTitle className="truncate">{t("title")}</CardTitle>
            <Badge variant="outline" className="rounded-full px-3 py-2">
              {t("badge")}
            </Badge>
          </div>

          <ToggleGroup
            className="inline-flex flex-none items-center gap-1 rounded border"
            type="single"
            aria-label="view"
          >
            <ToggleGroupItem
              value="due"
              className="px-3 py-1 text-sm whitespace-nowrap"
            >
              {t("buttons.due")}
            </ToggleGroupItem>

            <ToggleGroupItem
              value="progress"
              className="px-3 py-1 text-sm whitespace-nowrap"
            >
              {t("buttons.progress")}
            </ToggleGroupItem>

            <ToggleGroupItem
              value="remaining-amount"
              className="px-3 py-1 text-sm"
            >
              <span className="inline-block max-w-[10rem] truncate">
                {t("buttons.remaining-amount")}
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-1 lg:grid-cols-3">
          {activeGoalsData.map((data, idx) => {
            const form = useForm<MainFormValues>({
              resolver: zodResolver(mainFormSchema) as any,
              defaultValues: { amount: undefined },
            });

            return (
              <Card key={idx}>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>{data.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-3 py-2">
                      {data.badgeValue}%
                    </Badge>
                    <Button>{t("cards.tax-reserves.header.button")}</Button>
                  </div>
                </CardHeader>

                <Separator />

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3>{t("cards.tax-reserves.content.goal")}</h3>
                      <p>CHF 5’000.00</p>
                    </div>
                    <div>
                      <h3>{t("cards.tax-reserves.content.goal")}</h3>
                      <p>CHF 5’000.00</p>
                    </div>
                    <div>
                      <h3>{t("cards.tax-reserves.content.goal")}</h3>
                      <p>CHF 5’000.00</p>
                    </div>
                    <div>
                      <h3>{t("cards.tax-reserves.content.goal")}</h3>
                      <p>CHF 5’000.00</p>
                    </div>
                  </div>

                  <Progress value={data.progress} className="mt-2 mb-3" />

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-3 py-2">
                      {t("cards.tax-reserves.content.account.title")}:{" "}
                      {data.accountBadge}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-2">
                      {t("cards.tax-reserves.content.auto")}: CHF 300.00
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-2">
                      {t("cards.tax-reserves.content.remaining")}:{" "}
                      {data.remainingBadgeDays}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Button className="flex cursor-pointer items-center gap-3">
                        <Plus />
                        <span>{t("cards.tax-reserves.content.button")}</span>
                      </Button>

                      <Form {...form}>
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem className="max-w-38">
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder={`${t(
                                    "cards.tax-reserves.content.placeholder",
                                  )} (CHF)`}
                                  step={0.5}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </Form>
                    </div>

                    <p className="text-sm">
                      {t("cards.tax-reserves.content.new-balance")}:{" "}
                      <span className="font-bold">CHF 660.00</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}

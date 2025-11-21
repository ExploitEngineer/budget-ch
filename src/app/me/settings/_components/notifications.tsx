"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { MainFormValues, mainFormSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

export function Notifications() {
  const form = useForm<MainFormValues>({
    resolver: zodResolver(mainFormSchema) as any,
    defaultValues: {
      select: "",
    },
  });
  const t = useTranslations(
    "main-dashboard.settings-page.notifications-section",
  );

  const emailAlertBadges: string[] = [
    t("labels.email-alerts.badges.budget"),
    t("labels.email-alerts.badges.budget-exceeded"),
    t("labels.email-alerts.badges.payment"),
  ];

  const pushBrowserBadges: string[] = [
    t("labels.push-browser.badges.new-transaction"),
    t("labels.push-browser.badges.savings"),
  ];
  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent>
          <div className="mb-5 grid grid-cols-2 gap-5">
            <div>
              <h3 className="mb-3 text-sm opacity-80">
                {t("labels.email-alerts.title")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {emailAlertBadges.map((badge) => (
                  <Badge
                    key={badge}
                    variant="outline"
                    className="dark:border-border-blue bg-badge-background rounded-full px-3 py-2"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm opacity-80">
                {t("labels.push-browser.title")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {pushBrowserBadges.map((badge) => (
                  <Badge
                    key={badge}
                    variant="outline"
                    className="dark:border-border-blue bg-badge-background rounded-full px-3 py-2"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Form {...form}>
            <FormField
              control={form.control}
              name="account"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-sm">
                    {t("labels.monthly-report.title")}
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="dark:border-border-blue !dark:bg-dark-blue-background w-full cursor-pointer">
                        <SelectValue
                          placeholder={t("labels.monthly-report.options.off")}
                        />
                      </SelectTrigger>
                      <SelectContent className="dark:!bg-dark-blue-background bg-white">
                        <SelectItem value="off">
                          {t("labels.monthly-report.options.off")}
                        </SelectItem>
                        <SelectItem value="monthly">
                          {t("labels.monthly-report.options.monthly")}
                        </SelectItem>
                        <SelectItem value="quarterly">
                          {t("labels.monthly-report.options.quarterly")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}

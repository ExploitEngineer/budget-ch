"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";

const billingDetailsSchema = z.object({
  billingName: z.string().min(1, { message: "Billing name is required" }),
  vatNo: z.string().optional(),
});

type BillingDetailsValues = z.infer<typeof billingDetailsSchema>;

export function BillingDetails() {
  const t = useTranslations(
    "main-dashboard.settings-page.billing-details-section",
  );

  const form = useForm<BillingDetailsValues>({
    resolver: zodResolver(billingDetailsSchema),
    defaultValues: {
      billingName: "",
      vatNo: "",
    },
  });

  const onSubmit = (values: BillingDetailsValues) => {
    // console.log("Billing details:", values);
  };

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="billingName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.billing-name.title")}</FormLabel>
                      <FormControl>
                        <Input
                          className="dark:border-border-blue !bg-dark-blue-background"
                          placeholder={t("labels.billing-name.placeholder")}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vatNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.vat-no.title")}</FormLabel>
                      <FormControl>
                        <Input
                          className="dark:border-border-blue !bg-dark-blue-background"
                          placeholder={t("labels.vat-no.placeholder")}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  className="dark:border-border-blue !bg-dark-blue-background"
                >
                  {t("buttons.test-invoice")}
                </Button>
                <Button
                  variant="outline"
                  type="submit"
                  className="btn-gradient cursor-pointer"
                >
                  {t("buttons.save-payment")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}

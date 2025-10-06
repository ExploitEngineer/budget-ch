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
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";

const anonymousOptions = ["on", "off"] as const;
const retentionOptions = ["delete-im", "30-days", "90-days"] as const;

const dataPrivacySchema = z.object({
  anonymous: z
    .string()
    .refine(
      (val) =>
        anonymousOptions.includes(val as (typeof anonymousOptions)[number]),
      {
        message: "Please select anonymous option",
      },
    ),
  retention: z
    .string()
    .refine(
      (val) =>
        retentionOptions.includes(val as (typeof retentionOptions)[number]),
      {
        message: "Please select retention option",
      },
    ),
});

type DataPrivacyValues = z.infer<typeof dataPrivacySchema>;

export function DataPrivacy() {
  const t = useTranslations(
    "main-dashboard.settings-page.data-privacy-section",
  );

  const form = useForm<DataPrivacyValues>({
    resolver: zodResolver(dataPrivacySchema),
    defaultValues: {
      anonymous: "off",
      retention: "delete-im",
    },
  });

  const onSubmit = (values: DataPrivacyValues) => {
    console.log("Data privacy settings:", values);
  };

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left column */}
                <div className="flex flex-col gap-6">
                  {/* Anonymous stats toggle */}
                  <FormField
                    control={form.control}
                    name="anonymous"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          {t("labels.anonymous.title")}
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue
                                placeholder={t("labels.anonymous.options.off")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="on">
                                {t("labels.anonymous.options.on")}
                              </SelectItem>
                              <SelectItem value="off">
                                {t("labels.anonymous.options.off")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data export actions */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm">{t("labels.data-export.title")}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline">
                        {t("labels.data-export.buttons.json")}
                      </Button>
                      <Button variant="destructive">
                        {t("labels.data-export.buttons.local-data")}
                      </Button>
                      <Button variant="secondary">
                        {t("labels.data-export.buttons.delete-account")}
                      </Button>
                    </div>
                    <p className="mt-2 text-sm opacity-80">{t("content")}</p>
                  </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                  <FormField
                    control={form.control}
                    name="retention"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          {t("labels.retention.title")}
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue
                                placeholder={t(
                                  "labels.retention.options.delete-im",
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="delete-im">
                                {t("labels.retention.options.delete-im")}
                              </SelectItem>
                              <SelectItem value="30-days">
                                {t("labels.retention.options.30-days")}
                              </SelectItem>
                              <SelectItem value="90-days">
                                {t("labels.retention.options.90-days")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}

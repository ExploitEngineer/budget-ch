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
import { MainFormValues, mainFormSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

export function Security() {
  const form = useForm<MainFormValues>({
    resolver: zodResolver(mainFormSchema) as any,
    defaultValues: {
      select: "",
    },
  });
  const t = useTranslations("main-dashboard.settings-page.security-section");

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent>
          <div className="mb-5 grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-6">
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="account"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-sm">
                        {t("labels.two-factor.title")}
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="dark:border-border-blue !bg-dark-blue-background w-[40%] cursor-pointer">
                            <SelectValue
                              placeholder={t("labels.two-factor.options.off")}
                            />
                          </SelectTrigger>
                          <SelectContent className="!bg-dark-blue-background">
                            <SelectItem value="off">
                              {t("labels.two-factor.options.off")}
                            </SelectItem>
                            <SelectItem value="monthly">
                              {t("labels.two-factor.options.totp-app")}
                            </SelectItem>
                            <SelectItem value="quarterly">
                              {t("labels.two-factor.options.email-code")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Form>

              <p className="text-sm opacity-80">
                {t("labels.two-factor.content")}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
                >
                  {t("labels.two-factor.buttons.show-backup-codes")}
                </Button>
                <Button
                  variant="outline"
                  className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
                >
                  {t("labels.two-factor.buttons.regenerate-backup-codes")}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <Form {...form}>
                <FormLabel>{t("labels.password.title")}</FormLabel>
              </Form>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
                >
                  {t("labels.password.buttons.change-password")}
                </Button>
                <Button
                  variant="outline"
                  className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
                >
                  {t("labels.password.buttons.reset-password")}
                </Button>
              </div>
              <p className="text-sm opacity-80">
                {t("labels.password.content")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

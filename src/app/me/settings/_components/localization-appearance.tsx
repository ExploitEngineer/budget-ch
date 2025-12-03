"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppearanceValues, appearanceSchema } from "@/lib/validations";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STORAGE_KEY = "budget-ch-user-preferences";

function savePreferencesLocally(preferences: AppearanceValues) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

function loadPreferencesLocally() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }
  return JSON.parse(stored) as AppearanceValues;
}

function getInitialDefaultValues() {
  const stored = loadPreferencesLocally();
  if (!stored) {
    return {
      language: "en" as const,
      currency: "chf" as const,
      theme: "auto" as const,
    };
  }
  return stored;
}

export function LocalizationAppearance() {
  const t = useTranslations("main-dashboard.settings-page.appearance-section");

  const form = useForm<AppearanceValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: getInitialDefaultValues(),
  });

  const onSubmit = (values: AppearanceValues) => {
    savePreferencesLocally(values);
    toast.success(t("messages.preferences-saved"));
  };

  return (
    <Card className="bg-blue-background dark:border-border-blue">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <Separator className="dark:bg-border-blue" />
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* First Row: Language, Currency, Theme */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.language.title")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="dark:border-border-blue !bg-dark-blue-background w-full">
                          <SelectValue
                            placeholder={t("labels.language.title")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.currency.title")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="dark:border-border-blue !bg-dark-blue-background w-full">
                          <SelectValue
                            placeholder={t("labels.currency.title")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chf">CHF</SelectItem>
                          <SelectItem value="eur">EUR</SelectItem>
                          <SelectItem value="usd">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.theme.title")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="dark:border-border-blue !bg-dark-blue-background w-full">
                          <SelectValue placeholder={t("labels.theme.title")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                className="btn-gradient cursor-pointer dark:text-white"
                disabled={form.formState.isSubmitting}
              >
                {t("buttons.save-preferences")}
              </Button>
            </div>

            {/* Content / Description */}
            {/* <p className="text-muted-foreground text-sm">{t("content")}</p> */}

            {/* Second Row: First Day, Density, Rounding */}
            {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="firstDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.first-day.title")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="dark:border-border-blue !bg-dark-blue-background w-full">
                          <SelectValue
                            placeholder={t("labels.first-day.title")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="density"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.density.title")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="dark:border-border-blue !bg-dark-blue-background w-full">
                          <SelectValue
                            placeholder={t("labels.density.title")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comfort">Comfort</SelectItem>
                          <SelectItem value="compact">Compact</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rounding"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.rounding.title")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="dark:border-border-blue !bg-dark-blue-background w-full">
                          <SelectValue
                            placeholder={t("labels.rounding.title")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5-rappen">5 Rappen</SelectItem>
                          <SelectItem value="1-rappen">1 Rappen</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div> */}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileHouseholdSchema,
  ProfileHouseholdValues,
} from "@/lib/validations";

export function ProfileHousehold() {
  const t = useTranslations(
    "main-dashboard.settings-page.profile-household-section",
  );

  const form = useForm<ProfileHouseholdValues>({
    resolver: zodResolver(profileHouseholdSchema),
    defaultValues: {
      name: "",
      email: "",
      householdSize: "single",
      subscriptionLocal: "free",
      address: "",
    },
  });

  const onSubmit = (values: ProfileHouseholdValues) => {
    console.log("Form submitted:", values);
  };

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge
            variant="outline"
            className="dark:border-border-blue bg-badge-background rounded-full px-3 py-2"
          >
            {t("badge")}
          </Badge>
        </CardHeader>
        <Separator className="dark:bg-[#1A2441]" />
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name & Email */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.name.title")}</FormLabel>
                      <FormControl>
                        <Input
                          className="dark:border-border-blue !bg-dark-blue-background"
                          placeholder={t("labels.name.placeholder")}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email.title")}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          className="dark:border-border-blue !bg-dark-blue-background"
                          placeholder={t("email.placeholder")}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Household Size & Subscription Local */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="householdSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("household-size.title")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="dark:border-border-blue !bg-dark-blue-background w-full cursor-pointer">
                            <SelectValue
                              placeholder={t("household-size.single")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">
                              {t("household-size.single")}
                            </SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5+">5+</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subscriptionLocal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("subscription-local.title")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="dark:border-border-blue !bg-dark-blue-background w-full cursor-pointer">
                            <SelectValue
                              placeholder={t("subscription-local.plans.free")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">
                              {t("subscription-local.plans.free")}
                            </SelectItem>
                            <SelectItem value="individual">
                              {t("subscription-local.plans.individual")}
                            </SelectItem>
                            <SelectItem value="family">
                              {t("subscription-local.plans.family")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("address.title")}</FormLabel>
                    <FormControl>
                      <Input
                        className="dark:border-border-blue !bg-dark-blue-background"
                        placeholder={t("address.placeholder")}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}

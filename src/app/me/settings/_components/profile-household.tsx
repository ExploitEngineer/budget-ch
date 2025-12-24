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
import { Button } from "@/components/ui/button";
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
import { useEffect, useState } from "react";
import { getUserSettings } from "@/lib/services/user";
import { updateProfileHouseholdAction } from "../actions";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import type { UserType, SubscriptionType } from "@/db/schema";
import { cn } from "@/lib/utils";

interface ProfileHouseholdProps {
  user: UserType;
  subscription: SubscriptionType | null;
}

export function ProfileHousehold({
  user,
  subscription,
}: ProfileHouseholdProps) {
  const t = useTranslations(
    "main-dashboard.settings-page.profile-household-section",
  );
  const tc = useTranslations("common");

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

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

  // Load user settings and populate form
  useEffect(() => {
    const loadData = async () => {
      try {
        const settingsResult = await getUserSettings();
        const userSettings = settingsResult.data;

        // Determine subscription display value
        const subscriptionValue = subscription?.subscriptionPlan ?? "free";

        form.reset({
          name: user.name,
          email: user.email,
          householdSize: userSettings?.householdSize ?? "single",
          subscriptionLocal: subscriptionValue,
          address: userSettings?.address ?? "",
        });
      } catch (err) {
        console.error("Error loading user settings:", err);
      } finally {
        setInitializing(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, user.name, user.email, subscription?.subscriptionPlan]);

  const onSubmit = async (values: ProfileHouseholdValues) => {
    setLoading(true);
    try {
      const result = await updateProfileHouseholdAction({
        name: values.name,
        householdSize: values.householdSize,
        address: values.address || null,
      });

      if (result.success) {
        toast.success(t("messages.update-success"));
      } else {
        toast.error(result.message || t("messages.update-error"));
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.error(err.message || t("messages.unexpected-error"));
    } finally {
      setLoading(false);
    }
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
            {subscription
              ? t(`subscription-local.plans.${subscription.subscriptionPlan}`)
              : t("subscription-local.plans.free")}
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
                          disabled
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
                          disabled
                        >
                          <SelectTrigger className="dark:border-border-blue !bg-dark-blue-background w-full cursor-not-allowed opacity-60">
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

              {/* Update Button */}
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  className={cn("cursor-pointer", "btn-gradient")}
                  type="submit"
                  disabled={loading || initializing}
                >
                  {loading ? (
                    <>
                      <Spinner className="mr-2" />
                      tc("updating")
                    </>
                  ) : (
                    tc("update")
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}

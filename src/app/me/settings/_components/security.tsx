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
import { getUserEmail } from "@/lib/services/user";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export function Security() {
  const form = useForm<MainFormValues>({
    resolver: zodResolver(mainFormSchema) as any,
    defaultValues: {
      select: "",
    },
  });
  const t = useTranslations("main-dashboard.settings-page.security-section");

  const [loading, setLoading] = useState<boolean>(false);

  const handleResetEmailSend = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await getUserEmail();

      if (!res.success) {
        toast.error(res.message || "Error fetching user email");
        return;
      }

      if (res?.data) {
        const userEmail = res.data.email;

        const { error } = await authClient.requestPasswordReset({
          email: userEmail,
          redirectTo: "/reset-password",
        });

        if (error) {
          toast.error(error.message);
        }
        toast.success("Password reset email sent");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
                          <SelectContent className="dark:!bg-dark-blue-background bg-white">
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
                  disabled={loading}
                  onClick={handleResetEmailSend}
                  className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
                >
                  {loading ? (
                    <Spinner />
                  ) : (
                    t("labels.password.buttons.reset-password")
                  )}
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

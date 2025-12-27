"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getUserForgotPasswordSchema,
  UserForgotPasswordValues,
} from "@/lib/validations/auth-validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { Spinner } from "../ui/spinner";

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const t = useTranslations("authpages");

  const form = useForm<UserForgotPasswordValues>({
    resolver: zodResolver(getUserForgotPasswordSchema(t)),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: UserForgotPasswordValues) {
    try {
      setIsLoading(true);

      const { error } = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: "/reset-password",
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t("messages.password-reset-sent"));
        form.reset();
      }
    } catch (err) {
      console.error("Reset password failed:", err);
      toast.error(t("messages.error-generic"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="dark:border-border-blue dark:bg-blue-background h-full w-full flex-1 border-1 bg-white p-6 shadow-lg sm:max-w-lg">
      <h1 className="text-center text-xl font-semibold">
        {t("forgot-password")}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("labels.email")}</FormLabel>
                <FormControl className="rounded-lg px-4 py-5">
                  <Input
                    type="email"
                    placeholder={t("placeholders.email")}
                    className="dark:border-border-blue dark:!bg-dark-blue-background bg-[#F6F8FF]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Buttons */}
          <div className="flex items-center justify-between gap-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex-1 cursor-pointer rounded-xl bg-[#235FE3] py-5 font-bold text-white hover:bg-blue-600 dark:bg-[#6371FF] dark:hover:bg-[#6371FF]/80"
            >
              {isLoading ? <Spinner /> : t("buttons.send-email")}
            </Button>
            <Link className="flex-1" href="/signin">
              <Button
                type="button"
                variant="outline"
                className="dark:border-border-blue !bg-dark-blue-background w-full cursor-pointer items-center gap-3 rounded-xl py-5 font-bold underline"
              >
                {t("buttons.back-to-signin")}
              </Button>
            </Link>
          </div>
        </form>
      </Form>
    </Card>
  );
}

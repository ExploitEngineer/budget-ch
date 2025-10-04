"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  userForgotPasswordSchema,
  UserForgotPasswordValues,
} from "@/lib/validations";
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

export default function ForgotPassword() {
  const form = useForm<UserForgotPasswordValues>({
    resolver: zodResolver(userForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const t = useTranslations("authpages");

  function onSubmit(values: UserForgotPasswordValues) {
    console.log("Submitted:", values);
  }

  return (
    <Card className="h-full w-full flex-1 border-1 p-6 shadow-lg sm:max-w-lg">
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
              className="w-full flex-1 cursor-pointer rounded-xl py-5 font-bold text-white dark:bg-blue-600"
            >
              {t("buttons.send-email")}
            </Button>
            <Link className="flex-1" href="/signin">
              <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer items-center gap-3 rounded-xl py-5 font-bold underline"
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

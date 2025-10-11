"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSignInSchema, UserSignInValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export default function SignIn() {
  const form = useForm<UserSignInValues>({
    resolver: zodResolver(userSignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const t = useTranslations("authpages");

  function onSubmit(values: UserSignInValues) {
    console.log("Submitted:", values);
  }

  return (
    <Card className="dark:border-border-blue dark:bg-blue-background h-full w-full flex-1 border-1 bg-white p-6 shadow-lg sm:max-w-lg">
      <h1 className="text-center text-xl font-semibold">{t("signin")}</h1>

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
                    className="dark:border-border-blue dark:!bg-dark-blue-background bg-[#F6F8FF]"
                    placeholder={t("placeholders.email")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("labels.password")}</FormLabel>
                <FormControl className="rounded-lg px-4 py-5">
                  <Input
                    type="password"
                    className="dark:border-border-blue dark:!bg-dark-blue-background bg-[#F6F8FF]"
                    placeholder="********"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* show password */}
          <FormItem className="flex items-center justify-between border-0">
            <div className="flex items-center gap-2">
              <Checkbox className="cursor-pointer" />
              <span className="text-sm">{t("checkboxes.password")}</span>
            </div>
            <Link
              className="text-sm text-[#235FE3] transition-all duration-300 hover:underline dark:text-[#6371FF]"
              href="/forgot-password"
            >
              {t("forgot-pass")}
            </Link>
          </FormItem>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full cursor-pointer rounded-xl bg-[#235FE3] py-5 font-bold text-white hover:bg-blue-600 dark:bg-[#6371FF] dark:hover:bg-[#6371FF]/80"
          >
            {t("signin")}
          </Button>

          {/* Google sign-in */}
          <Button
            type="button"
            variant="outline"
            className="dark:border-border-blue !bg-dark-blue-background flex w-full cursor-pointer items-center gap-3 rounded-xl py-5 font-bold"
          >
            <Image
              src="/assets/images/google.svg"
              width={15}
              height={15}
              alt="google image"
            />
            <span>
              {t("signin")} {t("buttons.google")}
            </span>
          </Button>

          <Separator className="dark:bg-border-blue" />
          <div className="text-center text-sm text-slate-500">
            <span>{t("no-account-yet")} </span>
            <Link
              className="text-sm text-[#235FE3] transition-all duration-300 hover:underline dark:text-[#6371FF]"
              href="/signup"
            >
              {t("buttons.create-account")}
            </Link>
          </div>
        </form>
      </Form>
    </Card>
  );
}

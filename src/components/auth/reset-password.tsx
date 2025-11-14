"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  userResetPasswordSchema,
  UserResetPasswordValues,
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
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { Spinner } from "../ui/spinner";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm<UserResetPasswordValues>({
    resolver: zodResolver(userResetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const t = useTranslations("authpages");

  const token = searchParams.get("token") as string;

  async function onSubmit(values: UserResetPasswordValues) {
    try {
      setIsLoading(true);

      if (values.password !== values.confirmPassword) {
        toast.error("Password do not match");
        setIsLoading(false);
        return;
      }

      const { error } = await authClient.resetPassword({
        newPassword: values.confirmPassword,
        token,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset successfully");
        form.reset();
        router.push("/signin");
      }
    } catch (err) {
      console.error("Reset password failed:", err);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <Card className="dark:border-border-blue dark:bg-blue-background h-full w-full flex-1 border-1 bg-white p-6 shadow-lg sm:max-w-lg">
      <h1 className="text-center text-xl font-semibold">
        {t("reset-password")}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
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

          {/* confirm password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("labels.confirm-password")}</FormLabel>
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
          <FormItem className="flex items-center justify-end border-0">
            <Link
              className="text-sm text-[#235FE3] transition-all duration-300 hover:underline dark:text-[#6371FF]"
              href="/sign-in"
            >
              {t("remember-pass")}
            </Link>
          </FormItem>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full cursor-pointer rounded-xl bg-[#235FE3] py-5 font-bold text-white hover:bg-blue-600 dark:bg-[#6371FF] dark:hover:bg-[#6371FF]/80"
          >
            {isLoading ? <Spinner /> : t("verify-email.buttons.reset")}
          </Button>
        </form>
      </Form>
    </Card>
  );
}

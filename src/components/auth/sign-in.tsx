"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getUserSignInSchema,
  UserSignInValues,
} from "@/lib/validations/auth-validations";
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
import { authClient } from "@/lib/auth/auth-client";
import { useState } from "react";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { signInWithGoogle } from "@/lib/auth/auth-client";

export default function SignIn() {
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const t = useTranslations("authpages");

  const form = useForm<UserSignInValues>({
    resolver: zodResolver(getUserSignInSchema(t)),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: UserSignInValues): Promise<void> {
    setIsSigningIn(true);
    try {
      const { data, error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: true,
        callbackURL: "/me/dashboard",
      });
      if (error) {
        console.error(error);

        if (error.code === "EMAIL_NOT_VERIFIED") {
          // Try to resend verification email
          const { error: resendError } = await authClient.sendVerificationEmail({
            email: values.email,
          });

          if (resendError) {
            // If resend fails (e.g., rate limit), just show the check inbox message
            toast.error(t("messages.verify-email-needed"));
          } else {
            toast.success(t("messages.verification-email-sent"));
          }
          form.reset();
          return;
        } else {
          toast.error(t("messages.error-signin", { message: error.message || "Unknown error" }));
        }
      }
      if (data) {
        toast.success(t("messages.success-signin"));
        form.reset();
        redirect("/me/dashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSigningIn(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.status === "error") {
        toast.error(t("messages.error-google"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
                    type={showPassword ? "text" : "password"}
                    className="dark:border-border-blue dark:!bg-dark-blue-background bg-[#F6F8FF]"
                    placeholder={t("placeholders.password")}
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
              <Checkbox
                checked={showPassword}
                onCheckedChange={(checked) => setShowPassword(Boolean(checked))}
                className="cursor-pointer"
              />
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
            disabled={isSigningIn}
            className="w-full cursor-pointer rounded-xl bg-[#235FE3] py-5 font-bold text-white hover:bg-blue-600 dark:bg-[#6371FF] dark:hover:bg-[#6371FF]/80"
          >
            {isSigningIn ? <Spinner /> : t("signin")}
          </Button>

          {/* Google sign-in */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            className="dark:border-border-blue !bg-dark-blue-background flex w-full cursor-pointer items-center gap-3 rounded-xl py-5 font-bold"
          >
            {loading ? (
              <Spinner />
            ) : (
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/images/google.svg"
                  width={15}
                  height={15}
                  alt="google image"
                />
                <span>
                  {t("signin")} {t("buttons.google")}
                </span>
              </div>
            )}
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

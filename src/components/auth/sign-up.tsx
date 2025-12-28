"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getUserSignUpSchema,
  UserSignUpValues,
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
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { signInWithGoogle } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const router = useRouter();
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const t = useTranslations("authpages");

  const form = useForm<UserSignUpValues>({
    resolver: zodResolver(getUserSignUpSchema(t)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      acceptTerms: false,
    },
  });

  async function onSubmit(values: UserSignUpValues): Promise<void> {
    setIsSigningUp(true);
    try {
      const { error } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        // image: "https://example.com/image.png",
        // callbackURL: "/signin",
      });

      if (error) {
        toast.error(t("messages.error-signup", { message: error.message || "Unknown error" }));
        return;
      }

      form.reset();
      toast.success(t("messages.success-signup"));
      router.push("/signin");
    } catch (err) {
      console.error(err);
      toast.error(t("messages.error-generic"));
    } finally {
      setIsSigningUp(false);
    }
  }

  const handleGoogleSignUp = async () => {
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
      <h1 className="text-center text-xl font-semibold">{t("signup")}</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("labels.name")}</FormLabel>
                <FormControl className="rounded-lg px-4 py-5">
                  <Input
                    placeholder={t("placeholders.name")}
                    className="dark:border-border-blue dark:!bg-dark-blue-background bg-[#F6F8FF]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    placeholder={t("placeholders.password")}
                    className="dark:border-border-blue dark:!bg-dark-blue-background bg-[#F6F8FF]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Show password + tip */}
          <FormItem className="flex flex-col items-start justify-between border-0 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={showPassword}
                onCheckedChange={(checked) => setShowPassword(Boolean(checked))}
                className="cursor-pointer"
              />
              <span className="text-sm">{t("checkboxes.password")}</span>
            </div>
            <p className="text-sm">{t("tip")}</p>
          </FormItem>

          {/* Terms & Privacy */}
          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1 border-0">
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="cursor-pointer"
                    />
                  </FormControl>
                  <span className="text-sm">
                    {t.rich("checkboxes.terms", {
                      terms: (chunks) => (
                        <a
                          className="text-[#235FE3] underline dark:text-[#6371FF]"
                          href="/terms"
                          target="_blank"
                          rel="noopener"
                        >
                          {chunks}
                        </a>
                      ),
                      privacy: (chunks) => (
                        <a
                          className="text-[#235FE3] underline dark:text-[#6371FF]"
                          href="/privacy"
                          target="_blank"
                          rel="noopener"
                        >
                          {chunks}
                        </a>
                      ),
                    })}
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSigningUp}
            className="w-full cursor-pointer rounded-xl bg-[#235FE3] py-5 font-bold text-white hover:bg-blue-600 dark:bg-[#6371FF] dark:hover:bg-[#6371FF]/80"
          >
            {isSigningUp ? <Spinner /> : t("buttons.create-account")}
          </Button>

          {/* Google sign-in */}
          <Button
            type="button"
            onClick={handleGoogleSignUp}
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
                  {t("signup")} {t("buttons.google")}
                </span>
              </div>
            )}
          </Button>

          <Separator className="dark:bg-border-blue" />
          <div className="text-center text-sm text-slate-500">
            <span>{t("already")} </span>
            <Link
              className="text-sm text-[#235FE3] transition-all duration-300 hover:underline dark:text-[#6371FF]"
              href="/signin"
            >
              {t("signin")}
            </Link>
          </div>
        </form>
      </Form>
    </Card>
  );
}

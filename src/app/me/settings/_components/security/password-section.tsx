"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "next-intl";

interface PasswordSectionProps {
  loading: boolean;
  hasPassword: boolean;
  onResetPasswordClick: () => void;
  onSetPasswordClick: () => void;
  setPasswordLoading: boolean;
}

export function PasswordSection({
  loading,
  hasPassword,
  onResetPasswordClick,
  onSetPasswordClick,
  setPasswordLoading,
}: PasswordSectionProps) {
  const t = useTranslations("main-dashboard.settings-page.security-section");

  if (!hasPassword) {
    return (
      <div className="flex flex-col gap-6">
        <Label>{t("labels.password.title")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("labels.password.no-password-message")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={setPasswordLoading}
            onClick={onSetPasswordClick}
            className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
          >
            {setPasswordLoading && <Spinner className="mr-2 h-4 w-4" />}
            {t("labels.password.buttons.set-password")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Label>{t("labels.password.title")}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          disabled={loading}
          onClick={onResetPasswordClick}
          className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
        >
          {loading && <Spinner className="mr-2 h-4 w-4" />}
          {t("labels.password.buttons.reset-password")}
        </Button>
      </div>
    </div>
  );
}


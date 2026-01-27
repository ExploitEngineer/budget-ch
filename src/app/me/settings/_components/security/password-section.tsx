"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "next-intl";

interface PasswordSectionProps {
  loading: boolean;
  onResetPasswordClick: () => void;
}

export function PasswordSection({
  loading,
  onResetPasswordClick,
}: PasswordSectionProps) {
  const t = useTranslations("main-dashboard.settings-page.security-section");

  return (
    <div className="flex flex-col gap-6">
      <Label>{t("labels.password.title")}</Label>
      <div className="flex flex-wrap items-center gap-2">
        {/* <Button
          variant="outline"
          className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
        >
          {t("labels.password.buttons.change-password")}
        </Button> */}
        <Button
          variant="outline"
          disabled={loading}
          onClick={onResetPasswordClick}
          className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
        >
          {loading ? (
            <Spinner />
          ) : (
            t("labels.password.buttons.reset-password")
          )}
        </Button>
      </div>
      {/* <p className="text-sm opacity-80">{t("labels.password.content")}</p> */}
    </div>
  );
}


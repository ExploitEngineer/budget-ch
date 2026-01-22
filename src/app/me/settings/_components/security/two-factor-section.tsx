"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "next-intl";
import type { TwoFactorStatus } from "@/lib/types/common-types";

interface TwoFactorSectionProps {
  loadingStatus: boolean;
  twoFactorStatus: TwoFactorStatus;
  loading: boolean;
  hasPassword: boolean;
  onEnableClick: () => void;
  onVerifyClick: () => void;
  onRestartSetup: () => void;
  onRegenerateBackupCodesClick: () => void;
  onDisableClick: () => void;
}

export function TwoFactorSection({
  loadingStatus,
  twoFactorStatus,
  loading,
  hasPassword,
  onEnableClick,
  onVerifyClick,
  onRestartSetup,
  onRegenerateBackupCodesClick,
  onDisableClick,
}: TwoFactorSectionProps) {
  const t = useTranslations("main-dashboard.settings-page.security-section");

  const isTwoFactorEnabled = twoFactorStatus === "enabled";
  const isTwoFactorPending = twoFactorStatus === "pending";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label className="text-sm">{t("labels.two-factor.title")}</Label>
        {loadingStatus ? (
          <Spinner />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {isTwoFactorEnabled
                ? t("labels.two-factor.status.enabled")
                : isTwoFactorPending
                  ? t("labels.two-factor.status.pending")
                  : t("labels.two-factor.status.disabled")}
            </span>
          </div>
        )}
      </div>

      <p className="text-sm opacity-80">{t("labels.two-factor.content")}</p>

      {!loadingStatus && (
        <div className="flex flex-wrap items-center gap-2">
          {!isTwoFactorEnabled && !isTwoFactorPending && hasPassword && (
            <Button
              variant="outline"
              onClick={onEnableClick}
              disabled={loading}
              className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
            >
              {loading ? <Spinner /> : t("labels.two-factor.buttons.enable")}
            </Button>
          )}
          {!isTwoFactorEnabled && !isTwoFactorPending && !hasPassword && (
            <p className="text-sm text-muted-foreground">
              {t("labels.two-factor.social-provider-message")}
            </p>
          )}
          {isTwoFactorPending && (
            <>
              <Button
                variant="outline"
                onClick={onVerifyClick}
                disabled={loading}
                className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
              >
                {t("labels.two-factor.buttons.verify")}
              </Button>
              <Button
                variant="ghost"
                onClick={onRestartSetup}
                disabled={loading}
                className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
              >
                {t("labels.two-factor.buttons.restart-setup")}
              </Button>
            </>
          )}
          {isTwoFactorEnabled && (
            <>
              <Button
                variant="outline"
                onClick={onRegenerateBackupCodesClick}
                disabled={loading}
                className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
              >
                {t("labels.two-factor.buttons.regenerate-backup-codes")}
              </Button>
              <Button
                variant="destructive"
                onClick={onDisableClick}
                disabled={loading}
                className="cursor-pointer"
              >
                {t("labels.two-factor.buttons.disable")}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}


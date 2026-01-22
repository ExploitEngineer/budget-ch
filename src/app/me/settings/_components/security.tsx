"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { getUserEmail } from "@/lib/services/user";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  enableTwoFactorAction,
  getTotpUriAction,
  getTwoFactorStatusAction,
  regenerateBackupCodesAction,
  checkHasPasswordAction,
} from "../actions";
import type { TwoFactorStatus } from "@/lib/types/common-types";
import { PasswordConfirmationDialog } from "./security/password-confirmation-dialog";
import { QrCodeDialog } from "./security/qr-code-dialog";
import { VerifyTotpDialog } from "./security/verify-totp-dialog";
import { RegenerateBackupCodesDialog } from "./security/regenerate-backup-codes-dialog";
import { DisableTwoFactorDialog } from "./security/disable-two-factor-dialog";
import { TwoFactorSection } from "./security/two-factor-section";
import { PasswordSection } from "./security/password-section";

export function Security() {
  const t = useTranslations("main-dashboard.settings-page.security-section");
  const [loading, setLoading] = useState<boolean>(false);
  const [twoFactorStatus, setTwoFactorStatus] =
    useState<TwoFactorStatus>("disabled");
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [hasPassword, setHasPassword] = useState<boolean>(true);

  // Dialog states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [showBackupCodesAfterVerify, setShowBackupCodesAfterVerify] =
    useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);

  // Form states
  const [password, setPassword] = useState("");
  const [regeneratePassword, setRegeneratePassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const resetTwoFactorSetup = () => {
    setPassword("");
    setTotpCode("");
    setTotpUri(null);
    setTotpSecret(null);
    setBackupCodes([]);
    setShowBackupCodesAfterVerify(false);
    setPasswordDialogOpen(false);
    setQrDialogOpen(false);
    setVerifyDialogOpen(false);
    setTwoFactorStatus("disabled");
  };

  useEffect(() => {
    loadTwoFactorStatus();
    loadHasPassword();
  }, []);

  const loadTwoFactorStatus = async () => {
    setLoadingStatus(true);
    try {
      const result = await getTwoFactorStatusAction();
      if (result.success && result.data) {
        setTwoFactorStatus(
          result.data.twoFactorEnabled ? "enabled" : "disabled",
        );
      }
    } catch (err) {
      console.error("Error loading 2FA status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadHasPassword = async () => {
    try {
      const result = await checkHasPasswordAction();
      if (result.success) {
        setHasPassword(result.data);
      }
    } catch (err) {
      console.error("Error checking password status:", err);
    }
  };

  const handleResetEmailSend = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await getUserEmail();

      if (!res.success) {
        toast.error(res.message || t("labels.password.messages.error"));
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
        } else {
          toast.success(t("labels.password.messages.reset-email-sent"));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(t("labels.password.messages.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    if (!password) {
      toast.error(t("labels.two-factor.messages.password-required"));
      return;
    }

    setLoading(true);
    try {
      const result = await enableTwoFactorAction(password);
      if (result.success && result.data) {
        setTotpUri(result.data.totpURI || null);
        // Extract secret from the totpURI
        if (result.data.totpURI) {
          const url = new URL(result.data.totpURI);
          const secret = url.searchParams.get("secret");
          setTotpSecret(secret);
        }
        setBackupCodes(result.data.backupCodes || []);
        setTwoFactorStatus("pending");
        setPasswordDialogOpen(false);
        setPassword("");
        setQrDialogOpen(true);
        toast.success(t("labels.two-factor.messages.setup-started"));
      } else {
        toast.error(
          result.message || t("labels.two-factor.messages.enable-error"),
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(t("labels.two-factor.messages.enable-error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast.error(t("labels.two-factor.messages.invalid-code"));
      return;
    }

    setLoading(true);
    try {
      // Use client-side method instead of server action to ensure session cookies are properly handled, Prevents signing out user after signing out
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: totpCode,
        // trustDevice: true,
      });

      if (error) {
        toast.error(
          error.message || t("labels.two-factor.messages.verify-error"),
        );
        return;
      }

      setTwoFactorStatus("enabled");
      setTotpCode("");
      setQrDialogOpen(false);
      // Show backup codes immediately after verification
      setShowBackupCodesAfterVerify(true);
      toast.success(t("labels.two-factor.messages.enabled-success"));
      await loadTwoFactorStatus();
    } catch (err: any) {
      console.error("Error verifying TOTP:", err);
      toast.error(err.message || t("labels.two-factor.messages.verify-error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!password) {
      toast.error(t("labels.two-factor.messages.password-required"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.twoFactor.disable({ password });

      if (error) {
        toast.error(
          error.message || t("labels.two-factor.messages.disable-error"),
        );
        return;
      }

      setTwoFactorStatus("disabled");
      setDisableDialogOpen(false);
      setPassword("");
      setBackupCodes([]);
      setTotpCode("");
      setShowBackupCodesAfterVerify(false);
      toast.success(t("labels.two-factor.messages.disabled-success"));
      await loadTwoFactorStatus();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || t("labels.two-factor.messages.disable-error"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!regeneratePassword) {
      toast.error(t("labels.two-factor.messages.password-required"));
      return;
    }

    setLoading(true);
    try {
      const result = await regenerateBackupCodesAction(regeneratePassword);
      if (result.success && result.data) {
        const newCodes = result.data?.backupCodes ?? [];
        setBackupCodes(newCodes);
        setShowBackupCodesAfterVerify(true);
        setVerifyDialogOpen(true);
        setRegenerateDialogOpen(false);
        setRegeneratePassword("");
        toast.success(t("labels.two-factor.messages.regenerate-success"));
      } else {
        toast.error(
          result.message || t("labels.two-factor.messages.regenerate-error"),
        );
      }
    } catch (err: any) {
      console.error("Error regenerating backup codes:", err);
      toast.error(
        err.message || t("labels.two-factor.messages.regenerate-error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGetTotpUri = async () => {
    if (!password) {
      toast.error(t("labels.two-factor.messages.password-required"));
      return;
    }

    setLoading(true);
    try {
      const result = await getTotpUriAction(password);
      if (result.success && result.data) {
        setTotpUri(result.data.totpURI || null);
        // Extract secret from the totpURI
        if (result.data.totpURI) {
          const url = new URL(result.data.totpURI);
          const secret = url.searchParams.get("secret");
          setTotpSecret(secret);
        }
        setPasswordDialogOpen(false);
        setPassword("");
        setQrDialogOpen(true);
      } else {
        toast.error(
          result.message || t("labels.two-factor.messages.get-uri-error"),
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(t("labels.two-factor.messages.get-uri-error"));
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
            <TwoFactorSection
              loadingStatus={loadingStatus}
              twoFactorStatus={twoFactorStatus}
              loading={loading}
              hasPassword={hasPassword}
              onEnableClick={() => setPasswordDialogOpen(true)}
              onVerifyClick={() => setVerifyDialogOpen(true)}
              onRestartSetup={resetTwoFactorSetup}
              onRegenerateBackupCodesClick={() => setRegenerateDialogOpen(true)}
              onDisableClick={() => setDisableDialogOpen(true)}
            />

            <PasswordSection
              loading={loading}
              onResetPasswordClick={handleResetEmailSend}
            />
          </div>
        </CardContent>
      </Card>

      <PasswordConfirmationDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        password={password}
        onPasswordChange={setPassword}
        onSubmit={handleEnableTwoFactor}
        loading={loading}
      />

      <QrCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        totpUri={totpUri}
        totpSecret={totpSecret}
        onNext={() => {
          setQrDialogOpen(false);
          setVerifyDialogOpen(true);
        }}
      />

      <VerifyTotpDialog
        open={verifyDialogOpen}
        onOpenChange={setVerifyDialogOpen}
        totpCode={totpCode}
        onTotpCodeChange={setTotpCode}
        onVerify={handleVerifyTotp}
        loading={loading}
        showBackupCodes={showBackupCodesAfterVerify}
        backupCodes={backupCodes}
        onClose={() => {
          setVerifyDialogOpen(false);
          setShowBackupCodesAfterVerify(false);
          setTotpCode("");
          setBackupCodes([]);
        }}
      />

      <RegenerateBackupCodesDialog
        open={regenerateDialogOpen}
        onOpenChange={setRegenerateDialogOpen}
        password={regeneratePassword}
        onPasswordChange={setRegeneratePassword}
        onSubmit={handleRegenerateBackupCodes}
        loading={loading}
      />

      <DisableTwoFactorDialog
        open={disableDialogOpen}
        onOpenChange={setDisableDialogOpen}
        password={password}
        onPasswordChange={setPassword}
        onSubmit={handleDisableTwoFactor}
        loading={loading}
      />
    </section>
  );
}

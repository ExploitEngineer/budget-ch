"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { getUserEmail } from "@/lib/services/user";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QRCode from "react-qr-code";
import {
  enableTwoFactorAction,
  verifyTotpCodeAction,
  disableTwoFactorAction,
  getTotpUriAction,
  getTwoFactorStatusAction,
} from "../actions";

export function Security() {
  const t = useTranslations("main-dashboard.settings-page.security-section");
  const [loading, setLoading] = useState<boolean>(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [twoFactorPending, setTwoFactorPending] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);

  // Dialog states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [showBackupCodesAfterVerify, setShowBackupCodesAfterVerify] = useState(false);

  // Form states
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  const loadTwoFactorStatus = async () => {
    setLoadingStatus(true);
    try {
      const result = await getTwoFactorStatusAction();
      if (result.success && result.data) {
        setTwoFactorEnabled(result.data.twoFactorEnabled);
      }
    } catch (err) {
      console.error("Error loading 2FA status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleResetEmailSend = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await getUserEmail();

      if (!res.success) {
        toast.error(res.message || "Error fetching user email");
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
        setBackupCodes(result.data.backupCodes || []);
        setTwoFactorPending(true);
        setPasswordDialogOpen(false);
        setPassword("");
        setQrDialogOpen(true);
        toast.success(t("labels.two-factor.messages.setup-started"));
      } else {
        toast.error(result.message || t("labels.two-factor.messages.enable-error"));
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
      const result = await verifyTotpCodeAction(totpCode);
      if (result.success) {
        setTwoFactorEnabled(true);
        setTwoFactorPending(false);
        setTotpCode("");
        setQrDialogOpen(false);
        // Show backup codes immediately after verification
        setShowBackupCodesAfterVerify(true);
        toast.success(t("labels.two-factor.messages.enabled-success"));
        await loadTwoFactorStatus();
      } else {
        toast.error(result.message || t("labels.two-factor.messages.verify-error"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("labels.two-factor.messages.verify-error"));
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
      const result = await disableTwoFactorAction(password);
      if (result.success) {
        setTwoFactorEnabled(false);
        setTwoFactorPending(false);
        setDisableDialogOpen(false);
        setPassword("");
        toast.success(t("labels.two-factor.messages.disabled-success"));
        await loadTwoFactorStatus();
      } else {
        toast.error(result.message || t("labels.two-factor.messages.disable-error"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("labels.two-factor.messages.disable-error"));
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
        setPasswordDialogOpen(false);
        setPassword("");
        setQrDialogOpen(true);
      } else {
        toast.error(result.message || t("labels.two-factor.messages.get-uri-error"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("labels.two-factor.messages.get-uri-error"));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("labels.two-factor.messages.copied"));
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
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label className="text-sm">{t("labels.two-factor.title")}</Label>
                {loadingStatus ? (
                  <Spinner />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {twoFactorEnabled
                        ? t("labels.two-factor.status.enabled")
                        : twoFactorPending
                          ? t("labels.two-factor.status.pending")
                          : t("labels.two-factor.status.disabled")}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-sm opacity-80">
                {t("labels.two-factor.content")}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {!twoFactorEnabled && !twoFactorPending && (
                  <Button
                    variant="outline"
                    onClick={() => setPasswordDialogOpen(true)}
                    disabled={loading}
                    className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
                  >
                    {loading ? (
                      <Spinner />
                    ) : (
                      t("labels.two-factor.buttons.enable")
                    )}
                  </Button>
                )}
                {twoFactorPending && (
                  <Button
                    variant="outline"
                    onClick={() => setVerifyDialogOpen(true)}
                    disabled={loading}
                    className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
                  >
                    {t("labels.two-factor.buttons.verify")}
                  </Button>
                )}
                {twoFactorEnabled && (
                  <Button
                    variant="destructive"
                    onClick={() => setDisableDialogOpen(true)}
                    disabled={loading}
                    className="cursor-pointer"
                  >
                    {t("labels.two-factor.buttons.disable")}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <Label>{t("labels.password.title")}</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
                >
                  {t("labels.password.buttons.change-password")}
                </Button>
                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={handleResetEmailSend}
                  className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
                >
                  {loading ? (
                    <Spinner />
                  ) : (
                    t("labels.password.buttons.reset-password")
                  )}
                </Button>
              </div>
              <p className="text-sm opacity-80">
                {t("labels.password.content")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Confirmation Dialog for Enable */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="dark:!bg-dark-blue-background">
          <DialogHeader>
            <DialogTitle>{t("labels.two-factor.dialogs.password.title")}</DialogTitle>
            <DialogDescription>
              {t("labels.two-factor.dialogs.password.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("labels.two-factor.dialogs.password.label")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("labels.two-factor.dialogs.password.placeholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleEnableTwoFactor();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setPassword("");
              }}
            >
              {t("labels.two-factor.dialogs.cancel")}
            </Button>
            <Button onClick={handleEnableTwoFactor} disabled={loading || !password}>
              {loading ? <Spinner /> : t("labels.two-factor.dialogs.continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="dark:!bg-dark-blue-background max-w-md">
          <DialogHeader>
            <DialogTitle>{t("labels.two-factor.dialogs.qr.title")}</DialogTitle>
            <DialogDescription>
              {t("labels.two-factor.dialogs.qr.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {totpUri && (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCode value={totpUri} size={256} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setQrDialogOpen(false);
                setVerifyDialogOpen(true);
              }}
            >
              {t("labels.two-factor.dialogs.qr.next")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify TOTP Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={(open) => {
        if (!open && !showBackupCodesAfterVerify) {
          setVerifyDialogOpen(false);
          setTotpCode("");
        }
      }}>
        <DialogContent className="dark:!bg-dark-blue-background max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showBackupCodesAfterVerify
                ? t("labels.two-factor.dialogs.backup-codes.title")
                : t("labels.two-factor.dialogs.verify.title")}
            </DialogTitle>
            <DialogDescription>
              {showBackupCodesAfterVerify
                ? t("labels.two-factor.dialogs.backup-codes.description")
                : t("labels.two-factor.dialogs.verify.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {showBackupCodesAfterVerify ? (
              // Show backup codes after verification
              backupCodes.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="font-mono text-sm p-2 bg-background rounded border cursor-pointer hover:bg-accent"
                        onClick={() => copyToClipboard(code)}
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("labels.two-factor.dialogs.backup-codes.warning")}
                  </p>
                </div>
              )
            ) : (
              // Show verification input
              <div className="space-y-2">
                <Label htmlFor="totp-code">{t("labels.two-factor.dialogs.verify.label")}</Label>
                <Input
                  id="totp-code"
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && totpCode.length === 6) {
                      handleVerifyTotp();
                    }
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            {showBackupCodesAfterVerify ? (
              <Button
                onClick={() => {
                  setVerifyDialogOpen(false);
                  setShowBackupCodesAfterVerify(false);
                  setTotpCode("");
                  setBackupCodes([]);
                }}
              >
                {t("labels.two-factor.dialogs.close")}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setVerifyDialogOpen(false);
                    setTotpCode("");
                  }}
                >
                  {t("labels.two-factor.dialogs.cancel")}
                </Button>
                <Button
                  onClick={handleVerifyTotp}
                  disabled={loading || totpCode.length !== 6}
                >
                  {loading ? <Spinner /> : t("labels.two-factor.dialogs.verify.submit")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent className="dark:!bg-dark-blue-background">
          <DialogHeader>
            <DialogTitle>{t("labels.two-factor.dialogs.disable.title")}</DialogTitle>
            <DialogDescription>
              {t("labels.two-factor.dialogs.disable.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">
                {t("labels.two-factor.dialogs.password.label")}
              </Label>
              <Input
                id="disable-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("labels.two-factor.dialogs.password.placeholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password) {
                    handleDisableTwoFactor();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDisableDialogOpen(false);
                setPassword("");
              }}
            >
              {t("labels.two-factor.dialogs.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableTwoFactor}
              disabled={loading || !password}
            >
              {loading ? <Spinner /> : t("labels.two-factor.dialogs.disable.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function TwoFactorPage() {
  const t = useTranslations("two-factor");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [totpCode, setTotpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [activeTab, setActiveTab] = useState("totp");

  const redirectTo = searchParams.get("redirect") || "/me/dashboard";

  const handleVerifyTotp = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast.error(t("messages.invalid-code"));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: totpCode,
        trustDevice,
      });

      if (error) {
        toast.error(error.message || t("messages.verify-error"));
        return;
      }

      toast.success(t("messages.verify-success"));
      router.push(redirectTo);
    } catch (err: any) {
      console.error("Error verifying TOTP:", err);
      toast.error(err.message || t("messages.verify-error"));
    } finally {
      setLoading(false);
    }
  };

  const handleUseBackupCode = async () => {
    if (!backupCode) {
      toast.error(t("messages.backup-code-required"));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authClient.twoFactor.verifyBackupCode({
        code: backupCode,
        trustDevice,
      });

      if (error) {
        toast.error(error.message || t("messages.backup-code-error"));
        return;
      }

      toast.success(t("messages.backup-code-success"));
      router.push(redirectTo);
    } catch (err: any) {
      console.error("Error using backup code:", err);
      toast.error(err.message || t("messages.backup-code-error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-blue-background dark:border-border-blue">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Toggle between TOTP and Backup Code */}
          <div className="flex gap-2 border-b">
            <button
              type="button"
              onClick={() => setActiveTab("totp")}
              className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "totp"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("tabs.totp")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("backup")}
              className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "backup"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("tabs.backup-code")}
            </button>
          </div>

          {activeTab === "totp" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totp-code">{t("labels.totp-code")}</Label>
                <Input
                  id="totp-code"
                  type="text"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && totpCode.length === 6) {
                      handleVerifyTotp();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t("hints.totp-code")}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="trust-device"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="trust-device" className="text-sm cursor-pointer">
                  {t("labels.trust-device")}
                </Label>
              </div>

              <Button
                onClick={handleVerifyTotp}
                disabled={loading || totpCode.length !== 6}
                className="w-full"
              >
                {loading ? <Spinner /> : t("buttons.verify")}
              </Button>
            </div>
          )}

          {activeTab === "backup" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-code">{t("labels.backup-code")}</Label>
                <Input
                  id="backup-code"
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder={t("placeholders.backup-code")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && backupCode) {
                      handleUseBackupCode();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t("hints.backup-code")}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="trust-device-backup"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label
                  htmlFor="trust-device-backup"
                  className="text-sm cursor-pointer"
                >
                  {t("labels.trust-device")}
                </Label>
              </div>

              <Button
                onClick={handleUseBackupCode}
                disabled={loading || !backupCode}
                className="w-full"
              >
                {loading ? <Spinner /> : t("buttons.use-backup-code")}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


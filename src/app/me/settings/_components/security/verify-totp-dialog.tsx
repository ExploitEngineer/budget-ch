"use client";

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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "next-intl";
import { useCopyToClipboard } from "./utils";

interface VerifyTotpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totpCode: string;
  onTotpCodeChange: (code: string) => void;
  onVerify: () => void;
  loading: boolean;
  showBackupCodes: boolean;
  backupCodes: string[];
  onClose: () => void;
}

export function VerifyTotpDialog({
  open,
  onOpenChange,
  totpCode,
  onTotpCodeChange,
  onVerify,
  loading,
  showBackupCodes,
  backupCodes,
  onClose,
}: VerifyTotpDialogProps) {
  const t = useTranslations("main-dashboard.settings-page.security-section");
  const { copyToClipboard, copyAllBackupCodes } = useCopyToClipboard();

  const handleOpenChange = (open: boolean) => {
    if (!open && !showBackupCodes) {
      onOpenChange(false);
      onTotpCodeChange("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="dark:!bg-dark-blue-background max-w-md">
        <DialogHeader>
          <DialogTitle>
            {showBackupCodes
              ? t("labels.two-factor.dialogs.backup-codes.title")
              : t("labels.two-factor.dialogs.verify.title")}
          </DialogTitle>
          <DialogDescription>
            {showBackupCodes
              ? t("labels.two-factor.dialogs.backup-codes.description")
              : t("labels.two-factor.dialogs.verify.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {showBackupCodes ? (
            backupCodes.length > 0 && (
              <div className="space-y-2">
                <div className="bg-muted grid grid-cols-2 gap-2 rounded-lg p-4">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="bg-background hover:bg-accent cursor-pointer rounded border p-2 font-mono text-sm"
                      onClick={() => copyToClipboard(code)}
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => copyAllBackupCodes(backupCodes)}
                  className="dark:border-border-blue !bg-dark-blue-background w-full cursor-pointer"
                >
                  {t("labels.two-factor.dialogs.backup-codes.copy-all")}
                </Button>
                <p className="text-muted-foreground text-xs">
                  {t("labels.two-factor.dialogs.backup-codes.warning")}
                </p>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <Label htmlFor="totp-code">
                {t("labels.two-factor.dialogs.verify.label")}
              </Label>
              <Input
                id="totp-code"
                type="text"
                value={totpCode}
                onChange={(e) =>
                  onTotpCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                maxLength={6}
                className="text-center font-mono text-2xl tracking-widest"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && totpCode.length === 6) {
                    onVerify();
                  }
                }}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          {showBackupCodes ? (
            <Button onClick={onClose}>
              {t("labels.two-factor.dialogs.close")}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onTotpCodeChange("");
                }}
              >
                {t("labels.two-factor.dialogs.cancel")}
              </Button>
              <Button
                onClick={onVerify}
                disabled={loading || totpCode.length !== 6}
              >
                {loading ? (
                  <Spinner />
                ) : (
                  t("labels.two-factor.dialogs.verify.submit")
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import { useTranslations } from "next-intl";
import { useCopyToClipboard } from "./utils";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totpUri: string | null;
  totpSecret: string | null;
  onNext: () => void;
}

export function QrCodeDialog({
  open,
  onOpenChange,
  totpUri,
  totpSecret,
  onNext,
}: QrCodeDialogProps) {
  const t = useTranslations("main-dashboard.settings-page.security-section");
  const { copyToClipboard } = useCopyToClipboard();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <div className="rounded-lg bg-white p-4">
                <QRCode value={totpUri} size={256} />
              </div>
            </div>
          )}
          {totpSecret && (
            <div className="space-y-2">
              <Label>{t("labels.two-factor.dialogs.qr.secret-key")}</Label>
              <div className="flex flex-col gap-2">
                <div className="flex-1 bg-muted rounded-lg p-3 font-mono text-sm break-all">
                  {totpSecret}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(totpSecret)}
                  className="dark:border-border-blue !bg-dark-blue-background cursor-pointer"
                >
                  {t("labels.two-factor.dialogs.qr.copy-secret")}
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onNext();
            }}
          >
            {t("labels.two-factor.dialogs.qr.next")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


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

interface RegenerateBackupCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function RegenerateBackupCodesDialog({
  open,
  onOpenChange,
  password,
  onPasswordChange,
  onSubmit,
  loading,
}: RegenerateBackupCodesDialogProps) {
  const t = useTranslations("main-dashboard.settings-page.security-section");

  const handleCancel = () => {
    onOpenChange(false);
    onPasswordChange("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          onPasswordChange("");
        }
      }}
    >
      <DialogContent className="dark:!bg-dark-blue-background">
        <DialogHeader>
          <DialogTitle>
            {t("labels.two-factor.dialogs.regenerate.title")}
          </DialogTitle>
          <DialogDescription>
            {t("labels.two-factor.dialogs.regenerate.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="regenerate-password">
              {t("labels.two-factor.dialogs.password.label")}
            </Label>
            <Input
              id="regenerate-password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder={t("labels.two-factor.dialogs.password.placeholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && password) {
                  onSubmit();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t("labels.two-factor.dialogs.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={loading || !password}>
            {loading && <Spinner className="mr-2 h-4 w-4" />}
            {t("labels.two-factor.dialogs.regenerate.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


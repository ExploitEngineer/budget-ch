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

interface DisableTwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function DisableTwoFactorDialog({
  open,
  onOpenChange,
  password,
  onPasswordChange,
  onSubmit,
  loading,
}: DisableTwoFactorDialogProps) {
  const t = useTranslations("main-dashboard.settings-page.security-section");

  const handleCancel = () => {
    onOpenChange(false);
    onPasswordChange("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:!bg-dark-blue-background">
        <DialogHeader>
          <DialogTitle>
            {t("labels.two-factor.dialogs.disable.title")}
          </DialogTitle>
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
          <Button
            variant="destructive"
            onClick={onSubmit}
            disabled={loading || !password}
          >
            {loading && <Spinner className="mr-2 h-4 w-4" />}
            {t("labels.two-factor.dialogs.disable.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


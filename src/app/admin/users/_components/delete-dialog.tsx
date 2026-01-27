"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, UserMinus, Trash2, Check } from "lucide-react";
import type { AdminUser } from "../page";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser;
  onSuccess: () => void;
}

type DeleteMode = "anonymize" | "delete";

export function DeleteDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: DeleteDialogProps) {
  const [mode, setMode] = useState<DeleteMode>("anonymize");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("admin");

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const endpoint =
        mode === "anonymize"
          ? `/api/admin/users/${user.id}/anonymize`
          : `/api/admin/users/${user.id}`;

      const method = mode === "anonymize" ? "POST" : "DELETE";

      const res = await fetch(endpoint, { method });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process request");
      }

      toast.success(
        mode === "anonymize"
          ? t("users.delete-dialog.anonymize-success")
          : t("users.delete-dialog.delete-success")
      );
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error((err as Error).message || t("users.delete-dialog.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMode("anonymize");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {t("users.delete-dialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("users.delete-dialog.description", { email: user.email })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Card
              className={cn(
                "cursor-pointer transition-all hover:border-orange-500",
                mode === "anonymize" && "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20"
              )}
              onClick={() => setMode("anonymize")}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                      mode === "anonymize"
                        ? "border-orange-500 bg-orange-500"
                        : "border-muted-foreground"
                    )}
                  >
                    {mode === "anonymize" && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <UserMinus className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">
                        {t("users.delete-dialog.anonymize")}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {t("users.delete-dialog.recommended")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("users.delete-dialog.anonymize-description")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "cursor-pointer transition-all hover:border-red-500",
                mode === "delete" && "border-red-500 bg-red-50/50 dark:bg-red-950/20"
              )}
              onClick={() => setMode("delete")}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                      mode === "delete"
                        ? "border-red-500 bg-red-500"
                        : "border-muted-foreground"
                    )}
                  >
                    {mode === "delete" && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-red-500" />
                      <span className="font-medium">
                        {t("users.delete-dialog.permanently-delete")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("users.delete-dialog.delete-description")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warning for permanent delete */}
          {mode === "delete" && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                {t("users.delete-dialog.delete-warning")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t("users.delete-dialog.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("users.delete-dialog.processing")
              : mode === "anonymize"
              ? t("users.delete-dialog.anonymize-button")
              : t("users.delete-dialog.delete-button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

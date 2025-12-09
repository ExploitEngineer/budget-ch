"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";

export function BrowserNotificationPrompt() {
  const t = useTranslations("notifications.browser");
  const [open, setOpen] = useState(false);
  const {
    isSupported,
    permissionStatus,
    hasPermissionBeenRequested,
    requestPermission,
    setEnabled,
  } = useBrowserNotifications({ notifications: [] });

  useEffect(() => {
    // Only show prompt if:
    // 1. Browser notifications are supported
    // 2. Permission hasn't been requested yet
    // 3. Permission is not already granted
    if (
      isSupported &&
      !hasPermissionBeenRequested &&
      permissionStatus === "default"
    ) {
      // Show prompt after a short delay to avoid showing immediately on page load
      const timer = setTimeout(() => {
        setOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, hasPermissionBeenRequested, permissionStatus]);

  const handleAllow = async () => {
    const permission = await requestPermission();
    if (permission === "granted") {
      setEnabled(true);
    }
    setOpen(false);
  };

  const handleDismiss = () => {
    setOpen(false);
  };

  if (!isSupported || permissionStatus !== "default") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Bell className="h-5 w-5 text-primary" />
            <DialogTitle>{t("prompt.title")}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {t("prompt.description")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleDismiss}>
            {t("prompt.dismiss")}
          </Button>
          <Button onClick={handleAllow}>
            {t("prompt.allow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

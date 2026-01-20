"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { checkOnboardingStatus, completeOnboarding } from "@/lib/services/user";

const GUIDE_URL = "https://budgethub.ch/guide";

export function WelcomeModal() {
  const t = useTranslations("welcome-modal");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const result = await checkOnboardingStatus();
        if (result.success && result.data && !result.data.isOnboarded) {
          setOpen(true);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsLoading(false);
      }
    }
    checkStatus();
  }, []);

  const handleDismiss = async () => {
    setOpen(false);
    try {
      await completeOnboarding();
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const handleOpenGuide = async () => {
    window.open(GUIDE_URL, "_blank", "noopener,noreferrer");
    await handleDismiss();
  };

  if (isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDismiss()}>
      <DialogContent showCloseButton={false} className="p-8 sm:max-w-md">
        <div className="flex flex-col items-center text-center space-y-4">
          <h2 className="text-2xl font-bold">
            {t("title")} <span aria-hidden="true">👋</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("description-1")}
            <br />
            {t("description-2")} <span className="font-semibold text-foreground">{t("help")}</span>.
          </p>
        </div>
        <div className="flex gap-3 mt-6 w-full">
          <Button onClick={handleOpenGuide} className="flex-1 h-11">
            {t("open-guide")}
          </Button>
          <Button variant="secondary" onClick={handleDismiss} className="flex-1 h-11">
            {t("later")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

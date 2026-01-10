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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteDialog({
  open,
  onOpenChange,
  onSuccess,
}: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [includeSubscription, setIncludeSubscription] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<
    "individual" | "family"
  >("individual");
  const [subscriptionMonths, setSubscriptionMonths] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("admin");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        email,
        role,
        subscriptionPlan: includeSubscription ? subscriptionPlan : null,
        subscriptionMonths: includeSubscription ? subscriptionMonths : null,
      };

      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send invitation");
      }

      toast.success(t("users.invite-dialog.success"));
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error((err as Error).message || t("users.invite-dialog.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("user");
    setIncludeSubscription(false);
    setSubscriptionPlan("individual");
    setSubscriptionMonths(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("users.invite-dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("users.invite-dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">{t("users.invite-dialog.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("users.invite-dialog.email-placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">{t("users.invite-dialog.role")}</Label>
            <Select
              value={role}
              onValueChange={(value: "user" | "admin") => setRole(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  {t("users.invite-dialog.role-user")}
                </SelectItem>
                <SelectItem value="admin">
                  {t("users.invite-dialog.role-admin")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include Subscription */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeSubscription"
              checked={includeSubscription}
              onCheckedChange={(checked) =>
                setIncludeSubscription(checked === true)
              }
            />
            <Label htmlFor="includeSubscription" className="cursor-pointer">
              {t("users.invite-dialog.include-subscription")}
            </Label>
          </div>

          {/* Subscription Options */}
          {includeSubscription && (
            <div className="space-y-4 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
              {/* Subscription Plan */}
              <div className="space-y-2">
                <Label htmlFor="subscriptionPlan">
                  {t("users.invite-dialog.subscription-plan")}
                </Label>
                <Select
                  value={subscriptionPlan}
                  onValueChange={(value: "individual" | "family") =>
                    setSubscriptionPlan(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">
                      {t("users.invite-dialog.plan-individual")}
                    </SelectItem>
                    <SelectItem value="family">
                      {t("users.invite-dialog.plan-family")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subscription Duration */}
              <div className="space-y-2">
                <Label htmlFor="subscriptionMonths">
                  {t("users.invite-dialog.subscription-months")}
                </Label>
                <Input
                  id="subscriptionMonths"
                  type="number"
                  min={1}
                  max={24}
                  value={subscriptionMonths}
                  onChange={(e) =>
                    setSubscriptionMonths(
                      Math.min(24, Math.max(1, parseInt(e.target.value) || 1))
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t("users.invite-dialog.months-hint")}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t("users.invite-dialog.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !email}>
              {isSubmitting
                ? t("users.invite-dialog.sending")
                : t("users.invite-dialog.send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

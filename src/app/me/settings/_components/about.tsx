"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { sendSupportEmail } from "@/lib/actions/support";

export function AboutSection() {
  const t = useTranslations("main-dashboard.settings-page.about-section");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const Badges: string[] = [
    t("legal.links.terms"),
    t("legal.links.privacy"),
    t("legal.links.imprint"),
  ];

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error(t("support.error-empty") || "Please enter a message");
      return;
    }

    if (message.trim().length < 10) {
      toast.error(t("support.error-too-short") || "Message is too short");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendSupportEmail(message);
      if (result.success) {
        toast.success(t("support.success") || "Message sent successfully!");
        setMessage("");
      } else {
        toast.error(result.message || t("support.error") || "Failed to send message");
      }
    } catch (error) {
      toast.error(t("support.error") || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-blue-background dark:border-border-blue">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <Separator className="dark:bg-border-blue" />
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("version.title")}</h3>
            <Badge
              variant="outline"
              className="bg-badge-background dark:border-border-blue rounded-full px-3 py-1"
            >
              {t("version.label")}
            </Badge>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("legal.title")}</h3>
            <div className="flex flex-wrap gap-2">
              {Badges.map((badge) => (
                <Badge
                  key={badge}
                  variant="outline"
                  className="bg-badge-background dark:border-border-blue rounded-full px-3 py-1"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t("support.title")}</h3>
          <Textarea
            className="!bg-dark-blue-background min-h-[100px]"
            placeholder={t("support.placeholder")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            className="btn-gradient cursor-pointer"
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? t("support.sending") || "Sending..." : t("support.button")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


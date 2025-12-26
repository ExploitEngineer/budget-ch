"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { sendSupportEmail } from "@/lib/actions/support";

export function ContactSupport() {
  const t = useTranslations("main-dashboard.help-page.contact-support-section");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: { subject: string; message: string }) {
    if (!values.message.trim()) {
      toast.error(t("error-empty") || "Please enter a message");
      return;
    }

    if (values.message.trim().length < 10) {
      toast.error(t("error-too-short") || "Message is too short");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendSupportEmail(values.message, values.subject);
      if (result.success) {
        toast.success(t("success") || "Message sent successfully!");
        form.reset();
      } else {
        toast.error(result.message || t("error") || "Failed to send message");
      }
    } catch (error) {
      toast.error(t("error") || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="contact-support-form">
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("subject.title")}</FormLabel>
                    <FormControl>
                      <Input
                        className="dark:border-border-blue !bg-dark-blue-background"
                        placeholder={t("subject.title")}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("message.title")}</FormLabel>
                    <FormControl>
                      <Textarea
                        className="dark:border-border-blue !bg-dark-blue-background min-h-[100px]"
                        placeholder={t("message.placeholder")}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="dark:border-border-blue !bg-dark-blue-background"
                  type="submit"
                  disabled={isSubmitting || !form.watch("message").trim()}
                >
                  {isSubmitting ? t("sending") || "Sending..." : t("button")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}


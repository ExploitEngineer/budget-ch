"use client";

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

export function ContactSupport() {
  const t = useTranslations("main-dashboard.help-page.contact-support-section");

  const form = useForm({
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  function onSubmit(values: { subject: string; message: string }) {
    console.log(values);
  }

  return (
    <section>
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
                        className="dark:border-border-blue !bg-dark-blue-background"
                        placeholder={t("message.placeholder")}
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
                >
                  {t("button")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}

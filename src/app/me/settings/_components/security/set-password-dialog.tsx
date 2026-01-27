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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getSetPasswordSchema,
  SetPasswordValues,
} from "@/lib/validations/auth-validations";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

interface SetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (newPassword: string) => void;
  loading: boolean;
}

export function SetPasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: SetPasswordDialogProps) {
  const t = useTranslations("main-dashboard.settings-page.security-section");
  const tAuth = useTranslations("authpages");

  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(getSetPasswordSchema(tAuth)),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (values: SetPasswordValues) => {
    onSubmit(values.newPassword);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="dark:!bg-dark-blue-background">
        <DialogHeader>
          <DialogTitle>
            {t("labels.password.dialogs.set-password.title")}
          </DialogTitle>
          <DialogDescription>
            {t("labels.password.dialogs.set-password.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "labels.password.dialogs.set-password.new-password-label",
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t(
                        "labels.password.dialogs.set-password.new-password-placeholder",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "labels.password.dialogs.set-password.confirm-password-label",
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t(
                        "labels.password.dialogs.set-password.confirm-password-placeholder",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t("labels.two-factor.dialogs.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Spinner className="mr-2 h-4 w-4" />}
                {t("labels.password.dialogs.set-password.submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

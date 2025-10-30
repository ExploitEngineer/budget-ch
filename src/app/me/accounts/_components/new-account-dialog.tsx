"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  DialogHeader,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  NewAccountDialogSchema,
  NewAccountDialogValues,
} from "@/lib/validations";
import { DialogTitle } from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { createFinancialAccount } from "@/lib/services/financial-account";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function NewAccountDialog({
  variant,
}: {
  variant?: "gradient" | "outline";
}) {
  const t = useTranslations(
    "main-dashboard.content-page.sidebar-header.new-account-dialog",
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const form = useForm<NewAccountDialogValues>({
    resolver: zodResolver(NewAccountDialogSchema) as any,
    defaultValues: {
      name: "",
      type: "checking",
      balance: 0,
      iban: "",
      note: "",
    },
  });

  async function onSubmit(values: NewAccountDialogValues) {
    setLoading(true);

    try {
      const result = await createFinancialAccount({
        name: values.name,
        type: values.type,
        initialBalance: values.balance,
        iban: values.iban,
        note: values.note,
      });

      if (!result.status) {
        toast.error(`${result.message} Something went wrong`);
        return;
      }

      toast.success(result.message);

      form.reset();
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to create account: ${err.message}`);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "cursor-pointer",
            variant === "gradient"
              ? "btn-gradient dark:text-white"
              : "dark:border-border-blue !bg-dark-blue-background text-xs",
          )}
          variant={variant === "gradient" ? "default" : "outline"}
        >
          <Plus className="h-5 w-5" />
          <span className="hidden text-sm sm:block">{t("title")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
          <DialogTitle className="text-lg font-semibold">
            {t("title")}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer border"
            >
              {t("button")}
            </Button>
          </DialogClose>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
          >
            {/* Row 1: Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.name.title")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("labels.name.placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 2: Type + Balance */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("labels.type.title")}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("labels.type.title")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">
                            {t("labels.type.options.checking")}
                          </SelectItem>
                          <SelectItem value="savings">
                            {t("labels.type.options.savings")}
                          </SelectItem>
                          <SelectItem value="credit-card">
                            {t("labels.type.options.credit-card")}
                          </SelectItem>
                          <SelectItem value="cash">
                            {t("labels.type.options.cash")}
                          </SelectItem>
                          {/*
                          <SelectItem value="retirement-3a">
                            {t("labels.type.options.retirement-3a")}
                          </SelectItem>
                          */}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("labels.balance")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={0.5}
                        min={0}
                        {...field}
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: IBAN */}
            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.iban.title")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("labels.iban.placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 4: Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.note.title")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("labels.note.placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="cursor-pointer"
              >
                {loading ? <Spinner /> : t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

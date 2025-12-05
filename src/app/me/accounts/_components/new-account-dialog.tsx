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
  FinancialAccountDialogSchema,
  FinancialAccountDialogValues,
} from "@/lib/validations/financial-account-dialog-validations";
import { DialogTitle } from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFinancialAccount } from "@/lib/services/financial-account";
import { accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
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

  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const createAccount = useMutation({
    mutationFn: async (data: Parameters<typeof createFinancialAccount>[0]) => {
      const result = await createFinancialAccount(data);
      if (!result.status) {
        throw new Error(result.message || "Failed to create account");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success("Account created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create account");
    },
  });

  const form = useForm<FinancialAccountDialogValues>({
    resolver: zodResolver(FinancialAccountDialogSchema) as any,
    defaultValues: {
      name: "",
      type: "checking",
      balance: 0,
      iban: "",
      note: "",
    },
  });

  async function onSubmit(values: FinancialAccountDialogValues) {
    try {
      await createAccount.mutateAsync({
        name: values.name,
        type: values.type,
        initialBalance: values.balance,
        iban: values.iban,
        note: values.note,
      });

      form.reset();
      setIsOpen(false);
    } catch (err: any) {
      // Error is already handled by the mutation (toast)
      console.error("Error submitting form:", err);
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
                disabled={createAccount.isPending}
                className="cursor-pointer"
              >
                {createAccount.isPending ? <Spinner /> : t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

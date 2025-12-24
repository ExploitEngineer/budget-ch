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
  DialogHeader,
  DialogClose,
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  FinancialAccountDialogSchema,
  FinancialAccountDialogValues,
} from "@/lib/validations/financial-account-dialog-validations";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateFinancialAccount,
  deleteFinancialAccount,
} from "@/lib/services/financial-account";
import { accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { AccountRow } from "@/lib/types/row-types";

interface EditAccountDialogProps {
  accountData: AccountRow;
  variant?: "gradient" | "outline";
}

export default function EditAccountDialog({
  accountData,
  variant,
}: EditAccountDialogProps) {
  const t = useTranslations(
    "main-dashboard.content-page.sidebar-header.new-account-dialog",
  );

  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const [open, setOpen] = useState(false);

  const updateAccount = useMutation({
    mutationFn: async ({
      accountId,
      updatedData,
    }: {
      accountId: string;
      updatedData: any;
    }) => {
      const result = await updateFinancialAccount(accountId, updatedData);
      if (!result.status) {
        throw new Error(result.message || "Failed to update account");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success(t("messages.updated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("messages.error.update"));
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (accountId: string) => {
      const result = await deleteFinancialAccount(accountId);
      if (!result.status) {
        throw new Error(result.message || "Failed to delete account");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success(t("messages.deleted"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("messages.error.delete"));
    },
  });

  const form = useForm<FinancialAccountDialogValues>({
    resolver: zodResolver(FinancialAccountDialogSchema) as any,
    defaultValues: {
      name: accountData.name ?? "",
      type: accountData.type ?? "checking",
      balance: accountData.balance ?? 0,
      iban: accountData.iban ?? "",
      note: accountData.note ?? "",
    },
  });

  async function onSubmit(values: FinancialAccountDialogValues) {
    try {
      await updateAccount.mutateAsync({
        accountId: accountData.id,
        updatedData: values,
      });
      setOpen(false);
    } catch (err: any) {
      // Error is already handled by the mutation (toast)
      console.error("Error submitting form:", err);
    }
  }

  async function handleDelete() {
    try {
      await deleteAccount.mutateAsync(accountData.id);
      setOpen(false);
    } catch (err: any) {
      // Error is already handled by the mutation (toast)
      console.error("Error deleting account:", err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant === "gradient" ? "default" : "outline"}
          className={cn(
            "cursor-pointer text-xs",
            variant === "gradient"
              ? "btn-gradient dark:text-white"
              : "dark:border-border-blue bg-dark-blue-background!",
          )}
        >
          {t("edit")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
          <DialogTitle className="text-lg font-semibold">
            {t("edit-title")}
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
            {/* Name */}
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

            {/* Type + Balance */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex-1">
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
                  <FormItem className="flex-1">
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

            {/* IBAN */}
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

            {/* Note */}
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
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={handleDelete}
                disabled={deleteAccount.isPending}
              >
                {deleteAccount.isPending ? <Spinner /> : t("delete")}
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={updateAccount.isPending}
              >
                {updateAccount.isPending ? <Spinner /> : t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

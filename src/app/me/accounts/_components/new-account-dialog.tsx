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

export default function NewAccountDialog({
  variant,
  text,
}: {
  variant?: "gradient" | "outline";
  text?: string;
}) {
  const t = useTranslations(
    "main-dashboard.content-page.sidebar-header.new-account-dialog",
  );

  const form = useForm<NewAccountDialogValues>({
    resolver: zodResolver(NewAccountDialogSchema) as any,
    defaultValues: {
      name: "",
      type: "",
      balance: 0,
      iban: "",
      note: "",
    },
  });

  function onSubmit(values: NewAccountDialogValues) {
    console.log("New account submitted:", values);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className={cn(
            variant === "gradient"
              ? "btn-gradient dark:text-white"
              : "dark:border-border-blue !bg-dark-blue-background cursor-pointer text-xs",
          )}
          variant={variant === "gradient" ? "default" : "outline"}
        >
          {variant === "gradient" ? (
            <span className="hidden text-sm sm:block">{t("title")}</span>
          ) : (
            text
          )}
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
          <DialogTitle className="text-lg font-semibold">
            {t("subtitle")}
          </DialogTitle>
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="border">
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
                          <SelectItem value="retirement-3a">
                            {t("labels.type.options.retirement-3a")}
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
              <Button type="submit">{t("save")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { createTransactionCategory } from "@/lib/services/transaction";

const CategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

type CategoryValues = z.infer<typeof CategorySchema>;

export default function CreateCategoryDialog({
  open,
  onOpenChangeAction,
  onCategoryAddedAction,
  hubId,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onCategoryAddedAction: (category: string) => void;
  hubId: string | null;
}) {
  const form = useForm<CategoryValues>({
    resolver: zodResolver(CategorySchema),
    defaultValues: { name: "" },
  });

  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("main-dashboard.dashboard-page");

  async function onSubmit(values: CategoryValues) {
    const newCategory = values.name.trim();
    if (!newCategory) return;

    if (!hubId) {
      toast.error(t("dialog-box.messages.id-required"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await createTransactionCategory(newCategory, hubId);

      if (!result.success) {
        if (result.reason === "DUPLICATE_CATEGORY") {
          toast.error(t("dialog-box.messages.category-exists", { name: newCategory }));
        } else {
          toast.error(result.message || t("common.error"));
        }
        setIsLoading(false);
        return;
      }

      onCategoryAddedAction(newCategory);
      toast.success(t("dialog-box.messages.category-added", { name: newCategory }));
      onOpenChangeAction(false);
      form.reset();
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      toast.error(t("common.error"));
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <div className="flex items-center justify-between border-b pb-3">
          <DialogTitle className="mb-4 text-lg font-semibold">
            {t("dialog-box.buttons.add-category")}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              className="cursor-pointer border"
              variant="ghost"
            >
              {t("dialog-box.btn-close")}
            </Button>
          </DialogClose>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("dialog-box.labels.category.category-name")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("dialog-box.placeholders.category-name")}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer transition-all duration-300 active:scale-95"
              >
                {isLoading ? <Spinner /> : t("dialog-box.buttons.add")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

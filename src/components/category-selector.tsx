"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import CreateCategoryDialog from "@/app/me/dashboard/_components/create-category-dialog";
import { getCategories } from "@/lib/api";
import { categoryKeys } from "@/lib/query-keys";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface CategorySelectorProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  hubId: string | null;
  allowCreate?: boolean;
  label?: string;
  placeholder?: string;
  enabled?: boolean;
  className?: string;
  onCategoryAdded?: (category: string) => void;
}

export default function CategorySelector<TFieldValues extends FieldValues>({
  control,
  name,
  hubId,
  allowCreate = true,
  label,
  placeholder,
  enabled = true,
  className,
  onCategoryAdded,
}: CategorySelectorProps<TFieldValues>) {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations(
    "main-dashboard.transactions-page.transaction-edit-dialog",
  );
  const tc = useTranslations("common");

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<
    { id: string; name: string }[]
  >({
    queryKey: categoryKeys.list(hubId),
    queryFn: async () => {
      if (!hubId) {
        throw new Error("Hub ID is required");
      }
      const res = await getCategories(hubId);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch categories");
      }
      return res.data ?? [];
    },
    enabled: enabled && !!hubId,
  });

  const categories = categoriesData?.map((cat) => cat.name) ?? [];

  function handleCategoryAdded(newCategory: string) {
    // Invalidate categories query to refetch and show new category
    queryClient.invalidateQueries({ queryKey: categoryKeys.list(hubId) });
    // Call the optional callback
    if (onCategoryAdded) {
      onCategoryAdded(newCategory);
    }
  }

  return (
    <>
      <CreateCategoryDialog
        open={isAddCategoryOpen}
        onOpenChangeAction={setIsAddCategoryOpen}
        onCategoryAddedAction={handleCategoryAdded}
        hubId={hubId}
      />
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className={className || "flex flex-1 flex-col"}>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <Select
                value={field.value || ""}
                onValueChange={field.onChange}
                disabled={categoriesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      categoriesLoading
                        ? tc("loading")
                        : placeholder || "Select or add a category"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {allowCreate && (
                    <div className="flex items-center justify-between border-b px-2 py-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full cursor-pointer justify-center text-sm"
                        onClick={() => setIsAddCategoryOpen(true)}
                      >
                        + {t("dialog.new-category")}
                      </Button>
                    </div>
                  )}

                  {categoriesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading categories...
                    </SelectItem>
                  ) : categories.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {t("dialog.no-category")}
                    </SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

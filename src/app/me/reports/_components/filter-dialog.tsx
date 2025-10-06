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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Filter as FilterIcon } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { filterDialogSchema, FilterDialogValues } from "@/lib/validations";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";

export default function FilterDialog() {
  const form = useForm<FilterDialogValues>({
    resolver: zodResolver(filterDialogSchema) as any,
    defaultValues: { from: undefined, to: undefined, text: "" },
  });

  const t = useTranslations(
    "main-dashboard.report-page.sidebar-header.filter-dialog",
  );

  function onSubmit(values: FilterDialogValues) {
    console.log(values);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="btn-gradient flex cursor-pointer items-center gap-2">
          <FilterIcon className="h-5 w-5" />
          <span className="text-sm">{t("button")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl [&>button]:hidden">
        <div className="flex items-center justify-between border-b pb-3">
          <DialogTitle className="text-lg font-semibold">
            {t("dialog-box.title")}
          </DialogTitle>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("dialog-box.button")}
            </Button>
          </DialogClose>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
              {/* From */}
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("dialog-box.labels.from")}</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "MM/dd/yyyy")
                              : t("dialog-box.labels.fromPlaceholder")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* To */}
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem className="flex flex-1 flex-col">
                    <FormLabel>{t("dialog-box.labels.to")}</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "MM/dd/yyyy")
                              : t("dialog-box.labels.toPlaceholder")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Text */}
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dialog-box.labels.text.title")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("dialog-box.labels.text.placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Apply Button */}
            <div className="flex justify-end pt-4">
              <Button type="submit">{t("dialog-box.buttons.apply")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

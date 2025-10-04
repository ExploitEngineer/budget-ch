"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MainFormValues, mainFormSchema } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

export function MembersInvitations() {
  const form = useForm<MainFormValues>({
    resolver: zodResolver(mainFormSchema) as any,
    defaultValues: {
      text: "",
      select: "",
    },
  });

  const t = useTranslations(
    "main-dashboard.settings-page.members-invitations-section",
  );

  const tableHeadings: string[] = [
    t("table.table-headings.email"),
    t("table.table-headings.role"),
    t("table.table-headings.status"),
    t("table.table-headings.action"),
  ];

  return (
    <section>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge variant="outline" className="rounded-full px-3 py-2">
            {t("badge")}
          </Badge>
        </CardHeader>
        <Separator />
        <CardContent>
          <Form {...form}>
            <form className="space-y-4">
              <div className="flex gap-4">
                {/* Invite via Email */}
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t("labels.invite-email.title")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("labels.invite-email.placeholder")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role */}
                <FormField
                  control={form.control}
                  name="account"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t("labels.role.title")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={t(
                                "labels.role.select-options.member",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">
                              {t("labels.role.select-options.member")}
                            </SelectItem>
                            <SelectItem value="admnin">
                              {t("labels.role.select-options.admin")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" className="cursor-pointer">
                  {t("button")}
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-8 overflow-x-auto rounded-lg border px-2 py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {tableHeadings.map((heading) => (
                    <TableHead key={heading}>{heading}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{t("table.content")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

export function Import() {
  const t = useTranslations("main-dashboard.import-export-page.import-section");

  const handleFileClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.json";
    input.click();
  };

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
          <div className="flex items-center justify-between gap-2">
            <Select>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groceries">
                  {t("data-type.transactions")}
                </SelectItem>
                <SelectItem value="restaurant">
                  {t("data-type.budgets")}
                </SelectItem>
                <SelectItem value="transportation">
                  {t("data-type.saving-goals")}
                </SelectItem>
                <SelectItem value="household">
                  {t("data-type.accounts")}
                </SelectItem>
                <SelectItem value="income">
                  {t("data-type.transfers")}
                </SelectItem>
                <SelectItem value="income">
                  {t("data-type.full-export")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">{t("modes.append")}</SelectItem>
                <SelectItem value="income">
                  {t("modes.replace-existing")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div
            onClick={handleFileClick}
            className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8"
          >
            <h3 className="text-center text-lg font-semibold">{t("input")}</h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              {t("supported-files")}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

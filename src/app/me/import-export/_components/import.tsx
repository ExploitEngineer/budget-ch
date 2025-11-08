"use client";

import { useState } from "react";
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
import Papa from "papaparse";

export function Import() {
  const t = useTranslations("main-dashboard.import-export-page.import-section");

  const [selectedType, setSelectedType] = useState<string>("transactions");

  const [imports, setImports] = useState<
    Record<string, { data: any[]; fileName?: string }>
  >({
    transactions: { data: [], fileName: "" },
    budgets: { data: [], fileName: "" },
    "saving-goals": { data: [], fileName: "" },
    accounts: { data: [], fileName: "" },
    transfers: { data: [], fileName: "" },
    "full-export": { data: [], fileName: "" },
  });

  const handleFileClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.json";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileName = file.name;
      const text = await file.text();

      if (file.name.endsWith(".json")) {
        try {
          const jsonData = JSON.parse(text);
          setImports((prev) => ({
            ...prev,
            [selectedType]: { data: jsonData, fileName },
          }));
        } catch (err) {
          console.error("Invalid JSON:", err);
        }
      } else if (file.name.endsWith(".csv")) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            setImports((prev) => ({
              ...prev,
              [selectedType]: { data: result.data, fileName },
            }));
          },
          error: (error) => {
            console.error("CSV parse error:", error);
          },
        });
      } else {
        console.warn("Unsupported file type");
      }
    };
    input.click();
  };

  const currentImport = imports[selectedType];

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge
            variant="outline"
            className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
          >
            {t("badge")}
          </Badge>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent>
          {/* --- SELECT BOXES --- */}
          <div className="flex items-center justify-between gap-2">
            <Select onValueChange={(value) => setSelectedType(value)}>
              <SelectTrigger className="!bg-dark-blue-background dark:border-border-blue w-full cursor-pointer">
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent className="dark:bg-dark-blue-background bg-white">
                <SelectItem value="transactions">
                  {t("data-type.transactions")}
                </SelectItem>
                <SelectItem value="budgets">
                  {t("data-type.budgets")}
                </SelectItem>
                <SelectItem value="saving-goals">
                  {t("data-type.saving-goals")}
                </SelectItem>
                <SelectItem value="accounts">
                  {t("data-type.accounts")}
                </SelectItem>
                <SelectItem value="transfers">
                  {t("data-type.transfers")}
                </SelectItem>
                <SelectItem value="full-export">
                  {t("data-type.full-export")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="!bg-dark-blue-background dark:border-border-blue w-full cursor-pointer">
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent className="dark:bg-dark-blue-background bg-white">
                <SelectItem value="append">{t("modes.append")}</SelectItem>
                <SelectItem value="replace-existing">
                  {t("modes.replace-existing")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* --- FILE UPLOAD --- */}
          <div
            onClick={handleFileClick}
            className="bg-dark-blue-background mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8"
          >
            <h3 className="text-center text-lg font-semibold">{t("input")}</h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              {t("supported-files")}
            </p>
            {currentImport.fileName && (
              <p className="mt-4 text-sm text-gray-400">
                {currentImport.fileName}
              </p>
            )}
          </div>

          {/* --- DATA PREVIEW --- */}
          {currentImport.data.length > 0 && (
            <div className="dark:bg-dark-blue-background mt-6 max-h-64 overflow-auto rounded-md bg-white p-4">
              <h4 className="mb-2 font-semibold">Preview:</h4>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(currentImport.data, null, 2)}
              </pre>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500 italic">
            Imported as: {selectedType}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

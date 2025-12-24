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
import { Button } from "@/components/ui/button";
import { importDataAction, validateTransactionsAction, validateBudgetsAction, validateSavingGoalsAction, validateAccountsAction, validateTransfersAction, validateFullJsonAction } from "@/lib/services/import-service";
import type { ImportType, ImportMode, ValidationReport, FullJsonValidationReport } from "@/lib/services/import-service";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getFinancialAccounts } from "@/lib/api";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function Import() {
  const t = useTranslations("main-dashboard.import-export-page.import-section");

  const [selectedType, setSelectedType] = useState<string>("transactions");
  const [selectedMode, setSelectedMode] = useState<string>("append");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [fullJsonReport, setFullJsonReport] = useState<FullJsonValidationReport | null>(null);
  const [autoCreateAccounts, setAutoCreateAccounts] = useState<boolean>(false);
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState<boolean>(false);

  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const { data: accountsData } = useQuery({
    queryKey: ["financial-accounts", hubId],
    queryFn: () => getFinancialAccounts(hubId || ""),
    enabled: !!hubId,
  });

  const accounts = accountsData?.data || [];

  const [imports, setImports] = useState<
    Record<string, { data: any[]; fileName?: string }>
  >({
    transactions: { data: [], fileName: "" },
    budgets: { data: [], fileName: "" },
    "saving-goals": { data: [], fileName: "" },
    accounts: { data: [], fileName: "" },
    transfers: { data: [], fileName: "" },
    "full-export": { data: [], fileName: "" },
    "full-json": { data: [], fileName: "" },
  });


  const handleFile = async (file: File) => {
    if (!file) return;

    const fileName = file.name;
    const text = await file.text();

    if (file.name.endsWith(".json")) {
      try {
        const jsonData = JSON.parse(text);
        const processedData = Array.isArray(jsonData) ? jsonData : [jsonData];
        setImports((prev) => ({
          ...prev,
          [selectedType]: { data: processedData, fileName },
        }));
        await runValidation(processedData);
      } catch (err) {
        console.error("Invalid JSON:", err);
        toast.error("Invalid JSON file");
      }
    } else if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
          setImports((prev) => ({
            ...prev,
            [selectedType]: { data: result.data, fileName },
          }));
          await runValidation(result.data);
        },
        error: (error) => {
          console.error("CSV parse error:", error);
          toast.error("Error parsing CSV");
        },
      });
    } else {
      console.warn("Unsupported file type");
      toast.error("Unsupported file type. Please use .csv or .json");
    }
  };

  const runValidation = async (data: any[] | any) => {
    if (!hubId) return;

    setIsValidating(true);
    setValidationReport(null);
    setFullJsonReport(null);

    try {
      // Handle full JSON import (both 'full-json' and 'full-export' types)
      if (selectedType === "full-json" || selectedType === "full-export") {
        // For full-json, data is the parsed object (not an array)
        const jsonData = Array.isArray(data) ? data[0] : data;
        const report = await validateFullJsonAction(jsonData, hubId);
        setFullJsonReport(report);
      } else if (selectedType === "transactions" || selectedType === "budgets" || selectedType === "saving-goals" || selectedType === "accounts" || selectedType === "transfers") {
        let report;
        if (selectedType === "transactions") {
          report = await validateTransactionsAction(data, hubId);
        } else if (selectedType === "budgets") {
          report = await validateBudgetsAction(data, hubId);
        } else if (selectedType === "saving-goals") {
          report = await validateSavingGoalsAction(data, hubId);
        } else if (selectedType === "accounts") {
          report = await validateAccountsAction(data, hubId);
        } else {
          report = await validateTransfersAction(data, hubId);
        }
        setValidationReport(report);
      }
    } catch (err) {
      toast.error("Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.json";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!currentImport.data || currentImport.data.length === 0) {
      toast.error("Please select a file first");
      return;
    }

    if (!hubId) {
      toast.error("Hub ID not found");
      return;
    }

    if (selectedMode === "replace" && !showReplaceConfirm) {
      setShowReplaceConfirm(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await importDataAction(
        selectedType as ImportType,
        selectedMode as ImportMode,
        currentImport.data,
        hubId,
        autoCreateAccounts,
        skipDuplicates
      );

      if (result.success) {
        toast.success(`Successfully imported ${result.data?.count ?? 0} items!`);
        setImports({});
        setValidationReport(null);
        setAutoCreateAccounts(false);
        setSkipDuplicates(true);
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during import");
    } finally {
      setIsLoading(false);
    }
  };

  const currentImport = imports[selectedType] || { data: [], fileName: "" };

  const performImport = () => {
    setShowReplaceConfirm(false);
    handleImport();
  };

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
            <Select onValueChange={(value) => setSelectedType(value)} defaultValue="transactions">
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
                <SelectItem value="full-json">
                  {t("data-type.full-export")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setSelectedMode(value)} defaultValue="append">
              <SelectTrigger className="!bg-dark-blue-background dark:border-border-blue w-full cursor-pointer">
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent className="dark:bg-dark-blue-background bg-white">
                <SelectItem value="append">{t("modes.append")}</SelectItem>
                <SelectItem value="replace">{t("modes.replace-existing")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* --- FILE UPLOAD --- */}
          <div
            onClick={handleFileClick}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`bg-dark-blue-background mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-border-blue"
              }`}
          >
            <h3 className="text-center text-lg font-semibold">{t("input")}</h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              {t("supported-files")}
            </p>
            {currentImport.fileName && (
              <p className="mt-4 text-sm text-primary font-medium">
                📄 {currentImport.fileName}
              </p>
            )}
          </div>

          {/* --- VALIDATION REPORT --- */}
          {isValidating && (
            <div className="mt-6 flex items-center justify-center p-4 border rounded-lg border-dashed">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Validating data...</span>
            </div>
          )}

          {validationReport && !isValidating && (
            <div className="mt-6 space-y-4">
              <Card className="dark:bg-dark-blue-background/50 border-border-blue">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      {validationReport.invalidRows > 0 ? (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-semibold leading-none tracking-tight mb-2">
                        {t("validation-results") || "Validation Results"}
                      </h5>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-green-500 font-medium">
                            {t("valid-rows", { count: validationReport.validRows })}
                          </span>
                          {validationReport.invalidRows > 0 && (
                            <span className="text-destructive ml-1">
                              {t("invalid-rows", { count: validationReport.invalidRows })}
                            </span>
                          )}
                        </p>
                        {validationReport.potentialDuplicates > 0 && (
                          <div className="mt-2 space-y-2">
                            <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400">
                              <p className="flex items-center gap-1.5 font-medium">
                                <AlertTriangle className="h-4 w-4" />
                                {t("potential-duplicates", { count: validationReport.potentialDuplicates })}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`w-full h-8 text-xs transition-colors ${skipDuplicates ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'dark:border-border-blue'}`}
                              onClick={() => setSkipDuplicates(!skipDuplicates)}
                            >
                              {skipDuplicates ? t("duplicates-ignored-info") : t("skip-duplicates-label")}
                            </Button>
                          </div>
                        )}
                        {validationReport.allCategories.length > 0 && (
                          <p className="text-gray-400 text-xs italic">
                            ℹ️ {t("categories-found", { count: validationReport.allCategories.length })}
                          </p>
                        )}
                        {validationReport.newCategories.length > 0 && (
                          <div className="mt-2 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            <p className="font-medium">
                              ✨ {t("new-categories-info", { count: validationReport.newCategories.length })}
                            </p>
                            <p className="text-[10px] opacity-70 mt-0.5">
                              {validationReport.newCategories.join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {validationReport.missingAccounts.length > 0 && (
                    <div className={`mt-6 p-4 rounded-lg border transition-colors ${autoCreateAccounts ? 'border-blue-500/20 bg-blue-500/5 text-blue-400' : 'border-orange-500/20 bg-orange-500/5 text-orange-400'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <p className="flex items-center gap-2 font-medium">
                          {autoCreateAccounts ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                          <span className="leading-tight">
                            {autoCreateAccounts
                              ? t("new-accounts-auto-info", { count: validationReport.missingAccounts.length })
                              : t("new-accounts-found", { count: validationReport.missingAccounts.length }) || `${validationReport.missingAccounts.length} new accounts found in file.`
                            }
                          </span>
                        </p>
                        <div className="flex shrink-0">
                          {!autoCreateAccounts && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs border-orange-500/50 text-orange-400 hover:bg-orange-500/10 w-full sm:w-auto"
                              onClick={() => setAutoCreateAccounts(true)}
                            >
                              {t("create-missing-button")}
                            </Button>
                          )}
                          {autoCreateAccounts && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs text-blue-400/70 sm:ml-auto"
                              onClick={() => setAutoCreateAccounts(false)}
                            >
                              {t("cancel")}
                            </Button>
                          )}
                        </div>
                      </div>
                      {!autoCreateAccounts && (
                        <p className="text-[11px] mt-2 opacity-80">
                          {validationReport.missingAccounts.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* --- FULL JSON VALIDATION REPORT --- */}
          {fullJsonReport && !isValidating && (
            <div className="mt-6 space-y-4">
              <Card className="dark:bg-dark-blue-background/50 border-border-blue">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="w-full">
                      <h5 className="font-semibold leading-none tracking-tight mb-3">
                        {t("full-json-validation.title") || "Full Export Validation"}
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {fullJsonReport.accounts.count > 0 && (
                          <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10 border border-blue-500/20">
                            <span className="text-blue-400 font-medium">{fullJsonReport.accounts.count}</span>
                            <span className="text-blue-400/70">{t("data-type.accounts")}</span>
                          </div>
                        )}
                        {fullJsonReport.budgets.count > 0 && (
                          <div className="flex items-center gap-2 p-2 rounded bg-purple-500/10 border border-purple-500/20">
                            <span className="text-purple-400 font-medium">{fullJsonReport.budgets.count}</span>
                            <span className="text-purple-400/70">{t("data-type.budgets")}</span>
                          </div>
                        )}
                        {fullJsonReport.transactions.count > 0 && (
                          <div className="flex items-center gap-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                            <span className="text-green-400 font-medium">{fullJsonReport.transactions.count}</span>
                            <span className="text-green-400/70">{t("data-type.transactions")}</span>
                          </div>
                        )}
                        {fullJsonReport.savingGoals.count > 0 && (
                          <div className="flex items-center gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                            <span className="text-yellow-400 font-medium">{fullJsonReport.savingGoals.count}</span>
                            <span className="text-yellow-400/70">{t("data-type.saving-goals")}</span>
                          </div>
                        )}
                        {fullJsonReport.transfers.count > 0 && (
                          <div className="flex items-center gap-2 p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                            <span className="text-cyan-400 font-medium">{fullJsonReport.transfers.count}</span>
                            <span className="text-cyan-400/70">{t("data-type.transfers")}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        {t("full-json-validation.total", { count: fullJsonReport.totalItems }) || `Total: ${fullJsonReport.totalItems} items will be imported`}
                      </p>
                      {fullJsonReport.exportedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t("full-json-validation.exported-at") || "Exported"}: {new Date(fullJsonReport.exportedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* --- DATA PREVIEW --- */}
          {currentImport.data && currentImport.data.length > 0 && !validationReport && (
            <div className="dark:bg-dark-blue-background mt-6 max-h-64 overflow-auto rounded-md bg-white p-4">
              <h4 className="mb-2 font-semibold">Preview:</h4>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(currentImport.data.slice(0, 5), null, 2)}
                {currentImport.data.length > 5 && `\n... and ${currentImport.data.length - 5} more rows`}
              </pre>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500 italic">
            Imported as: {selectedType}
          </p>

          <Button
            onClick={handleImport}
            disabled={
              isLoading ||
              isValidating ||
              !currentImport.data ||
              currentImport.data.length === 0 ||
              (!autoCreateAccounts && (validationReport?.missingAccounts.length ?? 0) > 0)
            }
            className="btn-gradient mt-6 w-full cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : !autoCreateAccounts && (validationReport?.missingAccounts.length ?? 0) > 0 ? (
              t("create-missing-button")
            ) : (
              "Start Import"
            )}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showReplaceConfirm} onOpenChange={setShowReplaceConfirm}>
        <AlertDialogContent className="dark:bg-dark-blue-background">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("replace-confirmation.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("replace-confirmation.desc", { type: t(`data-type.${selectedType}`) })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{t("replace-confirmation.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                performImport();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("replace-confirmation.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

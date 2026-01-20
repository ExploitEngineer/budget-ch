"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfDay } from "date-fns";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import type { RecurringTemplateWithDetails } from "@/lib/types/domain-types";
import { archiveRecurringTransactionTemplate } from "@/lib/services/transaction";
import { transactionKeys } from "@/lib/query-keys";
import EditRecurringTemplateDialog from "./edit-recurring-template-dialog";

interface RecurringTemplatesTableProps {
  templates: RecurringTemplateWithDetails[];
  onTemplateUpdated?: () => void;
}

export default function RecurringTemplatesTable({
  templates,
  onTemplateUpdated,
}: RecurringTemplatesTableProps) {
  const t = useTranslations("main-dashboard.transactions-page.recurring-templates");
  const commonT = useTranslations("common");
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const queryClient = useQueryClient();

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RecurringTemplateWithDetails | null>(null);

  const archiveMutation = useMutation({
    mutationFn: ({ templateId, archive }: { templateId: string; archive: boolean }) =>
      archiveRecurringTransactionTemplate(templateId, archive),
    onSuccess: (result, variables) => {
      // Invalidate both archived and non-archived queries
      queryClient.invalidateQueries({
        queryKey: transactionKeys.recurringTemplates(hubId, true),
      });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.recurringTemplates(hubId, false),
      });
      // Also invalidate upcoming recurring transactions
      queryClient.invalidateQueries({
        queryKey: transactionKeys.upcomingRecurring(hubId),
      });
      toast.success(
        variables.archive ? t("archive.success") : t("unarchive.success")
      );
      onTemplateUpdated?.();
      setArchiveDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to archive template");
    },
  });

  const handleArchiveClick = (template: RecurringTemplateWithDetails) => {
    setSelectedTemplate(template);
    setArchiveDialogOpen(true);
  };

  const handleConfirmArchive = () => {
    if (selectedTemplate) {
      const isArchived = !!selectedTemplate.archivedAt;
      archiveMutation.mutate({
        templateId: selectedTemplate.id,
        archive: !isArchived,
      });
    }
  };

  // Calculate next occurrence for a template
  const getNextOccurrence = (template: RecurringTemplateWithDetails): string | null => {
    if (template.status === "inactive") {
      return null;
    }

    const today = startOfDay(new Date());
    let baseDate: Date;

    if (template.lastGeneratedDate) {
      baseDate = startOfDay(new Date(template.lastGeneratedDate));
    } else {
      baseDate = startOfDay(new Date(template.startDate));
      // If start date hasn't occurred yet, that's the next occurrence
      if (baseDate >= today) {
        return format(baseDate, "dd/MM/yyyy");
      }
    }

    // Calculate next occurrence from base date
    const nextDate = addDays(baseDate, template.frequencyDays);

    // If there's an end date and next occurrence is after it, return null
    if (template.endDate) {
      const endDate = startOfDay(new Date(template.endDate));
      if (nextDate > endDate) {
        return null;
      }
    }

    return format(nextDate, "dd/MM/yyyy");
  };

  // Format transaction type with proper capitalization
  const formatType = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow className="dark:border-border-blue">
            <TableHead className="font-bold text-gray-500 dark:text-gray-400/80">
              {t("table.headings.name")}
            </TableHead>
            <TableHead className="font-bold text-gray-500 dark:text-gray-400/80">
              {t("table.headings.account")}
            </TableHead>
            <TableHead className="font-bold text-gray-500 dark:text-gray-400/80">
              {t("table.headings.type")}
            </TableHead>
            <TableHead className="font-bold text-gray-500 dark:text-gray-400/80">
              {t("table.headings.amount")}
            </TableHead>
            <TableHead className="font-bold text-gray-500 dark:text-gray-400/80">
              {t("table.headings.frequency")}
            </TableHead>
            <TableHead className="font-bold text-gray-500 dark:text-gray-400/80">
              {t("table.headings.next-occurrence")}
            </TableHead>
            <TableHead className="font-bold text-gray-500 dark:text-gray-400/80">
              {t("table.headings.status")}
            </TableHead>
            <TableHead className="font-bold text-gray-500 dark:text-gray-400/80">
              {t("table.headings.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => {
            const nextOccurrence = getNextOccurrence(template);

            return (
              <TableRow key={template.id} className="dark:border-border-blue">
                <TableCell className="font-medium">
                  {template.source || template.categoryName || "—"}
                </TableCell>
                <TableCell>
                  {template.accountName || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      template.type === "income"
                        ? "border-green-500 text-green-600 dark:text-green-400"
                        : template.type === "expense"
                          ? "border-red-500 text-red-600 dark:text-red-400"
                          : "border-blue-500 text-blue-600 dark:text-blue-400"
                    }
                  >
                    {formatType(template.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {commonT("currency")} {template.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  {t("table.frequency-days", { days: template.frequencyDays })}
                </TableCell>
                <TableCell>
                  {nextOccurrence || t("table.next-occurrence-na")}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      template.archivedAt
                        ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                        : template.status === "active"
                          ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                          : "border-gray-400 bg-gray-50 text-gray-600 dark:bg-gray-800/20 dark:text-gray-400"
                    }
                  >
                    {template.archivedAt
                      ? t("table.status.archived")
                      : template.status === "active"
                        ? t("table.status.active")
                        : t("table.status.inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <EditRecurringTemplateDialog
                      templateId={template.id}
                      onSuccess={onTemplateUpdated}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchiveClick(template)}
                      disabled={archiveMutation.isPending}
                      title={template.archivedAt ? t("unarchive.button") : t("archive.button")}
                    >
                      {template.archivedAt ? (
                        <ArchiveRestore className="h-4 w-4" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Archive/Unarchive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedTemplate?.archivedAt
                ? t("unarchive.dialog.title")
                : t("archive.dialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTemplate?.archivedAt
                ? t("unarchive.dialog.description")
                : t("archive.dialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveMutation.isPending}>
              {t("archive.dialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmArchive}
              disabled={archiveMutation.isPending}
            >
              {selectedTemplate?.archivedAt
                ? t("unarchive.dialog.confirm")
                : t("archive.dialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

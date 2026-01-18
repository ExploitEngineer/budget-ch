"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { format, addDays, startOfDay } from "date-fns";
import type { RecurringTemplateWithDetails } from "@/lib/types/domain-types";
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
        const newDate = format(baseDate, "d.M.yyyy");
        return newDate;
      }
    }

    // Calculate next occurrence from base date
    const nextDate = addDays(baseDate, template.frequencyDays);

    // If there's an end date and next occurrence is after it, return null
    if (template.endDate) {
      const endDate = startOfDay(new Date(template.endDate));
      console.log(`${template.id} - endDate: ${endDate}`);
      if (nextDate > endDate) {
        return null;
      }
    }

    const newDate = format(nextDate, "d.M.yyyy");
    return format(nextDate, "d.M.yyyy");
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
                      template.status === "active"
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                        : "border-gray-400 bg-gray-50 text-gray-600 dark:bg-gray-800/20 dark:text-gray-400"
                    }
                  >
                    {template.status === "active"
                      ? t("table.status.active")
                      : t("table.status.inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <EditRecurringTemplateDialog
                    templateId={template.id}
                    onSuccess={onTemplateUpdated}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

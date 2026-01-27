"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatInAppTimezone } from "@/lib/timezone";

interface AuditLog {
  id: string;
  action: string;
  affectedUserId: string | null;
  adminId: string;
  reference: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  admin?: {
    name: string;
    email: string;
  };
  affectedUser?: {
    name: string;
    email: string;
  };
}

interface AuditLogsResponse {
  success: boolean;
  data?: {
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

const ACTION_TYPES = [
  "user_locked",
  "user_unlocked",
  "user_deleted",
  "user_anonymized",
  "user_exported",
  "invitation_created",
  "invitation_accepted",
  "subscription_granted",
] as const;

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const t = useTranslations("admin");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchQuery) {
        params.set("search", searchQuery);
      }
      if (actionFilter && actionFilter !== "all") {
        params.set("action", actionFilter);
      }

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data: AuditLogsResponse = await res.json();

      if (data.success && data.data) {
        setLogs(data.data.logs);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
      } else {
        toast.error(data.message || "Failed to fetch audit logs");
      }
    } catch {
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set("search", searchQuery);
      }
      if (actionFilter && actionFilter !== "all") {
        params.set("action", actionFilter);
      }

      const res = await fetch(
        `/api/admin/audit-logs/export?${params.toString()}`
      );

      if (!res.ok) {
        throw new Error("Failed to export audit logs");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t("audit.export-success"));
    } catch {
      toast.error(t("audit.export-error"));
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return formatInAppTimezone(new Date(dateString), "MM/dd/yyyy");
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      user_locked: "destructive",
      user_unlocked: "secondary",
      user_deleted: "destructive",
      user_anonymized: "destructive",
      user_exported: "outline",
      invitation_created: "default",
      invitation_accepted: "default",
      subscription_granted: "default",
    };

    return (
      <Badge variant={variants[action] || "secondary"} className="text-xs">
        {t(`audit.actions.${action}`)}
      </Badge>
    );
  };

  const getAffectedDisplay = (log: AuditLog) => {
    if (log.affectedUser) {
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{log.affectedUser.name}</span>
          <span className="text-xs text-muted-foreground">
            {log.affectedUser.email}
          </span>
        </div>
      );
    }
    if (log.affectedUserId) {
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {log.affectedUserId.substring(0, 8)}...
        </span>
      );
    }
    if (log.metadata && typeof log.metadata === "object" && "email" in log.metadata) {
      return (
        <span className="text-sm text-muted-foreground">
          {log.metadata.email as string}
        </span>
      );
    }
    return <span className="text-muted-foreground">—</span>;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("audit.title")}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t("audit.description")}</p>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <form
            onSubmit={handleSearch}
            className="flex gap-2 w-full sm:w-auto"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("audit.search-placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-[250px]"
              />
            </div>
            <Button type="submit" variant="secondary">
              {t("audit.search")}
            </Button>
          </form>

          <Select
            value={actionFilter}
            onValueChange={(value) => {
              setActionFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("audit.filter-action")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("audit.all-actions")}</SelectItem>
              {ACTION_TYPES.map((action) => (
                <SelectItem key={action} value={action}>
                  {t(`audit.actions.${action}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExport} disabled={isExporting} variant="outline" className="w-full lg:w-auto">
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? t("audit.exporting") : t("audit.export-csv")}
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table Info */}
          <div className="text-sm text-muted-foreground">
            {t("audit.showing", { count: logs.length, total })}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">{t("audit.columns.time")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.columns.action")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.columns.affected")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.columns.trigger")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("audit.columns.ref")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t("audit.no-logs")}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{getActionBadge(log.action)}</TableCell>
                      <TableCell className="whitespace-nowrap">{getAffectedDisplay(log)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {log.admin ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {log.admin.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {log.admin.email}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">
                            {log.adminId.substring(0, 8)}...
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {log.reference || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                {t("audit.page", { page, totalPages })}
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="flex-1 sm:flex-none"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("audit.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex-1 sm:flex-none"
                >
                  {t("audit.next")}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

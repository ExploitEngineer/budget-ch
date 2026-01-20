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
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminUser } from "../page";
import { UserActionsMenu } from "./user-actions-menu";
import { useTranslations } from "next-intl";

interface UsersTableProps {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export function UsersTable({
  users,
  total,
  page,
  totalPages,
  onPageChange,
  onRefresh,
}: UsersTableProps) {
  const t = useTranslations("admin");

  const getStatusBadge = (user: AdminUser) => {
    if (user.banned) {
      return (
        <Badge variant="destructive" className="text-xs">
          {t("users.table.status.locked")}
        </Badge>
      );
    }
    if (!user.emailVerified) {
      return (
        <Badge variant="secondary" className="text-xs">
          {t("users.table.status.unverified")}
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="text-xs bg-green-500">
        {t("users.table.status.active")}
      </Badge>
    );
  };

  const getPlanBadge = (user: AdminUser) => {
    if (!user.subscription?.plan) {
      return (
        <Badge variant="outline" className="text-xs">
          {t("users.table.plan.free")}
        </Badge>
      );
    }
    const plan = user.subscription.plan;
    const variant = plan === "family" ? "default" : "secondary";
    return (
      <Badge variant={variant} className="text-xs capitalize">
        {plan}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const truncateId = (id: string) => {
    return `${id.substring(0, 8)}...`;
  };

  return (
    <div className="space-y-4">
      {/* Table Info */}
      <div className="text-sm text-muted-foreground">
        {t("users.table.showing", { count: users.length, total })}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] whitespace-nowrap">{t("users.table.columns.id")}</TableHead>
              <TableHead className="whitespace-nowrap">{t("users.table.columns.user")}</TableHead>
              <TableHead className="whitespace-nowrap">{t("users.table.columns.status")}</TableHead>
              <TableHead className="whitespace-nowrap">{t("users.table.columns.plan")}</TableHead>
              <TableHead className="whitespace-nowrap">{t("users.table.columns.registered")}</TableHead>
              <TableHead className="text-right whitespace-nowrap">{t("users.table.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t("users.table.no-users")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {truncateId(user.id)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                      {user.role === "admin" && (
                        <Badge variant="outline" className="text-xs w-fit mt-1">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{getStatusBadge(user)}</TableCell>
                  <TableCell className="whitespace-nowrap">{getPlanBadge(user)}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <UserActionsMenu user={user} onRefresh={onRefresh} />
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
            {t("users.table.page", { page, totalPages })}
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("users.table.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="flex-1 sm:flex-none"
            >
              {t("users.table.next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

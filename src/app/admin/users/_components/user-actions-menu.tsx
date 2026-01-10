"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Download, Lock, Unlock, Trash2 } from "lucide-react";
import type { AdminUser } from "../page";
import { DeleteDialog } from "./delete-dialog";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface UserActionsMenuProps {
  user: AdminUser;
  onRefresh: () => void;
}

export function UserActionsMenu({ user, onRefresh }: UserActionsMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isToggleLock, setIsToggleLock] = useState(false);
  const t = useTranslations("admin");

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/export`);
      if (!res.ok) {
        throw new Error("Failed to export user data");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-${user.id}-export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t("users.actions.export-success"));
    } catch {
      toast.error(t("users.actions.export-error"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleLock = async () => {
    setIsToggleLock(true);
    try {
      const endpoint = user.isLocked
        ? `/api/admin/users/${user.id}/unlock`
        : `/api/admin/users/${user.id}/lock`;

      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update user");
      }

      toast.success(
        user.isLocked
          ? t("users.actions.unlock-success")
          : t("users.actions.lock-success")
      );
      onRefresh();
    } catch (err) {
      toast.error((err as Error).message || t("users.actions.lock-error"));
    } finally {
      setIsToggleLock(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t("users.actions.menu")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? t("users.actions.exporting") : t("users.actions.export")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleLock} disabled={isToggleLock}>
            {user.isLocked ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                {t("users.actions.unlock")}
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                {t("users.actions.lock")}
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("users.actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={user}
        onSuccess={onRefresh}
      />
    </>
  );
}

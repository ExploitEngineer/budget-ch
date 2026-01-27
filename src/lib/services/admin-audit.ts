"use server";

import { headers } from "next/headers";
import { requireRootAdmin } from "./admin-auth";
import {
  getAuditLogsWithFiltersDB,
  getAllAuditLogsForExportDB,
  getKPIStatsDB,
  type GetAuditLogsFilters,
  type AuditLogWithAdmin,
  type KPIStats,
} from "@/db/admin-queries";
import type { AdminActionType } from "@/db/schema";
import { formatInAppTimezone } from "@/lib/timezone";

// ============================================
// GET AUDIT LOGS
// ============================================

export async function getAuditLogs(filters: GetAuditLogsFilters = {}) {
  const hdrs = await headers();
  await requireRootAdmin(hdrs);

  return await getAuditLogsWithFiltersDB(filters);
}

// ============================================
// EXPORT AUDIT LOGS AS CSV
// ============================================

export async function exportAuditLogsCSV(filters?: {
  search?: string;
  action?: AdminActionType;
}): Promise<{ success: boolean; message?: string; data?: string }> {
  const hdrs = await headers();
  await requireRootAdmin(hdrs);

  try {
    const logs = await getAllAuditLogsForExportDB(filters);

    // Build CSV content
    const headers = ["Time", "Action", "Affected User", "Affected Email", "Triggered By", "Admin Email", "Reference"];
    const rows = logs.map((log) => [
      formatInAppTimezone(log.createdAt, "yyyy-MM-dd HH:mm:ss"),
      formatActionName(log.action),
      log.affectedUserId || "-",
      log.affectedUser?.email || "-",
      log.admin?.name || log.adminId,
      log.admin?.email || "-",
      log.reference || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    return { success: true, data: csvContent };
  } catch (err) {
    console.error("Error exporting audit logs:", err);
    return {
      success: false,
      message: `Failed to export audit logs: ${(err as Error).message}`,
    };
  }
}

// ============================================
// GET KPI STATS
// ============================================

export async function getKPIStats(): Promise<{
  success: boolean;
  message?: string;
  data?: KPIStats;
}> {
  const hdrs = await headers();
  await requireRootAdmin(hdrs);

  try {
    const stats = await getKPIStatsDB();
    return { success: true, data: stats };
  } catch (err) {
    console.error("Error fetching KPI stats:", err);
    return {
      success: false,
      message: `Failed to fetch KPI stats: ${(err as Error).message}`,
    };
  }
}

// ============================================
// HELPERS
// ============================================

function formatActionName(action: AdminActionType): string {
  const actionNames: Record<AdminActionType, string> = {
    user_locked: "Account locked",
    user_unlocked: "Account unlocked",
    user_deleted: "Account deleted",
    user_anonymized: "Account anonymized",
    user_exported: "Export created",
    invitation_created: "Invitation sent",
    invitation_accepted: "Invitation accepted",
    subscription_granted: "Subscription granted",
  };

  return actionNames[action] || action;
}

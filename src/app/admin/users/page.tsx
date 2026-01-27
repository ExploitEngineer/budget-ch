"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, UserPlus, RotateCcw } from "lucide-react";
import { UsersTable } from "./_components/users-table";
import { InviteDialog } from "./_components/invite-dialog";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  banned: boolean;
  emailVerified: boolean;
  createdAt: string;
  subscription: {
    subscriptionPlan: string | null;
    status: string | null;
  } | null;
}

interface UsersResponse {
  success: boolean;
  data?: {
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_desc");
  const t = useTranslations("admin");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (searchQuery) {
        params.set("search", searchQuery);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (planFilter !== "all") {
        params.set("plan", planFilter);
      }
      if (sortBy) {
        params.set("sort", sortBy);
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data: UsersResponse = await res.json();

      if (data.success && data.data) {
        setUsers(data.data.users);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
        console.log("[Admin Users] DATA: ", data.data);
      } else {
        toast.error(data.message || "Failed to fetch users");
      }
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, planFilter, sortBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchUsers();
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setPlanFilter("all");
    setSortBy("created_desc");
    setSearchQuery("");
    setPage(1);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("users.title")}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t("users.description")}</p>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("users.search-placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[300px]"
            />
          </div>
          <Button type="submit" variant="secondary">
            {t("users.search")}
          </Button>
        </form>

        <Button onClick={() => setInviteDialogOpen(true)} className="w-full lg:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          {t("users.invite")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <span className="text-muted-foreground mr-1">{t("users.filters.status")}</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("users.filters.all")}</SelectItem>
            <SelectItem value="active">{t("users.filters.status-active")}</SelectItem>
            <SelectItem value="banned">{t("users.filters.status-banned")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[140px]">
            <span className="text-muted-foreground mr-1">{t("users.filters.plan")}</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("users.filters.all")}</SelectItem>
            <SelectItem value="free">{t("users.filters.plan-free")}</SelectItem>
            <SelectItem value="individual">{t("users.filters.plan-individual")}</SelectItem>
            <SelectItem value="family">{t("users.filters.plan-family")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <span className="text-muted-foreground mr-1">{t("users.filters.sort")}</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_desc">{t("users.filters.sort-created-desc")}</SelectItem>
            <SelectItem value="created_asc">{t("users.filters.sort-created-asc")}</SelectItem>
            <SelectItem value="name_asc">{t("users.filters.sort-name-asc")}</SelectItem>
            <SelectItem value="name_desc">{t("users.filters.sort-name-desc")}</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="secondary" onClick={handleApplyFilters}>
          {t("users.filters.apply")}
        </Button>

        <Button variant="ghost" size="icon" onClick={handleResetFilters} title={t("users.filters.reset")}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <UsersTable
          users={users}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRefresh={handleRefresh}
        />
      )}

      {/* Invite Dialog */}
      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

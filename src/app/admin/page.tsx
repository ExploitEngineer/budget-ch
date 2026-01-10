"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  DollarSign,
  Shield,
  Server,
  Lock,
  Database,
  Globe,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "next-intl";

interface KPIStats {
  mrr: number;
  mrrPreviousMonth: number;
  activeSubscriptions: {
    total: number;
    individual: number;
    family: number;
  };
  activeUsers: {
    total: number;
    blocked: number;
  };
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("admin");

  useEffect(() => {
    async function fetchKPIs() {
      try {
        const res = await fetch("/api/admin/kpis");
        if (!res.ok) {
          throw new Error("Failed to fetch KPIs");
        }
        const data = await res.json();
        setStats(data.data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchKPIs();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const mrrChange = stats
    ? calculateChange(stats.mrr, stats.mrrPreviousMonth)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("overview.title")}</h1>
        <p className="text-muted-foreground">{t("overview.description")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* MRR Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("overview.kpi.mrr")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.mrr || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {mrrChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={mrrChange >= 0 ? "text-green-500" : "text-red-500"}>
                {mrrChange >= 0 ? "+" : ""}
                {mrrChange.toFixed(1)}%
              </span>
              <span>{t("overview.kpi.vs-last-month")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Subscriptions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("overview.kpi.active-subscriptions")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeSubscriptions.total || 0}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Badge variant="secondary" className="text-xs">
                {stats?.activeSubscriptions.individual || 0} {t("overview.kpi.individual")}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {stats?.activeSubscriptions.family || 0} {t("overview.kpi.family")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Active Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("overview.kpi.active-users")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeUsers.total || 0}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Badge variant="outline" className="text-xs">
                {stats?.activeUsers.blocked || 0} {t("overview.kpi.blocked")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {t("overview.system-status.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{t("overview.system-status.region")}</p>
                  <p className="text-xs text-muted-foreground">
                    AWS eu-central-1 (Frankfurt)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">{t("overview.system-status.encryption")}</p>
                  <p className="text-xs text-muted-foreground">
                    At-rest (KMS) &middot; In-transit (TLS)
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">{t("overview.system-status.logs")}</p>
                  <p className="text-xs text-muted-foreground">
                    Technically minimal &middot; IP address abbreviated
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">{t("overview.system-status.storage")}</p>
                  <p className="text-xs text-muted-foreground">
                    Retention policy in the backend
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

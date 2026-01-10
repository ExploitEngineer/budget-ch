"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Server,
  Eye,
  FileDown,
  Lock,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface ComplianceItem {
  icon: React.ReactNode;
  title: string;
  value: string;
  badge?: string;
}

export default function AdminCompliancePage() {
  const t = useTranslations("admin");

  const complianceItems: ComplianceItem[] = [
    {
      icon: <Shield className="h-5 w-5 text-blue-500" />,
      title: t("compliance.items.data-principle.title"),
      value: t("compliance.items.data-principle.value"),
      badge: "Privacy by Design",
    },
    {
      icon: <Server className="h-5 w-5 text-green-500" />,
      title: t("compliance.items.cloud-storage.title"),
      value: t("compliance.items.cloud-storage.value"),
      badge: "EU-only",
    },
    {
      icon: <Eye className="h-5 w-5 text-purple-500" />,
      title: t("compliance.items.tracking.title"),
      value: t("compliance.items.tracking.value"),
    },
    {
      icon: <FileDown className="h-5 w-5 text-orange-500" />,
      title: t("compliance.items.data-subject-rights.title"),
      value: t("compliance.items.data-subject-rights.value"),
      badge: "GDPR Art. 15-20",
    },
    {
      icon: <UserCheck className="h-5 w-5 text-cyan-500" />,
      title: t("compliance.items.admin-access.title"),
      value: t("compliance.items.admin-access.value"),
    },
    {
      icon: <Lock className="h-5 w-5 text-red-500" />,
      title: t("compliance.items.security.title"),
      value: t("compliance.items.security.value"),
      badge: "2FA Required",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("compliance.title")}</h1>
        <p className="text-muted-foreground">{t("compliance.description")}</p>
      </div>

      {/* Compliance Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {complianceItems.map((item, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  {item.icon}
                  {item.title}
                </div>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Privacy Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ExternalLink className="h-5 w-5 text-blue-500" />
            {t("compliance.privacy-policy.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {t("compliance.privacy-policy.description")}
          </p>
          <Link
            href="https://budgethub.ch/datenschutz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            budgethub.ch/datenschutz
            <ExternalLink className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>

      {/* Technical Measures Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("compliance.technical-measures.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              {t("compliance.technical-measures.encryption-at-rest")}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              {t("compliance.technical-measures.encryption-in-transit")}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              {t("compliance.technical-measures.access-logging")}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              {t("compliance.technical-measures.data-backup")}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              {t("compliance.technical-measures.session-management")}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              {t("compliance.technical-measures.ip-anonymization")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

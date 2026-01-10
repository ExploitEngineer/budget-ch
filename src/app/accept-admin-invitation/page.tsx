"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  acceptAdminInvitation,
  getInvitationByToken,
} from "@/lib/services/admin-invitation";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  LogIn,
  Clock,
  UserX,
  AlertCircle,
  Gift,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import Link from "next/link";

type StatusType =
  | "loading"
  | "pending"
  | "accepted"
  | "error"
  | "not_authenticated"
  | "no_account"
  | "expired"
  | "already_accepted"
  | "email_mismatch"
  | "invalid";

interface InvitationInfo {
  email: string;
  role: "user" | "root_admin";
  hasSubscription: boolean;
  subscriptionPlan?: string | null;
  subscriptionMonths?: number | null;
  expired: boolean;
  accepted: boolean;
}

export default function AcceptAdminInvitationPage() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const t = useTranslations("admin.accept-invitation");

  const [status, setStatus] = useState<StatusType>("loading");
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(
    null
  );
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const fetchInvitation = async () => {
      const res = await getInvitationByToken(token);

      if (!res.success || !res.data) {
        setStatus("invalid");
        return;
      }

      setInvitationInfo(res.data);

      if (res.data.accepted) {
        setStatus("already_accepted");
        return;
      }

      if (res.data.expired) {
        setStatus("expired");
        return;
      }

      setStatus("pending");
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setIsAccepting(true);

    const res = await acceptAdminInvitation(token);

    if (res.success) {
      toast.success(t("success.toast"));
      setStatus("accepted");
      setTimeout(() => {
        router.push("/me/dashboard");
      }, 2000);
    } else {
      setStatus(res.status as StatusType || "error");
    }

    setIsAccepting(false);
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-10 w-10" />
            <p className="text-gray-500">{t("loading")}</p>
          </div>
        );

      case "pending":
        return (
          <div className="flex flex-col items-center gap-4">
            <Shield className="h-12 w-12 text-blue-500" />
            <h2 className="text-lg font-semibold text-blue-600">
              {t("pending.title")}
            </h2>
            <p className="text-center text-gray-600">{t("pending.description")}</p>

            {/* Invitation details */}
            {invitationInfo && (
              <div className="w-full space-y-3 mt-2">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{t("pending.email")}</p>
                  <p className="font-medium">{invitationInfo.email}</p>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{t("pending.role")}</p>
                  <Badge variant={invitationInfo.role === "root_admin" ? "default" : "secondary"}>
                    {invitationInfo.role === "root_admin"
                      ? t("pending.role-admin")
                      : t("pending.role-user")}
                  </Badge>
                </div>

                {invitationInfo.hasSubscription && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        {t("pending.subscription-included")}
                      </p>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                      {invitationInfo.subscriptionPlan === "family"
                        ? t("pending.plan-family")
                        : t("pending.plan-individual")}{" "}
                      &middot; {invitationInfo.subscriptionMonths}{" "}
                      {invitationInfo.subscriptionMonths === 1
                        ? t("pending.month")
                        : t("pending.months")}
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full mt-4"
            >
              {isAccepting ? t("pending.accepting") : t("pending.accept-button")}
            </Button>
          </div>
        );

      case "accepted":
        return (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h2 className="text-lg font-semibold text-green-600">
              {t("success.title")}
            </h2>
            <p className="text-gray-600">{t("success.redirecting")}</p>
            <Button
              variant="outline"
              onClick={() => router.push("/me/dashboard")}
              className="mt-2"
            >
              {t("success.button")}
            </Button>
          </div>
        );

      case "not_authenticated":
        return (
          <div className="flex flex-col items-center gap-4">
            <LogIn className="h-12 w-12 text-blue-500" />
            <h2 className="text-lg font-semibold text-blue-600">
              {t("not-authenticated.title")}
            </h2>
            <p className="text-center text-gray-600">
              {t("not-authenticated.description")}
            </p>
            <Button asChild className="mt-2">
              <Link href="/login">{t("not-authenticated.button")}</Link>
            </Button>
          </div>
        );

      case "no_account":
        return (
          <div className="flex flex-col items-center gap-4">
            <UserX className="h-12 w-12 text-orange-500" />
            <h2 className="text-lg font-semibold text-orange-600">
              {t("no-account.title")}
            </h2>
            <p className="text-center text-gray-600">
              {t("no-account.description")}
            </p>
            <Button asChild className="mt-2">
              <Link href="/signup">{t("no-account.button")}</Link>
            </Button>
          </div>
        );

      case "invalid":
        return (
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-orange-500" />
            <h2 className="text-lg font-semibold text-orange-600">
              {t("invalid.title")}
            </h2>
            <p className="text-center text-gray-600">{t("invalid.description")}</p>
          </div>
        );

      case "expired":
        return (
          <div className="flex flex-col items-center gap-4">
            <Clock className="h-12 w-12 text-orange-500" />
            <h2 className="text-lg font-semibold text-orange-600">
              {t("expired.title")}
            </h2>
            <p className="text-center text-gray-600">{t("expired.description")}</p>
          </div>
        );

      case "already_accepted":
        return (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="h-12 w-12 text-blue-500" />
            <h2 className="text-lg font-semibold text-blue-600">
              {t("already-accepted.title")}
            </h2>
            <p className="text-center text-gray-600">
              {t("already-accepted.description")}
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/me/dashboard">{t("success.button")}</Link>
            </Button>
          </div>
        );

      case "email_mismatch":
        return (
          <div className="flex flex-col items-center gap-4">
            <UserX className="h-12 w-12 text-red-500" />
            <h2 className="text-lg font-semibold text-red-600">
              {t("email-mismatch.title")}
            </h2>
            <p className="text-center text-gray-600">
              {t("email-mismatch.description")}
            </p>
            <Button asChild className="mt-2">
              <Link href="/login">{t("not-authenticated.button")}</Link>
            </Button>
          </div>
        );

      case "error":
      default:
        return (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-lg font-semibold text-red-600">
              {t("error.title")}
            </h2>
            <p className="text-center text-gray-600">{t("error.description")}</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-blue-background/30 dark:bg-dark-blue-background flex h-screen w-full items-center justify-center px-4">
      <div className="flex h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md p-6">
          <CardContent className="flex flex-col items-center">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

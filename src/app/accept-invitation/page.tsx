"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { acceptHubInvitation } from "@/lib/services/hub-invitation";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  LogIn,
  Clock,
  UserX,
  Users,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Link from "next/link";

type StatusType =
  | "pending"
  | "accepted"
  | "error"
  | "not-authenticated"
  | "not-found"
  | "expired"
  | "already-accepted"
  | "email-mismatch"
  | "already-member";

// Map server error messages to status types
function getStatusFromMessage(message: string): StatusType {
  switch (message) {
    case "Not authenticated":
      return "not-authenticated";
    case "Invitation not found":
      return "not-found";
    case "Invitation expired":
      return "expired";
    case "Invitation already accepted":
      return "already-accepted";
    case "You cannot accept this invitation (email does not match)":
      return "email-mismatch";
    case "You are already a member of this hub":
      return "already-member";
    default:
      return "error";
  }
}

export default function AcceptInvitationPage() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const t = useTranslations("public-pages.accept-invitation");

  const [status, setStatus] = useState<StatusType>("pending");
  const [countdown, setCountdown] = useState<number>(3);
  const [acceptedHubId, setAcceptedHubId] = useState<string | null>(null);

  useEffect((): void => {
    if (!token) {
      setStatus("not-found");
      return;
    }

    const run = async (): Promise<void> => {
      const res = await acceptHubInvitation(token);

      if (res.success && res.data?.hubId) {
        toast.success(t("success.toast"));
        setStatus("accepted");
        setAcceptedHubId(res.data.hubId);

        try {
          // Navigate to dashboard with hub query parameter
          const dashboardUrl = `/me/dashboard?hub=${res.data.hubId}`;
          setTimeout(() => {
            router.push(dashboardUrl);
          }, 2000);
        } catch (err) {
          console.error("Failed to set hub cookie:", err);
          toast.error(t("error.set-hub-failed"));
          setStatus("error");
        }
      } else {
        const errorStatus = getStatusFromMessage(res.message || "");
        setStatus(errorStatus);
      }
    };

    run();
  }, [token, router, t]);

  const renderContent = () => {
    switch (status) {
      case "pending":
        return (
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-10 w-10" />
            <p className="text-gray-500">{t("pending")}</p>
          </div>
        );

      case "accepted":
        return (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h2 className="text-lg font-semibold text-green-600">
              {t("success.title")}
            </h2>
            <p className="text-gray-600">
              {t("success.redirecting", { countdown })}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                // Navigate to dashboard with hub query parameter
                if (acceptedHubId) {
                  router.push(`/me/dashboard?hub=${acceptedHubId}`);
                } else {
                  router.push("/me/dashboard");
                }
              }}
              className="mt-2"
            >
              {t("success.button")}
            </Button>
          </div>
        );

      case "not-authenticated":
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

      case "not-found":
        return (
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-orange-500" />
            <h2 className="text-lg font-semibold text-orange-600">
              {t("not-found.title")}
            </h2>
            <p className="text-center text-gray-600">
              {t("not-found.description")}
            </p>
          </div>
        );

      case "expired":
        return (
          <div className="flex flex-col items-center gap-4">
            <Clock className="h-12 w-12 text-orange-500" />
            <h2 className="text-lg font-semibold text-orange-600">
              {t("expired.title")}
            </h2>
            <p className="text-center text-gray-600">
              {t("expired.description")}
            </p>
          </div>
        );

      case "already-accepted":
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

      case "email-mismatch":
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

      case "already-member":
        return (
          <div className="flex flex-col items-center gap-4">
            <Users className="h-12 w-12 text-blue-500" />
            <h2 className="text-lg font-semibold text-blue-600">
              {t("already-member.title")}
            </h2>
            <p className="text-center text-gray-600">
              {t("already-member.description")}
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/me/dashboard">{t("success.button")}</Link>
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

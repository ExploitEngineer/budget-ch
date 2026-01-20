"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban, AlertCircle, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

// Not used anywhere, but kept for reference
export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const t = useTranslations("auth-error");

  const isBanned = error === "banned";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-8 px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Icon */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isBanned
                  ? "bg-red-100 text-red-600"
                  : "bg-yellow-100 text-yellow-600"
              }`}
            >
              {isBanned ? (
                <Ban className="w-8 h-8" />
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900">
              {isBanned ? t("banned.title") : t("generic.title")}
            </h1>

            {/* Description */}
            <p className="text-gray-600">
              {isBanned
                ? t("banned.description")
                : errorDescription || t("generic.description")}
            </p>

            {/* Additional info for banned users */}
            {isBanned && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-full">
                <p className="text-sm text-red-700">{t("banned.contact")}</p>
              </div>
            )}

            {/* Error code */}
            {error && (
              <p className="text-xs text-gray-400">
                {t("error-code")}: {error}
              </p>
            )}

            {/* Action button */}
            <Link href="/" className="w-full mt-4">
              <Button className="w-full" variant={isBanned ? "outline" : "default"}>
                <Home className="w-4 h-4 mr-2" />
                {t("back-home")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

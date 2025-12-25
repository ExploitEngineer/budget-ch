"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
    const t = useTranslations("common");

    return (
        <div
            className={`flex flex-col items-center justify-center gap-4 p-6 text-center ${className}`}
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {message || t("error")}
                </p>
            </div>
            {onRetry && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="gap-2 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
                >
                    <RefreshCw className="h-4 w-4" />
                    {t("retry")}
                </Button>
            )}
        </div>
    );
}

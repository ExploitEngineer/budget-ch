"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { Minus } from "lucide-react";
import Link from "next/link";

export default function VerifyEmail() {
  const t = useTranslations("authpages.verify-email");
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer > 0) {
      const timeout = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(timeout);
    }
  }, [timer]);

  const handleResend = () => {
    if (timer === 0) {
      setTimer(30);
    }
  };

  return (
    <Card className="w-full flex-1 border-1 p-6 shadow-lg sm:max-w-lg">
      <h1 className="text-center text-xl font-semibold">{t("title")}</h1>

      <div className="mt-6 space-y-4">
        <p className="text-foreground text-left text-base font-medium">
          {t("sub-heading")}
        </p>

        <div className="border-muted flex h-8 w-8 items-center justify-center rounded-full border">
          <Minus className="h-4 w-4" />
        </div>

        <div className="flex justify-between gap-3">
          <Button
            onClick={handleResend}
            disabled={timer > 0}
            className={`w-1/2 cursor-pointer rounded-xl py-5 font-bold text-white dark:bg-blue-600 ${
              timer > 0 ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {timer > 0
              ? `${t("buttons.resend")} (${timer}s)`
              : t("buttons.resend")}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-1/2 cursor-pointer rounded-xl py-5 font-bold"
          >
            <span className="underline">{t("buttons.change-email")}</span>
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="text-muted-foreground space-y-2 text-xs">
          <p>{t("tip")}</p>
          <p>{t("content")}</p>
        </div>

        <Link href="/signin" className="block">
          <Button
            variant="outline"
            className="mt-4 w-full cursor-pointer rounded-xl py-5 font-bold"
          >
            <span className="underline">{t("buttons.signin")}</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}

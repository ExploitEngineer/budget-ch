"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Goodbye() {
  const t = useTranslations("public-pages.goodbye");

  return (
    <div className="bg-blue-background/30 dark:bg-dark-blue-background flex h-screen w-full items-center justify-center px-4">
      <Card className="dark:bg-blue-background dark:border-border-blue w-full max-w-md rounded-2xl border p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <LogOut className="mb-4 h-16 w-16 text-orange-500" />

          <h1 className="mb-2 text-2xl font-bold">
            {t("title")}
          </h1>

          <p className="text-muted-foreground mb-6 text-sm">
            {t("description")}
          </p>

          <Link href="/" className="w-full">
            <Button className="btn-gradient w-full cursor-pointer rounded-xl py-5 font-semibold">
              {t("button")}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

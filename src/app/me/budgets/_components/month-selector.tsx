"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { useTranslations, useLocale } from "next-intl";

export function MonthSelector() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // URL params are 1-based, JS Date is 0-based
    const currentMonth = searchParams.get("month")
        ? parseInt(searchParams.get("month")!)
        : new Date().getMonth() + 1;
    const currentYear = searchParams.get("year")
        ? parseInt(searchParams.get("year")!)
        : new Date().getFullYear();

    const date = new Date(currentYear, currentMonth - 1, 1);

    const t = useTranslations("common");
    const locale = useLocale();

    const updateDate = (newDate: Date) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("month", (newDate.getMonth() + 1).toString());
        params.set("year", newDate.getFullYear().toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const localeMap: Record<string, any> = {
        en: require("date-fns/locale/en-US").enUS,
        de: require("date-fns/locale/de").de,
        fr: require("date-fns/locale/fr").fr,
        it: require("date-fns/locale/it").it,
    };

    const currentLocale = localeMap[locale] || localeMap.en;

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={() => updateDate(subMonths(date, 1))}
                className="h-8 w-8"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center font-medium">
                {format(date, "MMMM yyyy", { locale: currentLocale })}
            </span>
            <Button
                variant="outline"
                size="icon"
                onClick={() => updateDate(addMonths(date, 1))}
                className="h-8 w-8"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}

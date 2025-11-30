import { useTranslations } from "next-intl";
import type { CardsContent } from "@/lib/types/common-types";

export interface ActiveGoalsData {
  title: string;
  badgeValue: number;
  button: string;
  progress: number;
  accountBadge: string;
  remainingBadgeDays: number;
}

export function useSavingGoalsData() {
  const t = useTranslations("main-dashboard.saving-goals-page");

  const cards: CardsContent[] = [
    {
      title: t("cards.card-1.title"),
      content: "—",
      badge: t("cards.card-1.badge"),
    },
    {
      title: t("cards.card-2.title"),
      content: "—",
      badge: t("cards.card-2.badge"),
    },
    {
      title: t("cards.card-3.title"),
      content: "—",
      badge: t("cards.card-3.badge"),
    },
    {
      title: t("cards.card-4.title"),
      content: "—",
      badge: t("cards.card-4.badge"),
    },
  ];

  return { cards };
}

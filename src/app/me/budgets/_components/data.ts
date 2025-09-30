import { useTranslations } from "next-intl";

interface CardsContent {
  title: string;
  content: string;
  badge: string;
}

export function useBudgetData() {
  const t = useTranslations("main-dashboard.budgets-page");

  const cards: CardsContent[] = [
    {
      title: t("cards.card-1.title"),
      content: t("cards.card-1.content"),
      badge: t("cards.card-1.badge"),
    },
    {
      title: t("cards.card-2.title"),
      content: t("cards.card-2.content"),
      badge: t("cards.card-2.badge"),
    },
    {
      title: t("cards.card-3.title"),
      content: t("cards.card-3.content"),
      badge: t("cards.card-3.badge"),
    },
    {
      title: t("cards.card-4.title"),
      content: t("cards.card-4.content"),
      badge: t("cards.card-4.badge"),
    },
  ];
  return { cards };
}

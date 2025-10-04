import { useTranslations } from "next-intl";

export interface CardsContent {
  title: string;
  content: string;
  badge: string;
}

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

  const activeGoalsData: ActiveGoalsData[] = [
    {
      title: t("active-goals-section.cards.tax-reserves.header.title"),
      badgeValue: 65,
      button: t("active-goals-section.cards.tax-reserves.header.button"),
      progress: 80,
      accountBadge: t(
        "active-goals-section.cards.tax-reserves.content.account.save",
      ),
      remainingBadgeDays: 91,
    },
    {
      title: t("active-goals-section.cards.tax-reserves.header.title"),
      badgeValue: 22,
      button: t("active-goals-section.cards.tax-reserves.header.button"),
      progress: 40,
      accountBadge: t(
        "active-goals-section.cards.tax-reserves.content.checking-account",
      ),
      remainingBadgeDays: 91,
    },
    {
      title: t("active-goals-section.cards.tax-reserves.header.title"),
      badgeValue: 47,
      button: t("active-goals-section.cards.tax-reserves.header.button"),
      progress: 55,
      accountBadge: t(
        "active-goals-section.cards.tax-reserves.content.account.save",
      ),
      remainingBadgeDays: 91,
    },
  ];

  return { cards, activeGoalsData };
}

import { useTranslations } from "next-intl";

export interface WarningCards {
  title: string;
  badge?: string;
}

export function useDashboardData() {
  const t = useTranslations("main-dashboard");

  const warningCards: WarningCards[] = [
    {
      title: t("dashboard-page.warning-cards.card-1.title"),
      badge: t("dashboard-page.warning-cards.card-1.badge"),
    },
    {
      title: t("dashboard-page.warning-cards.card-2.title"),
      badge: t("dashboard-page.warning-cards.card-2.badge"),
    },
    {
      title: t("dashboard-page.warning-cards.card-3.title"),
    },
  ];

  return {
    warningCards,
  };
}

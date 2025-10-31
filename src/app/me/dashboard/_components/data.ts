import { useTranslations } from "next-intl";

interface HealthCards {
  title: string;
  value: string;
}

interface UpComingTables {
  name: string;
  account: string;
  amount: string;
}

interface WarningCards {
  title: string;
  badge?: string;
}

export function useDashboardData() {
  const t = useTranslations("main-dashboard");

  const healthCards: HealthCards[] = [
    { title: t("dashboard-page.cards.card-1.title"), value: "CHF 4’703" },
    { title: t("dashboard-page.cards.card-2.title"), value: "CHF 2’456" },
    { title: t("dashboard-page.cards.card-3.title"), value: "3" },
  ];

  const upComingTables: UpComingTables[] = [
    {
      name: t(
        "dashboard-page.upcoming-cards.table-data.table-heading.name.data.insurance",
      ),
      account: t(
        "dashboard-page.upcoming-cards.table-data.table-heading.account.data.checking",
      ),
      amount: "CHF 420.00",
    },
    {
      name: t(
        "dashboard-page.upcoming-cards.table-data.table-heading.name.data.insurance-bill",
      ),
      account: t(
        "dashboard-page.upcoming-cards.table-data.table-heading.account.data.credit-card",
      ),
      amount: "CHF 880.00",
    },
    {
      name: t(
        "dashboard-page.upcoming-cards.table-data.table-heading.name.data.rent",
      ),
      account: t(
        "dashboard-page.upcoming-cards.table-data.table-heading.account.data.checking",
      ),
      amount: "CHF 1’920.00",
    },
  ];

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
    healthCards,
    upComingTables,
    warningCards,
  };
}

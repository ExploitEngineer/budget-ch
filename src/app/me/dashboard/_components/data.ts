import { useTranslations } from "next-intl";

interface CardsContent {
  title: string;
  content: string;
  badge: string;
}

interface CircleProgressCards {
  title: string;
  value: number;
}

interface HealthCards {
  title: string;
  value: string;
}

interface ProgressCards {
  title: string;
  content: string;
  value: number;
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

interface RecentTransactionsTables {
  recipient: string;
  account: string;
  category: string;
  note: string;
  amount: string;
}

export function useDashboardData() {
  const t = useTranslations("main-dashboard");

  const cards: CardsContent[] = [
    {
      title: t("dashboard-page.cards.card-1.title"),
      content: t("dashboard-page.cards.card-1.content"),
      badge: t("dashboard-page.cards.card-1.badge"),
    },
    {
      title: t("dashboard-page.cards.card-2.title"),
      content: t("dashboard-page.cards.card-2.content"),
      badge: t("dashboard-page.cards.card-2.badge"),
    },
    {
      title: t("dashboard-page.cards.card-3.title"),
      content: t("dashboard-page.cards.card-3.content"),
      badge: t("dashboard-page.cards.card-3.badge"),
    },
    {
      title: t("dashboard-page.cards.card-4.title"),
      content: t("dashboard-page.cards.card-4.content"),
      badge: t("dashboard-page.cards.card-4.badge"),
    },
  ];

  const circleProgressCards: CircleProgressCards[] = [
    { title: t("dashboard-page.progress-cards.card-1.title"), value: 65 },
    { title: t("dashboard-page.progress-cards.card-2.title"), value: 47 },
    { title: t("dashboard-page.progress-cards.card-3.title"), value: 22 },
  ];

  const healthCards: HealthCards[] = [
    { title: t("dashboard-page.cards.card-1.title"), value: "CHF 4’703" },
    { title: t("dashboard-page.cards.card-2.title"), value: "CHF 2’456" },
    { title: t("dashboard-page.cards.card-3.title"), value: "3" },
  ];

  const progressCards: ProgressCards[] = [
    {
      title: t("dashboard-page.line-progress-cards.card-1.title"),
      content: "CHF 520 / 800",
      value: 70,
    },
    {
      title: t("dashboard-page.line-progress-cards.card-2.title"),
      content: "CHF 410 / 500",
      value: 60,
    },
    {
      title: t("dashboard-page.line-progress-cards.card-3.title"),
      content: "CHF 190 / 300",
      value: 50,
    },
    {
      title: t("dashboard-page.line-progress-cards.card-4.title"),
      content: "CHF 260 / 400",
      value: 40,
    },
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
    cards,
    circleProgressCards,
    healthCards,
    progressCards,
    upComingTables,
    warningCards,
  };
}

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

  const upComingTableHeadings: string[] = [
    t("dashboard-page.upcoming-cards.table-data.table-heading.date"),
    t("dashboard-page.upcoming-cards.table-data.table-heading.name.title"),
    t("dashboard-page.upcoming-cards.table-data.table-heading.account.title"),
    t("dashboard-page.upcoming-cards.table-data.table-heading.amount"),
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

  const recentTransactionsTableHeadings: string[] = [
    t("dashboard-page.recent-transactions-table.table-headings.date"),
    t(
      "dashboard-page.recent-transactions-table.table-headings.recipient.title",
    ),
    t("dashboard-page.recent-transactions-table.table-headings.account.title"),
    t("dashboard-page.recent-transactions-table.table-headings.category.title"),
    t("dashboard-page.recent-transactions-table.table-headings.note.title"),
    t("dashboard-page.recent-transactions-table.table-headings.amount"),
  ];

  const recentTransactionsTables: RecentTransactionsTables[] = [
    {
      recipient: t(
        "dashboard-page.recent-transactions-table.table-headings.recipient.data.coop",
      ),
      account: t(
        "dashboard-page.recent-transactions-table.table-headings.account.data.current-account",
      ),
      category: t(
        "dashboard-page.recent-transactions-table.table-headings.category.data.groceries",
      ),
      note: t(
        "dashboard-page.recent-transactions-table.table-headings.note.data.shopping",
      ),
      amount: "− CHF 132.40",
    },
    {
      recipient: t(
        "dashboard-page.recent-transactions-table.table-headings.recipient.data.sbb",
      ),
      account: t(
        "dashboard-page.recent-transactions-table.table-headings.account.data.credit-card",
      ),
      category: t(
        "dashboard-page.recent-transactions-table.table-headings.category.data.transportation",
      ),
      note: t(
        "dashboard-page.recent-transactions-table.table-headings.note.data.ga",
      ),
      amount: "− CHF 79.00",
    },
    {
      recipient: t(
        "dashboard-page.recent-transactions-table.table-headings.recipient.data.cafe",
      ),
      account: t(
        "dashboard-page.recent-transactions-table.table-headings.account.data.current-account",
      ),
      category: t(
        "dashboard-page.recent-transactions-table.table-headings.category.data.restaurant",
      ),
      note: t(
        "dashboard-page.recent-transactions-table.table-headings.note.data.lunch",
      ),
      amount: "− CHF 18.50",
    },
    {
      recipient: t(
        "dashboard-page.recent-transactions-table.table-headings.recipient.data.employer",
      ),
      account: t(
        "dashboard-page.recent-transactions-table.table-headings.account.data.current-account",
      ),
      category: t(
        "dashboard-page.recent-transactions-table.table-headings.category.data.income",
      ),
      note: t(
        "dashboard-page.recent-transactions-table.table-headings.note.data.salary",
      ),
      amount: "+ CHF 5’200.00",
    },
  ];

  return {
    cards,
    circleProgressCards,
    healthCards,
    progressCards,
    upComingTableHeadings,
    upComingTables,
    warningCards,
    recentTransactionsTableHeadings,
    recentTransactionsTables,
  };
}

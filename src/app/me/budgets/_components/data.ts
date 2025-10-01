import { useTranslations } from "next-intl";

interface CardsContent {
  title: string;
  content: string;
  badge: string;
}

interface TableData {
  category: string;
  budget: string;
  ist: string;
  rest: string;
  value: number;
  action: string;
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

  const tableData: TableData[] = [
    {
      category: t("data-table.data.category.clothing"),
      budget: "CHF 150.00",
      ist: "CHF 95.00",
      rest: "CHF 55.00",
      value: 10,
      action: t("data-table.data.action"),
    },
    {
      category: t("data-table.data.category.sports"),
      budget: "CHF 150.00",
      ist: "CHF 95.00",
      rest: "CHF 55.00",
      value: 52,
      action: t("data-table.data.action"),
    },
    {
      category: t("data-table.data.category.health"),
      budget: "CHF 150.00",
      ist: "CHF 95.00",
      rest: "CHF 55.00",
      value: 60,
      action: t("data-table.data.action"),
    },
    {
      category: t("data-table.data.category.transportation"),
      budget: "CHF 150.00",
      ist: "CHF 95.00",
      rest: "CHF 55.00",
      value: 20,
      action: t("data-table.data.action"),
    },
    {
      category: t("data-table.data.category.travel"),
      budget: "CHF 150.00",
      ist: "CHF 95.00",
      rest: "CHF 55.00",
      value: 80,
      action: t("data-table.data.action"),
    },
    {
      category: t("data-table.data.category.household"),
      budget: "CHF 150.00",
      ist: "CHF 95.00",
      rest: "CHF 55.00",
      value: 40,
      action: t("data-table.data.action"),
    },
  ];
  return { cards, tableData };
}

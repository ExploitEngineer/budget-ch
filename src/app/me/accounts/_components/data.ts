import { useTranslations } from "next-intl";

export interface CardsContent {
  title: string;
  content: string;
  badge: string;
}

interface TableData {
  name: string;
  type: string;
  iban: string;
  balance: string;
  action: string;
}

export function useContentData() {
  const t = useTranslations("main-dashboard.content-page");

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
      name: t("data-table.data.name.cash"),
      type: t("data-table.data.name.cash"),
      iban: "—",
      balance: "CHF 120.00",
      action: t("data-table.data.action"),
    },
    {
      name: t("data-table.data.name.current-account"),
      type: t("data-table.data.name.current-account"),
      iban: "CH93 0076 2011 6238 5295 7",
      balance: "CHF 2’500.00",
      action: t("data-table.data.action"),
    },
    {
      name: t("data-table.data.name.credit-card"),
      type: t("data-table.data.name.credit-card"),
      iban: "Monatsabrechnung",
      balance: "CHF-320.00",
      action: t("data-table.data.action"),
    },
    {
      name: t("data-table.data.name.saving"),
      type: t("data-table.data.name.saving"),
      iban: "—",
      balance: "CHF 8’200.00",
      action: t("data-table.data.action"),
    },
    /*
    {
      name: t("data-table.data.name.pillar"),
      type: t("data-table.data.name.pillar"),
      iban: "—",
      balance: "CHF 5’000.00",
      action: t("data-table.data.action"),
    },
    */
  ];
  return { cards, tableData };
}

import { useTranslations } from "next-intl";

export interface TableData {
  month: string;
  income: string;
  expenses: string;
  balance: string;
}

export function useReportData() {
  const t = useTranslations("main-dashboard.report-page");

  const tableData: TableData[] = [
    {
      month: "Jan",
      income: "CHF 5’200.00",
      expenses: "CHF 4’100.00",
      balance: "CHF 4’100.00",
    },
    {
      month: "Feb",
      income: "CHF 5’200.00",
      expenses: "CHF 4’100.00",
      balance: "CHF 4’100.00",
    },
    {
      month: "Mar",
      income: "CHF 5’200.00",
      expenses: "CHF 4’100.00",
      balance: "CHF 4’100.00",
    },
    {
      month: "Apr",
      income: "CHF 5’200.00",
      expenses: "CHF 4’100.00",
      balance: "CHF 4’100.00",
    },
    {
      month: "Mai",
      income: "CHF 5’200.00",
      expenses: "CHF 4’100.00",
      balance: "CHF 4’100.00",
    },
    {
      month: "Jun",
      income: "CHF 5’200.00",
      expenses: "CHF 4’100.00",
      balance: "CHF 4’100.00",
    },
    {
      month: "Jul",
      income: "CHF 5’200.00",
      expenses: "CHF 4’100.00",
      balance: "CHF 4’100.00",
    },
    {
      month: "Aug",
      income: "CHF 5’200.00",
      expenses: "CHF 4’100.00",
      balance: "CHF 4’100.00",
    },
    {
      month: "Sep",
      income: "CHF 5’200.00",
      expenses: "CHF 4’100.00",
      balance: "CHF 4’100.00",
    },
    {
      month: "Oct",
      income: "CHF 5’200.00",
      expenses: "CHF 4’100.00",
      balance: "CHF 4’100.00",
    },
    {
      month: "Nov",
      income: "CHF 5’200.00",
      expenses: "CHF 4’100.00",
      balance: "CHF 4’100.00",
    },
    {
      month: "Dec",
      income: "CHF 5’200.00",
      expenses: "CHF 4’100.00",
      balance: "CHF 4’100.00",
    },
  ];

  const detailedTableData: string[] = [
    t("detailed-table.data-table.data.category.groceries"),
    t("detailed-table.data-table.data.category.rent"),
    t("detailed-table.data-table.data.category.restaurant"),
    t("detailed-table.data-table.data.category.household"),
    t("detailed-table.data-table.data.category.leisure"),
  ];

  return { tableData, detailedTableData };
}

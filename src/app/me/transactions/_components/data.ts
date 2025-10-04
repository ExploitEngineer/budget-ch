import { useTranslations } from "next-intl";

export type Transaction = {
  id: string;
  date: string;
  recipient: string;
  account: string;
  category: string;
  note: string;
  amount: number;
};

export function useTransactions() {
  const t = useTranslations("main-dashboard.transactions-page");
  const transactions: Transaction[] = [
    {
      id: "1",
      date: "2025-09-30",
      recipient: t("data-table.recipients.amazon"),
      account: t("data-table.accounts.creditCard"),
      category: t("data-table.categories.shopping"),
      note: t("data-table.notes.electronicsOrder"),
      amount: -120.5,
    },
    {
      id: "2",
      date: "2025-09-29",
      recipient: t("data-table.recipients.salary"),
      account: t("data-table.accounts.bank"),
      category: t("data-table.categories.income"),
      note: t("data-table.notes.salarySeptember"),
      amount: 3500.0,
    },
    {
      id: "3",
      date: "2025-09-28",
      recipient: t("data-table.recipients.netflix"),
      account: t("data-table.accounts.paypal"),
      category: t("data-table.categories.entertainment"),
      note: t("data-table.notes.netflixMonthly"),
      amount: -19.99,
    },
    {
      id: "4",
      date: "2025-09-27",
      recipient: t("data-table.recipients.starbucks"),
      account: t("data-table.accounts.creditCard"),
      category: t("data-table.categories.food"),
      note: t("data-table.notes.coffeeFriends"),
      amount: -15.75,
    },
    {
      id: "5",
      date: "2025-09-26",
      recipient: t("data-table.recipients.uber"),
      account: t("data-table.accounts.creditCard"),
      category: t("data-table.categories.transport"),
      note: t("data-table.notes.rideOffice"),
      amount: -8.5,
    },
    {
      id: "6",
      date: "2025-09-25",
      recipient: t("data-table.recipients.apple"),
      account: t("data-table.accounts.creditCard"),
      category: t("data-table.categories.tech"),
      note: t("data-table.notes.applePurchase"),
      amount: -2400,
    },
    {
      id: "1",
      date: "2025-09-30",
      recipient: t("data-table.recipients.amazon"),
      account: t("data-table.accounts.creditCard"),
      category: t("data-table.categories.shopping"),
      note: t("data-table.notes.electronicsOrder"),
      amount: -120.5,
    },
    {
      id: "2",
      date: "2025-09-29",
      recipient: t("data-table.recipients.salary"),
      account: t("data-table.accounts.bank"),
      category: t("data-table.categories.income"),
      note: t("data-table.notes.salarySeptember"),
      amount: 3500.0,
    },
    {
      id: "3",
      date: "2025-09-28",
      recipient: t("data-table.recipients.netflix"),
      account: t("data-table.accounts.paypal"),
      category: t("data-table.categories.entertainment"),
      note: t("data-table.notes.netflixMonthly"),
      amount: -19.99,
    },
    {
      id: "4",
      date: "2025-09-27",
      recipient: t("data-table.recipients.starbucks"),
      account: t("data-table.accounts.creditCard"),
      category: t("data-table.categories.food"),
      note: t("data-table.notes.coffeeFriends"),
      amount: -15.75,
    },
    {
      id: "5",
      date: "2025-09-26",
      recipient: t("data-table.recipients.uber"),
      account: t("data-table.accounts.creditCard"),
      category: t("data-table.categories.transport"),
      note: t("data-table.notes.rideOffice"),
      amount: -8.5,
    },
    {
      id: "6",
      date: "2025-09-25",
      recipient: t("data-table.recipients.apple"),
      account: t("data-table.accounts.creditCard"),
      category: t("data-table.categories.tech"),
      note: t("data-table.notes.applePurchase"),
      amount: -2400,
    },
  ];

  return { transactions };
}

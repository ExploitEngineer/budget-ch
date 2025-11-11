import { useTranslations } from "next-intl";

export interface PlanCard {
  title: string;
  subTitle: string;
  amountMonthly: number;
  amountYearly: number;
  options: Record<string, string>;
  button: string;
}

export function usePlansData() {
  const t = useTranslations(
    "main-dashboard.settings-page.plans-upgrade-section.plans-cards",
  );

  const cards: PlanCard[] = [
    {
      title: t("free-card.title"),
      subTitle: t("free-card.sub-title"),
      amountMonthly: 0,
      amountYearly: 0,
      options: {
        manualEntry: t("free-card.options.manual-entry"),
        basicBudgets: t("free-card.options.basic-budgets"),
        transactions: t("free-card.options.transactions"),
        communitySupport: t("free-card.options.community-support"),
      },
      button: t("free-card.button"),
    },
    {
      title: t("individual-card.title"),
      subTitle: t("individual-card.sub-title"),
      amountMonthly: 6.9,
      amountYearly: 69,
      options: {
        allFreeFeatures: t("individual-card.options.all-free-features"),
        unlimited: t("individual-card.options.unlimited"),
        forecasts: t("individual-card.options.forecasts"),
        oneUser: t("individual-card.options.1-user"),
        emailSupport: t("individual-card.options.email-support"),
      },
      button: t("individual-card.button"),
    },
    {
      title: t("family-card.title"),
      subTitle: t("family-card.sub-title"),
      amountMonthly: 11.9,
      amountYearly: 199,
      options: {
        allIndividualFeatures: t("family-card.options.all-individual-features"),
        unlimitedUsers: t("family-card.options.unlimited-users"),
        sharedBudgets: t("family-card.options.shared-budgets"),
        rolePermission: t("family-card.options.role-permission"),
      },
      button: t("family-card.button"),
    },
  ];

  return { cards };
}

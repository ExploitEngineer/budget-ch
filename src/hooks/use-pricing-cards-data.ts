import { FAMILY_TIER_MONTHLY_LOOKUP_KEY, FAMILY_TIER_YEARLY_LOOKUP_KEY, INDIVIDUAL_TIER_MONTHLY_LOOKUP_KEY, INDIVIDUAL_TIER_YEARLY_LOOKUP_KEY } from "@/lib/stripe";
import { useTranslations } from "next-intl";
import { useState } from "react";

export interface PlanCard {
  title: string;
  subTitle: string;
  amountMonthly?: number;
  amountYearly?: number;
  lookupKeyMonthly?: string;
  lookupKeyYearly?: string;
  options: Record<string, string>;
  button: string;
}

interface Prices {
  individual_monthly_amount: number;
  individual_yearly_amount: number;
  family_monthly_amount: number;
  family_yearly_amount: number;
}

export function usePricingCardsData() {
  const [prices, setPrices] = useState<Prices>({
    individual_monthly_amount: 0,
    individual_yearly_amount: 0,
    family_monthly_amount: 0,
    family_yearly_amount: 0,
  });

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
      // amountMonthly: 6.9,
      // amountYearly: 69,
      options: {
        allFreeFeatures: t("individual-card.options.all-free-features"),
        unlimited: t("individual-card.options.unlimited"),
        forecasts: t("individual-card.options.forecasts"),
        oneUser: t("individual-card.options.1-user"),
        emailSupport: t("individual-card.options.email-support"),
      },
      button: t("individual-card.button"),
      lookupKeyMonthly: INDIVIDUAL_TIER_MONTHLY_LOOKUP_KEY,
      lookupKeyYearly: INDIVIDUAL_TIER_YEARLY_LOOKUP_KEY
    },
    {
      title: t("family-card.title"),
      subTitle: t("family-card.sub-title"),
      // amountMonthly: 11.9,
      // amountYearly: 199,
      options: {
        allIndividualFeatures: t("family-card.options.all-individual-features"),
        unlimitedUsers: t("family-card.options.unlimited-users"),
        sharedBudgets: t("family-card.options.shared-budgets"),
        rolePermission: t("family-card.options.role-permission"),
      },
      button: t("family-card.button"),
      lookupKeyMonthly: FAMILY_TIER_MONTHLY_LOOKUP_KEY,
      lookupKeyYearly: FAMILY_TIER_YEARLY_LOOKUP_KEY
    },
  ];

  return { cards };
}

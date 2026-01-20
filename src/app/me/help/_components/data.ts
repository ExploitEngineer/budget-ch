import { useTranslations } from "next-intl";

export interface FAQS {
  question: string;
  answer: string;
}

export function useHelpSectionData() {
  const t = useTranslations("main-dashboard.help-page");

  const FAQs: FAQS[] = [
    {
      question: t("faqs-section.data.question-1"),
      answer: t("faqs-section.data.answer-1"),
    },
    {
      question: t("faqs-section.data.question-2"),
      answer: t("faqs-section.data.answer-2"),
    },
    {
      question: t("faqs-section.data.question-3"),
      answer: t("faqs-section.data.answer-3"),
    },
    {
      question: t("faqs-section.data.question-4"),
      answer: t("faqs-section.data.answer-4"),
    },
    {
      question: t("faqs-section.data.question-6"),
      answer: t("faqs-section.data.answer-6"),
    },
    {
      question: t("faqs-section.data.question-7"),
      answer: t("faqs-section.data.answer-7"),
    },
  ];

  return { FAQs };
}

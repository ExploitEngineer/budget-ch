import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { FAQS } from "./data";
import { useTranslations } from "next-intl";

interface FAQsProps {
  FAQs: FAQS[];
  expandedItems?: string[];
  onExpandedChange?: (value: string[]) => void;
}

export function FAQs({ FAQs, expandedItems = [], onExpandedChange }: FAQsProps) {
  const t = useTranslations("main-dashboard.help-page.faqs-section");

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Input
            type="text"
            className="dark:border-border-blue !bg-dark-blue-background w-[25%] md:w-[40%] lg:w-[30%]"
            placeholder="Search FAQs…"
          />
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent>
          <Accordion
            type="multiple"
            value={expandedItems}
            onValueChange={onExpandedChange}
            className="dark:border-border-blue !bg-dark-blue-background w-full rounded-lg border p-2 px-4"
          >
            {FAQs.map((faq, idx: number) => (
              <AccordionItem
                className="!bg-dark-blue-background dark:border-border-blue"
                key={idx}
                value={idx.toString()}
              >
                <AccordionTrigger className="!bg-dark-blue-background dark:border-border-blue !cursor-pointer">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="!bg-dark-blue-background dark:border-border-blue flex flex-col gap-4 pe-2">
                  <p>{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}

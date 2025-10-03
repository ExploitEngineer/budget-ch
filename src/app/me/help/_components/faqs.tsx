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
}

export function FAQs({ FAQs }: FAQsProps) {
  const t = useTranslations("main-dashboard.help-page.faqs-section");

  return (
    <section>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Input
            type="text"
            className="w-[25%] md:w-[40%] lg:w-[30%]"
            placeholder="Search FAQs…"
          />
        </CardHeader>
        <Separator />
        <CardContent>
          <Accordion
            type="single"
            collapsible
            className="w-full rounded-lg border p-2 px-4"
            defaultValue="item-1"
          >
            {FAQs.map((faq, idx: number) => (
              <AccordionItem key={idx} value={idx.toString()}>
                <AccordionTrigger className="!cursor-pointer">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 pe-2">
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

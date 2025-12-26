import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export function Content() {
  const t = useTranslations("main-dashboard.help-page.content-section");

  const options: string[] = [
    t("faq"),
    t("contact-support"),
    t("keyboard-shortcuts"),
    // Hidden for now
    // t("troubleshooting"),
    // t("privacy"),
    // t("release-notes"),
  ];

  return (
    <section className="h-full">
      <Card className="bg-blue-background dark:border-border-blue h-full">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal ps-4">
            {options.map((opt) => (
              <li key={opt}>{opt}</li>
            ))}
          </ol>
          <p className="mt-3 text-sm opacity-60">{t("help")}</p>
        </CardContent>
      </Card>
    </section>
  );
}

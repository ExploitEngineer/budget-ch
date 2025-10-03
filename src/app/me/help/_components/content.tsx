import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export function Content() {
  const t = useTranslations("main-dashboard.help-page.content-section");

  const options: string[] = [
    t("faq"),
    t("contact-support"),
    t("keyboard-shortcuts"),
    t("troubleshooting"),
    t("privacy"),
    t("release-notes"),
  ];

  return (
    <section>
      <Card>
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

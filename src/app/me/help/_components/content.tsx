import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function Content() {
  const t = useTranslations("main-dashboard.help-page.content-section");

  const links = [
    { label: t("imprint"), href: "https://www.budgethub.ch/impressum" },
    { label: t("data-privacy"), href: "https://www.budgethub.ch/datenschutzerklarung" },
    { label: t("term-of-use"), href: "https://www.budgethub.ch/nutzungsbedingungen" },
  ];

  return (
    <section className="h-full">
      <Card className="bg-blue-background dark:border-border-blue h-full">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal ps-4 space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-blue-500"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}

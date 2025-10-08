import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

interface ShortCuts {
  key: string;
  function: string;
}

export function KeyboardShortcuts() {
  const t = useTranslations(
    "main-dashboard.help-page.keyboard-shortcuts-section",
  );

  const shortcuts: ShortCuts[] = [
    { key: "/", function: t("key-functions.search") },
    { key: "Ctrl N", function: t("key-functions.new-account") },
    { key: "Ctrl T", function: t("key-functions.transfer") },
    { key: "Esc", function: t("key-functions.close") },
  ];

  return (
    <section>
      <Card className="bg-blue-background dark:border-[#1A2441]">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge variant="outline" className="rounded-full px-3 py-2">
            {t("badge")}
          </Badge>
        </CardHeader>
        <Separator className="dark:bg-[#1A2441]" />
        <CardContent>
          <ul className="list-disc ps-4">
            {shortcuts.map((key, idx: number) => (
              <li key={idx}>
                <span className="font-bold">{key.key}</span>- {key.function}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

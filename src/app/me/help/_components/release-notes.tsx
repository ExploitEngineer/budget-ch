import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export function ReleaseNotes() {
  const t = useTranslations("main-dashboard.help-page.release-notes-section");

  const lists: string[] = [t("list-1"), t("list-2")];
  return (
    <section>
      <Card className="bg-blue-background dark:border-[#1A2441]">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge variant="outline" className="rounded-full px-3 py-2">
            {t("badge")}
          </Badge>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ps-4">
            {lists.map((list) => (
              <li key={list}>{list}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

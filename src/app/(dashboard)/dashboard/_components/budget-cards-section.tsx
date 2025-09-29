import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface CardsContent {
  title: string;
  content: string;
  badge: string;
}
export function BudgetCardsSection() {
  const t = useTranslations("main-dashboard.dashboard-page");

  const cards: CardsContent[] = [
    {
      title: t("cards.card-1.title"),
      content: t("cards.card-1.content"),
      badge: t("cards.card-1.badge"),
    },
    {
      title: t("cards.card-2.title"),
      content: t("cards.card-2.content"),
      badge: t("cards.card-2.badge"),
    },
    {
      title: t("cards.card-3.title"),
      content: t("cards.card-3.content"),
      badge: t("cards.card-3.badge"),
    },
    {
      title: t("cards.card-4.title"),
      content: t("cards.card-4.content"),
      badge: t("cards.card-4.badge"),
    },
  ];

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="flex flex-col gap-0 rounded-xl">
          <CardHeader>
            <CardTitle className="text-sm font-light">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <h1 className="text-2xl font-bold">{card.content}</h1>
          </CardContent>
          <CardFooter className="mt-2">
            <div className="rounded-full border px-4 py-2">
              <p className="w-full text-xs">{card.badge}</p>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

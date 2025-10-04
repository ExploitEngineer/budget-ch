import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CardsContent {
  title: string;
  content: string;
  badge: string;
}

interface BudgetCardsSectionProps {
  cards: CardsContent[];
}

export function BudgetCardsSection({ cards }: BudgetCardsSectionProps) {
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
            <Badge variant="outline" className="rounded-full px-4 py-2">
              <p className="w-full text-xs">{card.badge}</p>
            </Badge>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

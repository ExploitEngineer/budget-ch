import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CardsContent {
  title: string;
  content: string;
  badge: string;
}

interface ContentCardsSectionProps {
  cards: CardsContent[];
}

export function ContentCardsSection({ cards }: ContentCardsSectionProps) {
  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card
          key={card.title}
          className="bg-blue-background flex flex-col gap-0 rounded-xl dark:border-[#1A2441]"
        >
          <CardHeader>
            <CardTitle className="text-sm font-light">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <h1 className="text-2xl font-bold">{card.content}</h1>
          </CardContent>
          <CardFooter className="mt-2">
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-4 py-2",
                idx === 2 && "border-[#308BA4]",
                idx === 3 && "border-[#9A4249]",
              )}
            >
              <p className="w-full text-xs">{card.badge}</p>
            </Badge>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

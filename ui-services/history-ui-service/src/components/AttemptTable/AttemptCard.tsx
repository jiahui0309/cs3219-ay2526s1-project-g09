import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Attempt } from "@/types/Attempt";
import type { KeyboardEvent } from "react";

interface AttemptCardProps {
  index: number;
  item: Attempt;
  onClick?: () => void;
}

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatTime = (date: Date) =>
  date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.valueOf());

const AttemptCard: React.FC<AttemptCardProps> = ({ index, item, onClick }) => {
  const timeTakenLabel =
    typeof item.timeTaken === "number"
      ? `${item.timeTaken} min`
      : (item.timeTaken ?? "—");

  const hasInteraction = typeof onClick === "function";

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasInteraction) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  const dateLabel = isValidDate(item.date) ? formatDate(item.date) : "—";
  const timeLabel = isValidDate(item.date) ? formatTime(item.date) : "—";

  return (
    <div
      className={cn(
        "flex w-full items-center gap-4",
        hasInteraction &&
          "cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
      )}
      role={hasInteraction ? "button" : undefined}
      tabIndex={hasInteraction ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <Card className="border border-gray-700 bg-gray-800 text-xl font-bold text-gray-400">
        <CardContent className="grid justify-center gap-4 px-4 py-6">
          {index + 1}
        </CardContent>
      </Card>
      <Card className="flex-1 border border-gray-700 bg-gray-800 text-gray-200 transition-colors hover:bg-gray-700">
        <CardContent className="grid grid-cols-4 gap-4 px-6 py-4">
          <div className="flex flex-col">
            <CardTitle className="text-lg text-orange-400">
              {dateLabel}
            </CardTitle>
          </div>
          <div className="flex flex-col">
            <span className="text-md">{timeLabel}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-md">{item.partner || "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-md">{timeTakenLabel}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttemptCard;

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { HistoryEntry } from "@/types/HistoryEntry";

interface QuestionPreviewCardProps {
  index: number;
  item: HistoryEntry;
}

const QuestionPreviewCard: React.FC<QuestionPreviewCardProps> = ({
  index,
  item,
}) => {
  const participants =
    item.participants.length > 0 ? item.participants.join(", ") : "—";
  const sessionEndedAt = item.sessionEndedAt
    ? item.sessionEndedAt.toLocaleString()
    : "Not recorded";
  const topics =
    item.topics.length > 0 ? item.topics.join(", ") : "No tagged topics";

  return (
    <Card className="w-full bg-slate-900/80 border border-slate-700 text-slate-100">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="text-lg text-orange-400">
          {index + 1}. {item.questionTitle || "Untitled Question"}
        </CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Session {item.sessionId} · Snapshot owner {item.userId}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-slate-300">
        <div className="flex flex-wrap gap-4">
          <span>
            <span className="text-slate-400">Difficulty:</span>{" "}
            {item.difficulty || "Unknown"}
          </span>
          <span>
            <span className="text-slate-400">Language:</span>{" "}
            {(item.language ?? "unknown").toUpperCase()}
          </span>
          <span>
            <span className="text-slate-400">Saved by:</span>{" "}
            {item.savedBy || "Unknown"}
          </span>
          <span>
            <span className="text-slate-400">Ended:</span> {sessionEndedAt}
          </span>
        </div>

        <div>
          <span className="text-slate-400">Participants:</span> {participants}
        </div>
        <div>
          <span className="text-slate-400">Topics:</span> {topics}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-slate-400">Saved Code:</span>
          <pre className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 max-h-64 overflow-auto text-xs text-slate-200">
            {item.code || "// No code snapshot recorded"}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionPreviewCard;

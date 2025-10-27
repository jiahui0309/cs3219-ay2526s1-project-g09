import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import type { HistorySnapshot } from "@/types/history";
import type { Attempt } from "@/types/Attempt";
import type { Question } from "@/types/Question";
import {
  fetchHistorySnapshot,
  normaliseHistorySnapshot,
} from "@/api/historyService";

const QuestionDisplay = React.lazy(async () => {
  try {
    return await import("questionUiService/QuestionDisplay");
  } catch (error) {
    console.warn(
      "[history-shell] Failed to load question display remote",
      error,
    );
    return {
      default: () => (
        <div className="rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm text-red-300">
          Question display service is unavailable.
        </div>
      ),
    };
  }
});

interface LocationState {
  entry?: HistorySnapshot | Record<string, unknown>;
}

type RemoteQuestionAttemptTableProps = {
  items?: Attempt[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelect?: (attempt: Attempt) => void;
  title?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  listClassName?: string;
};

const QuestionAttemptTable = React.lazy(async () => {
  try {
    return await import("historyUiService/QuestionAttemptTable");
  } catch (error) {
    console.warn("[history-shell] Failed to load attempt table remote", error);
    return {
      default: ({
        emptyMessage = "Attempt history unavailable.",
      }: RemoteQuestionAttemptTableProps) => (
        <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-slate-800 bg-slate-900/70 p-6 text-sm text-red-300">
          {emptyMessage}
        </div>
      ),
    };
  }
});

const HistoryDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { historyId } = useParams<{ historyId: string }>();
  const location = useLocation();

  const initialEntry = useMemo(() => {
    const state = location.state as LocationState | undefined;
    if (!state?.entry) {
      return null;
    }
    return normaliseHistorySnapshot(state.entry) ?? null;
  }, [location.state]);

  const [entry, setEntry] = useState<HistorySnapshot | null>(initialEntry);
  const [loading, setLoading] = useState(!initialEntry);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entry || !historyId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetchHistorySnapshot(historyId, controller.signal)
      .then((snapshot) => {
        setEntry(snapshot);
        setError(null);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          const message =
            err instanceof Error ? err.message : "Failed to load history";
          setError(message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [entry, historyId]);

  const attemptEntries = useMemo<Attempt[]>(() => {
    if (!entry) {
      return [];
    }

    const attemptTimestamp =
      entry.sessionEndedAt ?? entry.updatedAt ?? entry.createdAt ?? new Date();

    const timeTakenLabel = formatDuration(
      entry.sessionEndedAt,
      entry.createdAt,
    );

    const baseQuestion: Question = {
      title: entry.questionTitle || "Untitled Question",
      body: "",
      topics: entry.topics ?? [],
      hints: [],
      answer: "",
      difficulty: entry.difficulty ?? "Unknown",
      timeLimit:
        typeof entry.timeLimit === "number"
          ? `${entry.timeLimit} min`
          : (entry.timeLimit ?? "—"),
    };

    const partners = entry.participants.filter(
      (participant) => participant !== entry.userId,
    );
    const targets = partners.length > 0 ? partners : [entry.userId];

    return targets.map((partner, index) => ({
      id: `${entry.id}-${partner}-${index}`,
      question: baseQuestion,
      date: attemptTimestamp,
      partner,
      timeTaken: timeTakenLabel,
    }));
  }, [entry]);

  const handleAttemptSelect = (attempt: Attempt) => {
    if (!entry) {
      return;
    }
    navigate(`/history/${entry.id}/attempt`, {
      state: {
        entry,
        attemptPartner: attempt.partner ?? entry.userId,
      },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Layout navHeader={<NavHeader />}>
      <div className="flex h-[85vh] gap-4 px-4">
        <div className="flex w-1/2 flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1 text-sm text-slate-200 transition-colors hover:bg-slate-800"
            >
              ← Back
            </button>
            {entry?.savedBy && (
              <span className="text-xs text-slate-400">
                Saved by {entry.savedBy}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden rounded-lg">
            {loading ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                Loading question…
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-red-400">
                {error}
              </div>
            ) : entry ? (
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-slate-400">
                    Loading question…
                  </div>
                }
              >
                <QuestionDisplay questionId={entry.questionId} />
              </Suspense>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                No snapshot selected.
              </div>
            )}
          </div>
        </div>

        <div className="flex w-1/2 flex-col">
          <Suspense
            fallback={
              <div className="flex min-h-[24rem] items-center justify-center rounded-lg border border-slate-800 bg-slate-900/70 p-6 text-slate-400">
                Loading attempt history…
              </div>
            }
          >
            <QuestionAttemptTable
              items={attemptEntries}
              isLoading={loading}
              error={error}
              emptyMessage="No attempt history recorded."
              loadingMessage="Loading attempt history…"
              onSelect={handleAttemptSelect}
              listClassName="min-h-[24rem]"
            />
          </Suspense>
        </div>
      </div>
    </Layout>
  );
};

function formatDuration(endedAt?: Date, createdAt?: Date): string {
  if (!endedAt || !createdAt) {
    return "—";
  }

  const diffMs = Math.max(0, endedAt.getTime() - createdAt.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export default HistoryDetailPage;

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import type { HistorySnapshot } from "@/types/history";
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

const HistoryAttemptPage: React.FC = () => {
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

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Layout navHeader={<NavHeader />}>
      <div className="flex h-[85vh] gap-4 px-4">
        <div className="flex w-1/3 flex-col gap-4">
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

          <SnapshotDetails entry={entry} loading={loading} />
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <SavedCodePanel entry={entry} loading={loading} error={error} />
          <ParticipantsPanel entry={entry} loading={loading} />
        </div>
      </div>
    </Layout>
  );
};

interface SnapshotDetailsProps {
  entry: HistorySnapshot | null;
  loading: boolean;
}

const SnapshotDetails: React.FC<SnapshotDetailsProps> = ({
  entry,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex h-[32vh] items-center justify-center rounded-lg border border-slate-800 bg-slate-900/70 text-slate-400">
        Loading snapshot details…
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex h-[32vh] items-center justify-center rounded-lg border border-slate-800 bg-slate-900/70 text-slate-400">
        Select a history record to view details.
      </div>
    );
  }

  const sessionEnded = entry.sessionEndedAt
    ? entry.sessionEndedAt.toLocaleString()
    : "Unknown";
  const timeLimit =
    typeof entry.timeLimit === "number" ? `${entry.timeLimit} min` : "—";

  return (
    <div className=" h-[32vh] overflow-hidden rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
      <h3 className="text-base font-semibold text-orange-300">
        Snapshot Details
      </h3>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-slate-300">
        <DetailRow label="Question" value={entry.questionTitle || "Untitled"} />
        <DetailRow label="Difficulty" value={entry.difficulty ?? "—"} />
        <DetailRow label="Time Limit" value={timeLimit} />
        <DetailRow
          label="Language"
          value={(entry.language ?? "Unknown").toUpperCase()}
        />
        <DetailRow label="Session ID" value={entry.sessionId} />
        <DetailRow label="Snapshot Owner" value={entry.userId} />
        <DetailRow label="Session Ended" value={sessionEnded} />
      </dl>
    </div>
  );
};

interface SavedCodePanelProps {
  entry: HistorySnapshot | null;
  loading: boolean;
  error: string | null;
}

const SavedCodePanel: React.FC<SavedCodePanelProps> = ({
  entry,
  loading,
  error,
}) => {
  return (
    <div className="flex h-[55%] flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900/70">
      <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
        Saved Code
      </div>
      <div className="flex-1 overflow-auto px-4 py-3 text-xs text-slate-200">
        {loading ? (
          <span className="text-slate-400">Loading saved code…</span>
        ) : error ? (
          <span className="text-red-400">{error}</span>
        ) : entry ? (
          entry.code && entry.code.trim().length > 0 ? (
            <pre className="whitespace-pre-wrap">{entry.code}</pre>
          ) : (
            <span className="text-slate-400">No code snapshot recorded.</span>
          )
        ) : (
          <span className="text-slate-400">
            Select a snapshot to view code.
          </span>
        )}
      </div>
    </div>
  );
};

interface ParticipantsPanelProps {
  entry: HistorySnapshot | null;
  loading: boolean;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  entry,
  loading,
}) => {
  const participants = entry?.participants ?? [];

  return (
    <div className="flex h-[45%] flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900/70">
      <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
        Participants
      </div>
      <div className="flex-1 overflow-auto px-4 py-3 text-sm text-slate-200">
        {loading ? (
          <span className="text-slate-400">Loading participants…</span>
        ) : participants.length === 0 ? (
          <span className="text-slate-400">No participants recorded.</span>
        ) : (
          <ul className="list-disc pl-5">
            {participants.map((participant) => (
              <li key={participant}>{participant}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="grid grid-cols-[140px_1fr] gap-2">
    <dt className="text-slate-400">{label}</dt>
    <dd className="text-slate-200">{value}</dd>
  </div>
);

export default HistoryAttemptPage;

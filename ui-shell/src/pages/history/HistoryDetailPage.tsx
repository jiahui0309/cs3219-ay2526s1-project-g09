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

interface AttemptRow {
  date: string;
  time: string;
  partner: string;
  timeTaken: string;
}

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

  const attemptRows = useMemo<AttemptRow[]>(() => {
    if (!entry) {
      return [];
    }

    const date = entry.sessionEndedAt
      ? entry.sessionEndedAt.toLocaleDateString(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "—";
    const time = entry.sessionEndedAt
      ? entry.sessionEndedAt.toLocaleTimeString(undefined, {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "—";

    const timeTaken = formatDuration(entry.sessionEndedAt, entry.createdAt);

    const partners = entry.participants.filter(
      (participant) => participant !== entry.userId,
    );
    const targets = partners.length > 0 ? partners : [entry.userId];

    return targets.map((partner) => ({
      date,
      time,
      partner,
      timeTaken,
    }));
  }, [entry]);

  const handleAttemptClick = (row: AttemptRow) => {
    if (!entry) {
      return;
    }
    navigate(`/history/${entry.id}/attempt`, {
      state: { entry, attemptPartner: row.partner },
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

          <div className="flex-1 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/70">
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

        <div className="flex w-1/2 flex-col rounded-lg border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-orange-300">
              Attempt History
            </h2>
            <span className="text-xs text-slate-400">
              {attemptRows.length} entr{attemptRows.length === 1 ? "y" : "ies"}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center text-slate-400">
              Loading attempt history…
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center text-red-400">
              {error}
            </div>
          ) : attemptRows.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-slate-400">
              No attempt history recorded.
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
                <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Time
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Partner
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Time Taken
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {attemptRows.map((row, index) => (
                    <tr
                      key={`${row.partner}-${index}`}
                      onClick={() => handleAttemptClick(row)}
                      className="cursor-pointer bg-slate-900/70 transition-colors hover:bg-slate-800/70"
                    >
                      <td className="px-4 py-3 align-top">{row.date}</td>
                      <td className="px-4 py-3 align-top">{row.time}</td>
                      <td className="px-4 py-3 align-top">{row.partner}</td>
                      <td className="px-4 py-3 align-top">{row.timeTaken}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

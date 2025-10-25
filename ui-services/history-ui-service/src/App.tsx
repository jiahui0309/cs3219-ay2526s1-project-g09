import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import HistoryTable from "@/components/QuestionHistoryTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import QuestionCard from "@/components/QuestionCard";
import type { HistoryEntry } from "@/types/HistoryEntry";
import { fetchHistoryEntries } from "@/api/historyService";
import "./index.css";

export interface HistoryAppProps {
  userId?: string;
  allowUserFilter?: boolean;
  renderQuestionPanel?: boolean;
  onEntrySelect?: (entry: HistoryEntry | null) => void;
  selectedEntryId?: string;
}

const DEFAULT_FILTER_ENABLED = true;

const HistoryApp: React.FC<HistoryAppProps> = ({
  userId,
  allowUserFilter,
  renderQuestionPanel = true,
  onEntrySelect,
  selectedEntryId: controlledSelectedId,
}) => {
  const filterEnabled = allowUserFilter ?? DEFAULT_FILTER_ENABLED;

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedUserId, setSubmittedUserId] = useState<string | undefined>(
    () => (userId?.trim() ? userId.trim() : undefined),
  );
  const [userIdInput, setUserIdInput] = useState(userId ?? "");
  const [internalSelectedId, setInternalSelectedId] = useState<
    string | undefined
  >(controlledSelectedId);

  const isControlledSelection = controlledSelectedId !== undefined;
  const selectedId = isControlledSelection
    ? controlledSelectedId
    : internalSelectedId;

  const selectedEntry = useMemo(() => {
    if (!selectedId) {
      return null;
    }
    return entries.find((entry) => entry.id === selectedId) ?? null;
  }, [entries, selectedId]);

  const selectedIndex = useMemo(() => {
    if (!selectedEntry) {
      return -1;
    }
    return entries.findIndex((entry) => entry.id === selectedEntry.id);
  }, [entries, selectedEntry]);

  const loadHistory = useCallback(
    async (abortSignal: AbortSignal, userId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchHistoryEntries({
          userId: userId?.trim() ? userId.trim() : undefined,
          signal: abortSignal,
        });
        setEntries(items);
      } catch (err) {
        if (!abortSignal.aborted) {
          const message =
            err instanceof Error ? err.message : "Failed to load history";
          setError(message);
          setEntries([]);
        }
      } finally {
        if (!abortSignal.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof userId === "string") {
      const trimmed = userId.trim();
      setSubmittedUserId(trimmed || undefined);
      setUserIdInput(userId);
    } else if (!filterEnabled) {
      setSubmittedUserId(undefined);
      setUserIdInput("");
    }
  }, [userId, filterEnabled]);

  useEffect(() => {
    if (!filterEnabled && !submittedUserId) {
      setEntries([]);
      setError("No user specified. Sign in to view your history.");
      if (!isControlledSelection) {
        setInternalSelectedId(undefined);
      }
      onEntrySelect?.(null);
      return;
    }

    const controller = new AbortController();
    void loadHistory(controller.signal, submittedUserId);
    return () => controller.abort();
  }, [
    filterEnabled,
    loadHistory,
    submittedUserId,
    isControlledSelection,
    onEntrySelect,
  ]);

  useEffect(() => {
    if (isControlledSelection) {
      setInternalSelectedId(controlledSelectedId);
    }
  }, [controlledSelectedId, isControlledSelection]);

  useEffect(() => {
    if (entries.length === 0) {
      if (!isControlledSelection) {
        setInternalSelectedId(undefined);
      }
      if (renderQuestionPanel || isControlledSelection) {
        onEntrySelect?.(null);
      }
      return;
    }

    let nextId = selectedId;
    if (!nextId || !entries.some((entry) => entry.id === nextId)) {
      if (renderQuestionPanel || isControlledSelection) {
        nextId = entries[0].id;
        if (!isControlledSelection) {
          setInternalSelectedId(nextId);
        }
      }
    }

    const entry = entries.find((item) => item.id === nextId) ?? null;
    if (renderQuestionPanel || isControlledSelection) {
      onEntrySelect?.(entry);
    }
  }, [
    entries,
    selectedId,
    isControlledSelection,
    onEntrySelect,
    renderQuestionPanel,
  ]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = userIdInput.trim();
    setSubmittedUserId(trimmed.length > 0 ? trimmed : undefined);
  };

  const handleReset = () => {
    setUserIdInput("");
    setSubmittedUserId(undefined);
  };

  const handleRowSelect = (entry: HistoryEntry) => {
    if (!isControlledSelection) {
      setInternalSelectedId(entry.id);
    }
    onEntrySelect?.(entry);
  };

  const showFilterForm = useMemo(() => filterEnabled, [filterEnabled]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
          <h1 className="text-2xl font-semibold text-orange-400">
            Collaboration History
          </h1>
          <p className="text-sm text-slate-400">
            Review the saved editor snapshots captured whenever a collaboration
            session ended or a participant left. Filter by your user ID to see
            just your records.
          </p>
          {showFilterForm ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label
                  htmlFor="history-user-id"
                  className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400"
                >
                  Filter by user ID
                </label>
                <Input
                  id="history-user-id"
                  placeholder="e.g. alice@example.com"
                  value={userIdInput}
                  onChange={(event) => setUserIdInput(event.target.value)}
                  className="bg-slate-950/60"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="min-w-[120px]">
                  Apply Filter
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleReset}
                  disabled={
                    loading ||
                    (!submittedUserId && userIdInput.trim().length === 0)
                  }
                >
                  Clear
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
              <span className="text-slate-400">Viewing history for user:</span>
              <span className="font-semibold text-slate-200">
                {submittedUserId ?? "Unknown"}
              </span>
            </div>
          )}
          {submittedUserId && (
            <p className="text-xs text-slate-500">
              Active filter:{" "}
              <span className="text-slate-300">{submittedUserId}</span>
            </p>
          )}
        </section>

        {renderQuestionPanel ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
            <section className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40">
              <h2 className="text-lg font-semibold text-orange-300">
                Question Details
              </h2>
              {!selectedEntry && !loading && !error && (
                <p className="text-sm text-slate-400">
                  Select a history row to view the saved question and code.
                </p>
              )}
              {selectedEntry && (
                <div className="flex flex-col gap-4">
                  <Suspense
                    fallback={
                      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
                        Loading question content…
                      </div>
                    }
                  >
                    {/* <QuestionDisplay questionId={selectedEntry.questionId} /> */}
                  </Suspense>
                  <QuestionCard
                    index={selectedIndex >= 0 ? selectedIndex : 0}
                    item={selectedEntry}
                  />
                </div>
              )}
            </section>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-0 shadow-lg shadow-slate-900/40">
              <HistoryTable
                items={entries}
                isLoading={loading}
                error={error}
                selectedId={selectedId}
                onSelect={handleRowSelect}
                onRetry={() => {
                  const controller = new AbortController();
                  void loadHistory(controller.signal, submittedUserId);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-0 shadow-lg shadow-slate-900/40">
            <HistoryTable
              items={entries}
              isLoading={loading}
              error={error}
              selectedId={selectedId}
              onSelect={handleRowSelect}
              onRetry={() => {
                const controller = new AbortController();
                void loadHistory(controller.signal, submittedUserId);
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryApp;

import { useCallback, useEffect, useMemo, useState } from "react";
import HistoryTable from "@/components/QuestionHistoryTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { HistoryEntry } from "@/types/HistoryEntry";
import { fetchHistoryEntries } from "@/api/historyService";
import "./index.css";

export interface HistoryAppProps {
  userId?: string;
  allowUserFilter?: boolean;
}

const DEFAULT_FILTER_ENABLED = true;

function HistoryApp({ userId, allowUserFilter }: HistoryAppProps) {
  const filterEnabled = allowUserFilter ?? DEFAULT_FILTER_ENABLED;
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedUserId, setSubmittedUserId] = useState<string | undefined>(
    () => (userId?.trim() ? userId.trim() : undefined),
  );
  const [userIdInput, setUserIdInput] = useState(userId ?? "");

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
      return;
    }

    const controller = new AbortController();
    void loadHistory(controller.signal, submittedUserId);
    return () => controller.abort();
  }, [filterEnabled, loadHistory, submittedUserId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = userIdInput.trim();
    setSubmittedUserId(trimmed.length > 0 ? trimmed : undefined);
  };

  const handleReset = () => {
    setUserIdInput("");
    setSubmittedUserId(undefined);
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

        <HistoryTable
          items={entries}
          isLoading={loading}
          error={error}
          onRetry={() => {
            const controller = new AbortController();
            void loadHistory(controller.signal, submittedUserId);
          }}
        />
      </main>
    </div>
  );
}

export default HistoryApp;

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";
import Layout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import type { HistorySnapshot } from "@/types/history";
import {
  fetchHistorySnapshot,
  normaliseHistorySnapshot,
  updateHistorySnapshot,
} from "@/api/historyService";
import Editor from "@monaco-editor/react";

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
  const [codeDraft, setCodeDraft] = useState<string>(initialEntry?.code ?? "");
  const [lastSavedCode, setLastSavedCode] = useState<string>(
    initialEntry?.code ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveAbortController = useRef<AbortController | null>(null);
  const entryRef = useRef<HistorySnapshot | null>(initialEntry);

  useEffect(() => {
    entryRef.current = entry;
  }, [entry]);

  useEffect(() => {
    if (entry || !historyId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetchHistorySnapshot(historyId, controller.signal)
      .then((snapshot) => {
        setEntry(snapshot);
        setCodeDraft(snapshot?.code ?? "");
        setLastSavedCode(snapshot?.code ?? "");
        entryRef.current = snapshot;
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

  useEffect(() => {
    setCodeDraft(entry?.code ?? "");
    setLastSavedCode(entry?.code ?? "");
    entryRef.current = entry;
  }, [entry]);

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const nextValue = value ?? "";
      setCodeDraft(nextValue);
      setEntry((current) => {
        const nextEntry = current ? { ...current, code: nextValue } : current;
        entryRef.current = nextEntry;
        return nextEntry;
      });
      setSaveError(null);
    },
    [setEntry],
  );

  const persistCode = useCallback(async (): Promise<HistorySnapshot | null> => {
    if (!entry?.id) {
      return null;
    }
    if (codeDraft === lastSavedCode) {
      return entry;
    }

    const trimmed = codeDraft.trim();
    if (trimmed.length === 0) {
      setSaveError("Code cannot be empty.");
      setCodeDraft(lastSavedCode);
      setEntry((current) => {
        const nextEntry = current
          ? { ...current, code: lastSavedCode }
          : current;
        entryRef.current = nextEntry;
        return nextEntry;
      });
      return null;
    }

    saveAbortController.current?.abort();
    const controller = new AbortController();
    saveAbortController.current = controller;

    try {
      setIsSaving(true);
      const updated = await updateHistorySnapshot(
        entry.id,
        {
          code: codeDraft,
          language: entry.language,
        },
        controller.signal,
      );
      setEntry(updated);
      setCodeDraft(updated.code ?? codeDraft);
      setLastSavedCode(updated.code ?? codeDraft);
      entryRef.current = updated;
      setSaveError(null);
      return updated;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        return null;
      }
      setSaveError(
        err instanceof Error ? err.message : "Failed to save code snapshot",
      );
      return null;
    } finally {
      if (saveAbortController.current === controller) {
        saveAbortController.current = null;
      }
      setIsSaving(false);
    }
  }, [codeDraft, entry, lastSavedCode]);

  useEffect(() => {
    if (!entry?.id) {
      return;
    }
    if (codeDraft === lastSavedCode) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void persistCode();
    }, 1000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [codeDraft, entry?.id, lastSavedCode, persistCode]);

  useEffect(() => {
    return () => {
      saveAbortController.current?.abort();
      if (entry?.id && codeDraft !== lastSavedCode) {
        void persistCode();
      }
    };
  }, [codeDraft, entry?.id, lastSavedCode, persistCode]);

  const handleBack = () => {
    const currentEntry = entryRef.current;
    if (!currentEntry?.id) {
      navigate(-1);
      return;
    }

    void (async () => {
      const latest = await persistCode();
      const snapshot = latest ?? entryRef.current ?? currentEntry;
      navigate(`/history/${snapshot.id}`, {
        replace: true,
        state: { entry: snapshot },
      });
    })();
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

          <div className="h-[40vh] overflow-y-auto">
            <RemoteWrapper
              remote={() => import("questionUiService/QuestionDisplay")}
              remoteName="Question UI Service"
              remoteProps={entry ? { questionId: entry.questionId } : undefined}
              loadingMessage="Loading Question..."
              errorMessage="Question Display service unavailable"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <SavedCodePanel
            entry={entry}
            loading={loading}
            error={error}
            code={codeDraft}
            language={entry?.language}
            onCodeChange={handleCodeChange}
            isSaving={isSaving}
            saveError={saveError}
          />
        </div>
      </div>
    </Layout>
  );
};

interface SavedCodePanelProps {
  entry: HistorySnapshot | null;
  loading: boolean;
  error: string | null;
  code: string;
  onCodeChange: (value: string | undefined) => void;
  language?: string;
  isSaving: boolean;
  saveError: string | null;
}

const SavedCodePanel: React.FC<SavedCodePanelProps> = ({
  entry,
  loading,
  error,
  code,
  onCodeChange,
  language,
  isSaving,
  saveError,
}) => {
  const editorLanguage = useMemo(() => {
    if (!language) {
      return "plaintext";
    }
    const normalized = language.trim().toLowerCase();
    const languageMap: Record<string, string> = {
      js: "javascript",
      javascript: "javascript",
      ts: "typescript",
      typescript: "typescript",
      py: "python",
      python: "python",
      c: "c",
      cpp: "cpp",
      "c++": "cpp",
      java: "java",
      go: "go",
      rust: "rust",
    };
    return languageMap[normalized] ?? normalized;
  }, [language]);

  let content: React.ReactNode;
  if (loading) {
    content = (
      <div className="flex h-full items-center justify-center text-slate-400">
        Loading saved code…
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex h-full items-center justify-center text-red-400">
        {error}
      </div>
    );
  } else if (!entry) {
    content = (
      <div className="flex h-full items-center justify-center text-slate-400">
        Select a snapshot to view code.
      </div>
    );
  } else {
    content = (
      <Editor
        value={code}
        onChange={onCodeChange}
        language={editorLanguage}
        theme="vs-dark"
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          readOnly: false,
          wordWrap: "on",
          fontSize: 14,
        }}
        height="100%"
      />
    );
  }

  const statusMessage = (() => {
    if (loading) {
      return "Loading…";
    }
    if (!entry) {
      return "No snapshot selected.";
    }
    if (saveError) {
      return saveError;
    }
    if (isSaving) {
      return "Saving changes…";
    }
    return "All changes saved.";
  })();

  return (
    <div className="flex h-[55%] flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900/70">
      <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
        Saved Code
      </div>
      <div className="flex-1 overflow-hidden">{content}</div>
      <div className="border-t border-slate-800 bg-slate-950/60 px-4 py-2 text-xs text-slate-400">
        {saveError ? (
          <span className="text-red-400">{statusMessage}</span>
        ) : (
          statusMessage
        )}
      </div>
    </div>
  );
};

export default HistoryAttemptPage;

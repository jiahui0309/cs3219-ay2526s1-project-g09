import React, { useMemo } from "react";
import Editor from "@monaco-editor/react";

export interface SavedCodePanelProps {
  code: string;
  onCodeChange?: (value: string | undefined) => void;
  language?: string;
  loading?: boolean;
  error?: string | null;
  isSaving?: boolean;
  saveError?: string | null;
  hasSnapshot?: boolean;
  title?: string;
}

const SavedCodePanel: React.FC<SavedCodePanelProps> = ({
  code,
  onCodeChange,
  language,
  loading = false,
  error = null,
  isSaving = false,
  saveError = null,
  hasSnapshot = true,
  title = "Saved Code",
}) => {
  const editorValue = typeof code === "string" ? code : "";

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
  } else if (!hasSnapshot) {
    content = (
      <div className="flex h-full items-center justify-center text-slate-400">
        Select a snapshot to view code.
      </div>
    );
  } else {
    content = (
      <Editor
        value={editorValue}
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
    if (!hasSnapshot) {
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
        {title}
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

export default SavedCodePanel;

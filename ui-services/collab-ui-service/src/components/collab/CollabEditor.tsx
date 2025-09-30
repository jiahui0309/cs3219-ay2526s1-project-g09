import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import io from "socket.io-client";

const socket = io("http://localhost:5276");

interface CollabEditorProps {
  questionId?: string;
  users?: string[];
  sessionId?: string | null;
}

const CollabEditor: React.FC<CollabEditorProps> = ({
  questionId,
  users = [],
  sessionId: initialSessionId,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(
    initialSessionId ?? null,
  );
  const [code, setCode] = useState("// Start coding here!\n");

  useEffect(() => {
    if (!initialSessionId) {
      return;
    }

    setSessionId(initialSessionId);
    socket.emit("joinRoom", initialSessionId);
  }, [initialSessionId]);

  useEffect(() => {
    if (initialSessionId || sessionId) {
      return;
    }

    if (!questionId || users.length === 0) {
      console.warn(
        "Unable to start session: missing questionId or users",
        questionId,
        users,
      );
      return;
    }

    const init = async () => {
      try {
        console.log(
          "Creating session for question:",
          questionId,
          "users:",
          users,
        );
        const res = await fetch("http://localhost:5276/api/collab/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, users }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `Failed to create collaboration session (${res.status}): ${errorText}`,
          );
        }

        const data = await res.json();
        setSessionId(data.session.sessionId);
        socket.emit("joinRoom", data.session.sessionId);
      } catch (error) {
        console.error("Failed to initialise collaboration session", error);
      }
    };

    init();
  }, [initialSessionId, questionId, sessionId, users]);

  useEffect(() => {
    if (!sessionId) return;

    socket.on("codeUpdate", (newCode: string) => {
      setCode(newCode);
    });

    return () => {
      socket.off("codeUpdate");
    };
  }, [sessionId]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && sessionId) {
      setCode(value);
      socket.emit("codeUpdate", { sessionId, newCode: value });
    }
  };

  return (
    <Editor
      height="100%"
      defaultLanguage="java"
      value={code}
      theme="vs-dark"
      onChange={handleEditorChange}
      options={{ minimap: { enabled: false } }}
    />
  );
};

export default CollabEditor;

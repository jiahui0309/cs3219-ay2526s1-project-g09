import type { HistorySnapshot } from "@/types/history";

const DEFAULT_BASE_URL =
  import.meta.env.VITE_MODE === "dev"
    ? "http://localhost:5278/api/v1/history-service"
    : "/api/v1/history-service";

const HISTORY_SERVICE_BASE_URL =
  import.meta.env.VITE_HISTORY_SERVICE_URL ?? DEFAULT_BASE_URL;

interface HistorySnapshotPayload {
  _id?: string;
  id?: string;
  sessionId?: string;
  userId?: string;
  participants?: unknown;
  question?: {
    questionId?: string;
    title?: string;
    difficulty?: string;
    topics?: unknown;
    timeLimit?: number;
  };
  code?: string;
  language?: string;
  savedBy?: string;
  sessionEndedAt?: string | number | Date;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
  timeLimit?: number;
}

export function normaliseHistorySnapshot(
  payload: HistorySnapshotPayload | HistorySnapshot | null | undefined,
): HistorySnapshot | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as HistorySnapshotPayload;

  const toString = (input: unknown): string | undefined => {
    if (typeof input === "string" && input.trim().length > 0) {
      return input.trim();
    }
    return undefined;
  };

  const toNumber = (input: unknown): number | undefined => {
    if (typeof input === "number" && Number.isFinite(input)) {
      return input;
    }
    return undefined;
  };

  const toStringArray = (input: unknown): string[] => {
    if (!Array.isArray(input)) {
      return [];
    }
    return input
      .map((item) => toString(item))
      .filter((item): item is string => typeof item === "string");
  };

  const toDate = (input: unknown): Date | undefined => {
    if (input instanceof Date) {
      return Number.isNaN(input.getTime()) ? undefined : input;
    }
    if (typeof input === "string" || typeof input === "number") {
      const parsed = new Date(input);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return undefined;
  };

  const sessionId = toString(value.sessionId) ?? "";
  const userId = toString(value.userId) ?? "";
  const questionId =
    toString(value.question?.questionId) ??
    toString((value as any).questionId) ??
    "";
  const id = toString(value._id ?? value.id) ?? `${sessionId}:${userId}`;

  if (!id || !sessionId || !userId || !questionId) {
    return null;
  }

  return {
    id,
    sessionId,
    userId,
    questionId,
    questionTitle: toString(value.question?.title) ?? "Untitled Question",
    difficulty: toString(value.question?.difficulty) ?? undefined,
    topics: toStringArray(value.question?.topics ?? []),
    timeLimit:
      toNumber(value.timeLimit ?? value.question?.timeLimit) ?? undefined,
    language: toString(value.language) ?? undefined,
    savedBy: toString(value.savedBy) ?? undefined,
    participants: toStringArray(value.participants ?? []),
    code: typeof value.code === "string" ? value.code : "",
    sessionEndedAt: toDate(value.sessionEndedAt),
    createdAt: toDate(value.createdAt),
    updatedAt: toDate(value.updatedAt),
  };
}

export async function fetchHistorySnapshot(
  id: string,
  signal?: AbortSignal,
): Promise<HistorySnapshot> {
  const response = await fetch(
    `${HISTORY_SERVICE_BASE_URL}/history/${encodeURIComponent(id)}`,
    {
      signal,
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `History request failed (${response.status}): ${
        text || response.statusText
      }`,
    );
  }

  const data = await response.json();
  if (!data || data.success === false || !data.snapshot) {
    throw new Error(data?.error ?? "History snapshot not found");
  }

  const normalised = normaliseHistorySnapshot(data.snapshot);
  if (!normalised) {
    throw new Error("Received invalid history snapshot");
  }

  return normalised;
}

export { HISTORY_SERVICE_BASE_URL };

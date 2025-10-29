import type { HistoryEntry } from "@/types/HistoryEntry";

const HISTORY_BASE_URL =
  import.meta.env.VITE_MODE === "dev"
    ? "http://localhost:5296/api/v1/history-service"
    : "/api/v1/history-service";

const HISTORY_SERVICE_BASE_URL =
  import.meta.env.VITE_HISTORY_SERVICE_URL ?? HISTORY_BASE_URL;

interface HistoryApiResponse {
  success?: boolean;
  items?: HistoryEntryPayload[];
  total?: number;
  limit?: number;
  skip?: number;
  error?: string;
}

interface HistoryEntryPayload {
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
  sessionEndedAt?: string;
  sessionStartedAt?: string;
  durationMs?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const normaliseString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique = new Set<string>();
  for (const entry of value) {
    const normalised = normaliseString(entry);
    if (normalised) {
      unique.add(normalised);
    }
  }
  return Array.from(unique);
};

const mapToHistoryEntry = (payload: HistoryEntryPayload): HistoryEntry => {
  const questionId = normaliseString(payload.question?.questionId) ?? "";

  const sessionId = normaliseString(payload.sessionId) ?? "";
  const userId = normaliseString(payload.userId) ?? "";

  return {
    id:
      normaliseString(payload._id) ??
      normaliseString(payload.id) ??
      `${sessionId}:${userId}`,
    sessionId,
    userId,
    participants: toStringArray(payload.participants ?? []),
    questionId,
    questionTitle: normaliseString(payload.question?.title) ?? questionId,
    difficulty: normaliseString(payload.question?.difficulty) ?? undefined,
    topics: toStringArray(payload.question?.topics ?? []),
    timeLimit:
      typeof payload.question?.timeLimit === "number"
        ? payload.question?.timeLimit
        : undefined,
    language: normaliseString(payload.language) ?? undefined,
    code: typeof payload.code === "string" ? payload.code : "",
    sessionEndedAt: payload.sessionEndedAt
      ? new Date(payload.sessionEndedAt)
      : undefined,
    sessionStartedAt: payload.sessionStartedAt
      ? new Date(payload.sessionStartedAt)
      : undefined,
    durationMs:
      typeof payload.durationMs === "number" &&
      Number.isFinite(payload.durationMs)
        ? Math.max(0, payload.durationMs)
        : undefined,
    createdAt: payload.createdAt ? new Date(payload.createdAt) : undefined,
    updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : undefined,
  };
};

export async function fetchHistoryEntries(
  options: {
    userId?: string;
    signal?: AbortSignal;
  } = {},
): Promise<HistoryEntry[]> {
  const params = new URLSearchParams();
  if (options.userId) {
    params.set("userId", options.userId);
  }

  const url =
    HISTORY_SERVICE_BASE_URL +
    "/history" +
    (params.size > 0 ? `?${params.toString()}` : "");

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    signal: options.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `History request failed (${response.status}): ${
        text || response.statusText
      }`,
    );
  }

  const data: HistoryApiResponse = await response.json();

  if (data.success === false) {
    throw new Error(data.error ?? "Failed to fetch history entries");
  }

  const items = Array.isArray(data.items) ? data.items : [];
  return items.map(mapToHistoryEntry);
}

export { HISTORY_SERVICE_BASE_URL };

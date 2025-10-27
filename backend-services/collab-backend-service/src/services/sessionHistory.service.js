import CodeSnapshotService from "./codeSnapshot.service.js";
import { sendHistorySnapshot } from "./history.client.js";

const DEFAULT_LANGUAGE = "java";

const sanitiseString = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const extractParticipants = (session, overrideParticipants) => {
  if (Array.isArray(overrideParticipants) && overrideParticipants.length > 0) {
    return overrideParticipants
      .map((entry) => sanitiseString(entry))
      .filter(Boolean);
  }

  if (Array.isArray(session?.users) && session.users.length > 0) {
    return session.users
      .map((userId) => sanitiseString(userId))
      .filter(Boolean);
  }

  if (Array.isArray(session?.participants) && session.participants.length > 0) {
    return session.participants
      .map((participant) => sanitiseString(participant?.userId))
      .filter(Boolean);
  }

  return [];
};

const mapQuestion = (session, overrideQuestion) => {
  if (overrideQuestion && typeof overrideQuestion === "object") {
    if (sanitiseString(overrideQuestion.questionId)) {
      return {
        questionId: sanitiseString(overrideQuestion.questionId),
        title: overrideQuestion.title ?? "",
        difficulty: overrideQuestion.difficulty ?? "",
        topics: Array.isArray(overrideQuestion.topics)
          ? overrideQuestion.topics
              .map((topic) => sanitiseString(topic))
              .filter(Boolean)
          : [],
        timeLimit:
          typeof overrideQuestion.timeLimit === "number"
            ? overrideQuestion.timeLimit
            : undefined,
      };
    }
  }

  const fromSession = session?.question ?? {};
  const questionId =
    sanitiseString(fromSession.questionId) ??
    sanitiseString(session?.questionId);

  if (!questionId) {
    return null;
  }

  return {
    questionId,
    title: fromSession.title ?? "",
    difficulty: fromSession.difficulty ?? "",
    topics: Array.isArray(fromSession.topics)
      ? fromSession.topics.map((topic) => sanitiseString(topic)).filter(Boolean)
      : [],
    timeLimit:
      typeof fromSession.timeLimit === "number"
        ? fromSession.timeLimit
        : typeof session?.timeLimit === "number"
          ? session.timeLimit
          : undefined,
  };
};

export async function persistSessionHistory(session, options = {}) {
  console.log("[sessionHistory] persistSessionHistory invoked", {
    sessionId: session?.sessionId,
    options,
  });
  if (!session || typeof session !== "object") {
    console.warn(
      "[sessionHistory] Skipping history persistence: invalid session object",
      {
        session,
      },
    );
    return;
  }

  const sessionId = sanitiseString(session.sessionId);
  if (!sessionId) {
    console.warn(
      "[sessionHistory] Skipping history persistence: sessionId missing",
      {
        rawSessionId: session?.sessionId,
      },
    );
    return;
  }

  const targetUserId = sanitiseString(options.userId) ?? null;

  if (!targetUserId) {
    console.warn(
      `[sessionHistory] No target user found; skipping history persistence`,
      {
        sessionId,
        options,
      },
    );
    return;
  }

  const snapshot =
    options.snapshot ??
    CodeSnapshotService.get(sessionId, targetUserId) ??
    CodeSnapshotService.get(sessionId) ??
    undefined;

  const code = typeof options.code === "string" ? options.code : snapshot?.code;

  if (!code) {
    console.warn(
      `[sessionHistory] No code snapshot available; skipping history persistence`,
      {
        sessionId,
        snapshot,
        options,
      },
    );
    return;
  }

  const language =
    sanitiseString(options.language)?.toLowerCase() ??
    snapshot?.language ??
    DEFAULT_LANGUAGE;

  const participants = extractParticipants(session, options.participants);

  if (participants.length === 0) {
    console.warn(
      `[sessionHistory] No participants found; skipping history persistence`,
      {
        sessionId,
        session,
        options,
      },
    );
    return;
  }

  if (!participants.includes(targetUserId)) {
    participants.unshift(targetUserId);
  }

  const question = mapQuestion(session, options.question);

  if (!question) {
    console.warn(
      `[sessionHistory] No question data available; skipping history persistence`,
      {
        sessionId,
        session,
      },
    );
    return;
  }

  const payload = {
    sessionId,
    userId: targetUserId,
    code,
    language,
    participants,
    sessionEndedAt:
      options.sessionEndedAt ?? session.endedAt ?? new Date().toISOString(),
    question,
  };

  console.log("[sessionHistory] Sending payload to history service", payload);
  await sendHistorySnapshot(payload);

  CodeSnapshotService.clearForUser(sessionId, targetUserId);

  if (options.clearSnapshot === true) {
    console.log(
      "[sessionHistory] Clearing cached snapshot for session",
      sessionId,
    );
    CodeSnapshotService.clear(sessionId);
  }
}

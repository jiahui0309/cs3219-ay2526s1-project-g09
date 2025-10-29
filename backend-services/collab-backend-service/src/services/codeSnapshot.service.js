const DEFAULT_LANGUAGE = "javascript";

const normalise = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

class CodeSnapshotService {
  constructor() {
    this.sessions = new Map();
  }

  update(sessionId, payload = {}) {
    const normalizedSessionId = normalise(sessionId);
    if (!normalizedSessionId) {
      return;
    }

    const code =
      typeof payload.code === "string" ? payload.code : payload.newCode;
    if (typeof code !== "string") {
      return;
    }

    const language =
      normalise(payload.language)?.toLowerCase() ?? DEFAULT_LANGUAGE;
    const userId = normalise(payload.userId);

    let sessionEntry = this.sessions.get(normalizedSessionId);
    if (!sessionEntry) {
      sessionEntry = { users: new Map(), last: null };
      this.sessions.set(normalizedSessionId, sessionEntry);
    }

    const snapshot = {
      code,
      language,
      updatedAt: new Date(),
    };

    sessionEntry.last = snapshot;

    if (userId) {
      sessionEntry.users.set(userId, {
        ...snapshot,
      });
    }
  }

  get(sessionId, userId) {
    const normalizedSessionId = normalise(sessionId);
    if (!normalizedSessionId) {
      return null;
    }

    const sessionEntry = this.sessions.get(normalizedSessionId);
    if (!sessionEntry) {
      return null;
    }

    if (userId) {
      const normalizedUserId = normalise(userId);
      if (!normalizedUserId) {
        return null;
      }
      return sessionEntry.users.get(normalizedUserId) ?? null;
    }

    return sessionEntry.last ?? null;
  }

  getAll(sessionId) {
    const normalizedSessionId = normalise(sessionId);
    if (!normalizedSessionId) {
      return [];
    }
    const sessionEntry = this.sessions.get(normalizedSessionId);
    if (!sessionEntry) {
      return [];
    }

    return Array.from(sessionEntry.users.entries()).map(
      ([userId, snapshot]) => ({
        userId,
        ...snapshot,
      }),
    );
  }

  clearForUser(sessionId, userId) {
    const normalizedSessionId = normalise(sessionId);
    const normalizedUserId = normalise(userId);

    if (!normalizedSessionId || !normalizedUserId) {
      return;
    }

    const sessionEntry = this.sessions.get(normalizedSessionId);
    if (!sessionEntry) {
      return;
    }

    sessionEntry.users.delete(normalizedUserId);

    if (sessionEntry.users.size === 0) {
      this.sessions.delete(normalizedSessionId);
    }
  }

  clear(sessionId) {
    const normalizedSessionId = normalise(sessionId);
    if (!normalizedSessionId) {
      return;
    }
    this.sessions.delete(normalizedSessionId);
  }
}

export default new CodeSnapshotService();

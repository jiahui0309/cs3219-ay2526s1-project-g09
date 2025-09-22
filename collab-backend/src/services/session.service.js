import Session from "../models/session.model.js";

const SESSION_ID_REGEX = /^[a-zA-Z0-9-_]+$/;

class SessionService {
  static generateSessionId() {
    return `sess-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  static validateSessionId(sessionId) {
    if (typeof sessionId !== "string" || !SESSION_ID_REGEX.test(sessionId)) {
      throw new Error("Invalid sessionId");
    }
    return sessionId;
  }

  static toResponse(session) {
    if (!session) {
      return null;
    }
    return session.toObject({ versionKey: false });
  }

  static async createSession({ questionId, users, sessionId }) {
    const ensuredSessionId = sessionId ?? this.generateSessionId();

    const sanitizedUsers = Array.from(
      new Set(
        (users ?? [])
          .map((user) => (typeof user === "string" ? user.trim() : ""))
          .filter((user) => user.length > 0),
      ),
    );

    if (sanitizedUsers.length === 0) {
      throw new Error("At least one valid user is required");
    }

    const session = await Session.create({
      questionId,
      users: sanitizedUsers,
      sessionId: ensuredSessionId,
      active: true,
    });

    return this.toResponse(session);
  }

  static async getSession(sessionId) {
    this.validateSessionId(sessionId);
    return await Session.findOne({ sessionId }).lean({ virtuals: true });
  }

  static async endSession(sessionId) {
    this.validateSessionId(sessionId);

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return null;
    }

    session.active = false;
    session.endedAt = new Date();
    if (session.createdAt) {
      session.timeTaken = Math.max(
        0,
        session.endedAt.getTime() - session.createdAt.getTime(),
      );
    }

    await session.save();
    return this.toResponse(session);
  }

  static async saveSnapshot({ sessionId, code, language, userId }) {
    this.validateSessionId(sessionId);

    const session = await Session.findOne({ sessionId, active: true });
    if (!session) {
      return null;
    }

    session.lastSavedAttempt = {
      code,
      language,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    await session.save();
    return this.toResponse(session);
  }
}

export default SessionService;

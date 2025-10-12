import crypto from "crypto";
import Session from "../models/session.model.js";

const SESSION_ID_REGEX = /^[a-zA-Z0-9-_]+$/;

class SessionService {
  static generateSessionId() {
    return `sess-${crypto.randomUUID()}`;
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
    const ensuredSessionId = sessionId
      ? this.validateSessionId(sessionId)
      : this.generateSessionId();

    const sanitizedUsers = this.sanitizeUsers(users);

    if (sanitizedUsers.length === 0) {
      throw new Error("At least one valid user is required");
    }

    const session = await Session.create({
      questionId,
      users: sanitizedUsers,
      activeUsers: sanitizedUsers,
      sessionId: ensuredSessionId,
      active: true,
    });

    return this.toResponse(session);
  }

  static async getSession(sessionId) {
    const sanitizedSessionId = this.validateSessionId(sessionId);
    return await Session.findOne({ sessionId: sanitizedSessionId }).lean({
      virtuals: true,
    });
  }

  static async endSession(sessionId, options = {}) {
    const sanitizedSessionId = this.validateSessionId(sessionId);
    const { userId, force = false } = options;

    const sanitizedUserId =
      typeof userId === "string" && userId.trim().length > 0
        ? userId.trim()
        : null;

    const session = await Session.findOne({ sessionId: sanitizedSessionId });
    if (!session) {
      return { session: null, ended: false, removedUser: null };
    }

    const existingActiveUsers = Array.isArray(session.activeUsers)
      ? session.activeUsers
      : session.active
        ? (session.users ?? [])
        : [];

    let nextActiveUsers = [...existingActiveUsers];
    let removedUser = null;

    if (sanitizedUserId) {
      const filteredUsers = nextActiveUsers.filter(
        (user) => user !== sanitizedUserId,
      );
      if (filteredUsers.length !== nextActiveUsers.length) {
        nextActiveUsers = filteredUsers;
        removedUser = sanitizedUserId;
      }
    }

    if (force) {
      nextActiveUsers = [];
    }

    session.activeUsers = nextActiveUsers;

    const shouldEnd = force || session.activeUsers.length === 0;
    let ended = false;

    if (shouldEnd && session.active !== false) {
      session.active = false;
      session.endedAt = new Date();
      if (session.createdAt) {
        session.timeTaken = Math.max(
          0,
          session.endedAt.getTime() - session.createdAt.getTime(),
        );
      }
      ended = true;
    } else if (!shouldEnd && session.active === false) {
      session.active = true;
    }

    await session.save();
    return {
      session: this.toResponse(session),
      ended,
      removedUser,
    };
  }

  static async saveSnapshot({ sessionId, code, language, userId }) {
    const sanitizedSessionId = this.validateSessionId(sessionId);

    const session = await Session.findOne({
      sessionId: sanitizedSessionId,
      active: true,
    });
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

  static sanitizeUsers(users) {
    return Array.from(
      new Set(
        (users ?? [])
          .map((user) => (typeof user === "string" ? user.trim() : ""))
          .filter((user) => user.length > 0),
      ),
    );
  }

  static async findActiveSessionByUsers(users) {
    const sanitizedUsers = this.sanitizeUsers(users);
    if (sanitizedUsers.length === 0) {
      return null;
    }

    const session = await Session.findOne({
      active: true,
      $or: [
        { activeUsers: { $in: sanitizedUsers } },
        { activeUsers: { $exists: false }, users: { $in: sanitizedUsers } },
      ],
    });

    return this.toResponse(session);
  }
}

export default SessionService;

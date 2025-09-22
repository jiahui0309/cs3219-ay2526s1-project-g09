import Session from "../models/session.model.js";

class SessionService {
  static async createSession({ questionId, users, sessionId }) {
    return await Session.create({ questionId, users, sessionId, active: true });
  }

  static async endSession(sessionId) {
    if (typeof sessionId !== "string" || !/^[a-zA-Z0-9-_]+$/.test(sessionId)) {
      throw new Error("Invalid sessionId");
    }

    const session = await Session.findOne({ sessionId: String(sessionId) });
    if (session) {
      session.active = false;
      session.endedAt = new Date();
      await session.save();
      // afterwards push data to Question History service
    }
    return session;
  }
}

export default SessionService;

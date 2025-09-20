import SessionService from "../services/session.service.js";

export const startSession = async (req, res) => {
  try {
    const { questionId, users } = req.body;
    const sessionId = `sess-${Date.now()}`; // temporary simple unique ID generation
    const session = await SessionService.createSession({ questionId, users, sessionId });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    await SessionService.endSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  questionId: { type: String, required: true },
  users: [{ type: String }],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  timeTaken: { type: Number },
  lastSavedAttempt: { type: JSON },
});

export default mongoose.model("Session", SessionSchema, "sessions");

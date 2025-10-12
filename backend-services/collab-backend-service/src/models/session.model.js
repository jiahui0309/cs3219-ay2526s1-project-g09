import mongoose from "mongoose";

const LastSavedAttemptSchema = new mongoose.Schema(
  {
    code: { type: String, default: "" },
    language: { type: String },
    updatedAt: { type: Date },
    updatedBy: { type: String },
  },
  { _id: false },
);

const ParticipantSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    active: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
    sessionId: { type: String, required: true },
  },
  { _id: false },
);

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  questionId: { type: String, required: true },
  participants: { type: [ParticipantSchema], default: [] },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  timeTaken: { type: Number },
  lastSavedAttempt: { type: LastSavedAttemptSchema },
});

export default mongoose.model("Session", SessionSchema, "sessions");

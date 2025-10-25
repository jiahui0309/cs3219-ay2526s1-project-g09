import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    title: { type: String },
    difficulty: { type: String },
    topics: { type: [String], default: [] },
    timeLimit: { type: Number },
  },
  { _id: false },
);

const SessionHistorySchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    participants: {
      type: [String],
      default: [],
    },
    question: { type: QuestionSchema, required: true },
    code: { type: String, required: true },
    language: { type: String, default: "java" },
    savedBy: { type: String },
    sessionEndedAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

SessionHistorySchema.index({ participants: 1 });
SessionHistorySchema.index({ "question.questionId": 1 });
SessionHistorySchema.index({ sessionId: 1, userId: 1 }, { unique: true });

export default mongoose.model(
  "SessionHistory",
  SessionHistorySchema,
  "session_history",
);

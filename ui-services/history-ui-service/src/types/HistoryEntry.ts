export interface HistoryEntry {
  id: string;
  sessionId: string;
  userId: string;
  participants: string[];
  questionId: string;
  questionTitle: string;
  difficulty?: string;
  topics: string[];
  timeLimit?: number;
  language?: string;
  savedBy?: string;
  code: string;
  sessionEndedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

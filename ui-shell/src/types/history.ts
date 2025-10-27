export interface HistorySnapshot {
  id: string;
  sessionId: string;
  userId: string;
  questionId: string;
  questionTitle: string;
  difficulty?: string;
  topics: string[];
  timeLimit?: number;
  language?: string;
  participants: string[];
  code: string;
  sessionEndedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

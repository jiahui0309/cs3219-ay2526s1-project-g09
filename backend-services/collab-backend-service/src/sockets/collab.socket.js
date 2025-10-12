import { Server } from "socket.io";
import SessionService from "../services/session.service.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("connect", () => {
      console.log("connected", socket.id);
    });

    socket.on("sessionCreated", (s) => {
      console.log("got sessionCreated:", s);
    });

    // sessionId and userId passed from frontend
    socket.on("joinRoom", (payload) => {
      const normalizedPayload =
        typeof payload === "string" ? { sessionId: payload } : (payload ?? {});
      const { sessionId, userId } = normalizedPayload;

      if (!sessionId) {
        console.warn(
          `Socket ${socket.id} attempted to join room without sessionId`,
        );
        return;
      }

      socket.join(sessionId);
      socket.data.sessionId = sessionId;

      if (typeof userId === "string" && userId.trim().length > 0) {
        socket.data.userId = userId.trim();
      }

      console.log(
        `User ${socket.id} joined room ${sessionId}${
          socket.data.userId ? ` as ${socket.data.userId}` : ""
        }`,
      );
    });

    socket.on("codeUpdate", ({ sessionId, newCode }) => {
      socket.to(sessionId).emit("codeUpdate", newCode);
    });

    socket.on("disconnect", async () => {
      console.log("A user disconnected:", socket.id);
      const sessionId = socket.data.sessionId;
      const userId = socket.data.userId;

      if (!sessionId) {
        return;
      }

      try {
        const { session, ended, removedUser } = await SessionService.endSession(
          sessionId,
          { userId },
        );

        if (!session) {
          return;
        }

        if (ended) {
          io.to(sessionId).emit("sessionEnded", sessionId);
          console.log(
            `Session ${sessionId} ended because socket ${socket.id} disconnected`,
          );
        } else if (removedUser) {
          io.to(sessionId).emit("participantLeft", {
            sessionId,
            userId: removedUser,
          });
          console.log(
            `User ${removedUser} left session ${sessionId} via disconnect ${socket.id}`,
          );
        }
      } catch (error) {
        console.error(
          `Failed to end session ${sessionId} after disconnect ${socket.id}:`,
          error,
        );
      }
    });
  });

  return io;
};

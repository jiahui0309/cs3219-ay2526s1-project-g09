import { Server } from "socket.io";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" }, // adjust to FE domain
  });

  io.on("connection", (socket) => {
    console.log("🔗 User connected:", socket.id);

    // join session room
    socket.on("joinSession", ({ sessionId, userId }) => {
      socket.join(sessionId);
      io.to(sessionId).emit("userJoined", { userId });
    });

    // user sends message
    socket.on("message", ({ sessionId, userId, text }) => {
      io.to(sessionId).emit("newMessage", { userId, text });
    });

    // heartbeat
    socket.on("heartbeat", ({ sessionId, userId }) => {
      console.log(`❤️ heartbeat from ${userId} in session ${sessionId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });

  return io;
};

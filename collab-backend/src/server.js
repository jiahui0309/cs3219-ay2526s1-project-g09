import http from "http";
import app from "./app.js";
import { initSocket } from "./sockets/collab.socket.js";

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Collab Service running on port ${PORT}`);
});

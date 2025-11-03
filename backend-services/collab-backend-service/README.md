# Collab Backend Service

Real‑time collaboration backend for PeerPrep.  
Provides Socket.IO rooms backed by Yjs CRDTs and optional Redis pub/sub so multiple service instances can share the same sessions.

## Key Capabilities

- **Conflict-free editing:** every live session maps to a Yjs document; updates are merged locally and broadcast through Socket.IO.
- **Presence awareness:** cursor and selection updates flow alongside document changes.
- **Scalable transport:** when Redis credentials are supplied the service enables the `@socket.io/redis-adapter`, letting you run several collab-service replicas.
- **Session history:** final code snapshots and metadata are pushed to the history service when a room ends or times out.

## Requirements

- Node.js 18+
- npm
- MongoDB instance (for session metadata)
- Redis _(optional but required for horizontal scaling / multi-instance deployments)_

## Quick Start

1. Install dependencies

   ```bash
   cd backend-services/collab-backend-service
   npm install
   ```

2. Copy the example environment and adjust it for your environment

   ```bash
   cp .env.example .env
   ```

3. Update `.env` with the correct Mongo/Redis endpoints and downstream service URLs (see the table below).

4. Run the service

   ```bash
   node src/server.js
   ```

   The HTTP and Socket.IO endpoints default to `http://localhost:5276`.

## Environment Variables

| Name                    | Description                                                                        | Example                                                |
| ----------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `MONGO_URI`             | MongoDB connection string                                                          | `mongodb://localhost:27017/peerprep`                   |
| `MONGO_DB_NAME`         | Mongo database name                                                                | `peerprep-collab`                                      |
| `PORT`                  | HTTP port the service listens on                                                   | `5276`                                                 |
| `QUESTION_SERVICE_URL`  | Base URL of the question service                                                   | `http://question-service:5275/api/v1/question-service` |
| `HISTORY_SERVICE_URL`   | Base URL of the history service                                                    | `http://history-service:5278/api/v1/history-service`   |
| `COLLAB_REDIS_URL`      | _(Optional)_ full Redis URL. When set this overrides the host/port/password fields | `redis://user:pass@redis:6379/0`                       |
| `COLLAB_REDIS_HOST`     | _(Optional)_ Redis hostname when URL is not supplied                               | `redis`                                                |
| `COLLAB_REDIS_PORT`     | _(Optional)_ Redis port when URL is not supplied                                   | `6379`                                                 |
| `COLLAB_REDIS_USERNAME` | _(Optional)_ Redis username                                                        | `default`                                              |
| `COLLAB_REDIS_PASSWORD` | _(Optional)_ Redis password                                                        | `secret`                                               |

Only one of `COLLAB_REDIS_URL` or the host/port/password group is required. If neither is supplied the service runs in single-instance (in-memory adapter) mode.

## Docker

A minimal compose file is included for deployments:

```bash
docker compose up --build
```

The container reads environment variables from `.env` and publishes port `5276` (mapped to `80` by default in the compose file).

## Project Layout

```
src/
  app.js                 # Express configuration and middleware
  server.js              # Entrypoint; starts HTTP server and Socket.IO
  config/
    db.js                # MongoDB connection helper
  controllers/
    collab.controller.js # REST handlers for collab workflows
  routes/                # Express router wiring
  services/
    session.service.js   # Session lifecycle helpers
    sessionHistory.service.js # Persist history payloads
  sockets/
    collab.socket.js     # Socket.IO + Yjs orchestration
  models/
    session.model.js     # Mongoose schema for sessions
```

## How Collaboration Works

1. **Join:** clients call `joinRoom` with a sessionId + userId. The server replies with a `yjsInit` message that contains the encoded Yjs state for that room.
2. **Edit:** local editors apply changes to the Yjs document. A `yjsUpdate` payload (base64 encoded) is emitted to the server which rebroadcasts it to other participants.
3. **Presence:** cursor and selection movements are throttled and sent via `cursorUpdate`.
4. **Heartbeat:** clients emit `heartbeat` every 30 seconds. Missed heartbeats trigger inactivity cleanup.
5. **Persist:** when the last participant leaves or the session ends the server stores the final code and metadata using `sessionHistory.service`.

### Socket Events

| Event                                                | Direction       | Purpose                                                     |
| ---------------------------------------------------- | --------------- | ----------------------------------------------------------- |
| `joinRoom`                                           | client → server | Join a collaboration room; kicks off Yjs sync               |
| `yjsInit`                                            | server → client | Sends the current CRDT state to the new participant         |
| `yjsUpdate`                                          | bi-directional  | Propagates CRDT document updates                            |
| `codeUpdate`                                         | bi-directional  | Backwards-compatible text update channel for legacy clients |
| `cursorUpdate`                                       | bi-directional  | Shares cursor + selection positions                         |
| `heartbeat`                                          | client → server | Refreshes inactivity timers                                 |
| `sessionEnded`, `participantLeft`, `inactiveTimeout` | server → client | Session lifecycle notifications                             |

## Verifying Redis Adapter

1. Provide Redis credentials in `.env`.
2. On startup the service logs `"[collab.socket] Redis adapter connected."` followed by `"[collab.socket] Redis adapter registered with Socket.IO."`
3. While the service is running you can confirm the adapter with:

   ```bash
   redis-cli PUBSUB CHANNELS "socket.io*"
   ```

   You should see channel entries appear as clients join rooms.

## Troubleshooting

- Ensure MongoDB is reachable before starting; the process exits on connection failure.
- If clients do not receive updates across instances, verify Redis credentials and look for `[collab.socket][redis]` error logs.
- For local single-instance testing you can omit Redis variables entirely.

# History Backend Service

Persists collaboration session snapshots so users can review past attempts inside PeerPrep.  
Receives final code and metadata from the Collab service, stores them in MongoDB, and exposes REST endpoints for querying.

## Features

- **Snapshot storage:** upsert a unique record per `(sessionId, userId)` with the final code, language, timing, participants, and question metadata.
- **Filtering APIs:** list history records by `userId`, `sessionId`, or `questionId` with pagination support.
- **Health visibility:** lightweight `/health` endpoint for monitoring.
- **Mongo indexes:** optimized lookups on session, user, participants, and question identifiers.

## Requirements

- Node.js 18+
- npm
- MongoDB instance (local or Atlas)

## Quick Start

```bash
cd backend-services/history-backend-service
npm install
cp .env.example .env
# edit .env with your Mongo connection details
npm start        # or npm run dev for auto-reload
```

By default the service listens on `http://localhost:5278/api/v1/history-service`.

### Package scripts

| Command        | Description                    |
| -------------- | ------------------------------ |
| `npm start`    | Run the production build       |
| `npm run dev`  | Node in watch mode (`--watch`) |
| `npm run lint` | Lint source files              |
| `npm test`     | Placeholder (no tests yet)     |

## Environment Variables

| Name            | Description                                   | Example                     |
| --------------- | --------------------------------------------- | --------------------------- |
| `MONGO_URI`     | MongoDB connection string                     | `mongodb://localhost:27017` |
| `MONGO_DB_NAME` | Database name (defaults to `history-service`) | `peerprep-history`          |
| `PORT`          | Port for HTTP + Socket server                 | `5278`                      |

Only `MONGO_URI` is required; other values have defaults.

## Docker

A minimal compose file is provided. After creating `.env`, run:

```bash
docker compose up --build
```

This publishes the service on port `80` (mapped to internal `5278`).

## Project Layout

```
src/
  app.js                # Express configuration and middleware
  server.js             # Entrypoint; starts HTTP server
  config/
    db.js               # MongoDB connection helper
  controllers/
    history.controller.js  # HTTP handlers
  routes/
    history.routes.js      # Express router (mounted at /api/v1/history-service)
  services/
    history.service.js     # Business logic & Mongoose queries
  models/
    historyEntry.model.js  # Session history schema + indexes
```

## API Reference

Base path: `/api/v1/history-service`

| Method | Path           | Description                                            |
| ------ | -------------- | ------------------------------------------------------ |
| GET    | `/health`      | Service health status                                  |
| GET    | `/history`     | List history snapshots (supports filters)              |
| GET    | `/history/:id` | Fetch a single snapshot by Mongo `_id`                 |
| POST   | `/history`     | Create or upsert a snapshot                            |
| PATCH  | `/history/:id` | Update mutable fields (`code`, `language`, `metadata`) |

### Querying history

```
GET /api/v1/history-service/history?userId=u123&limit=10&skip=0
```

Response:

```json
{
  "success": true,
  "items": [
    {
      "_id": "6757baf6f4f1aebc7dce1092",
      "sessionId": "sess-123",
      "userId": "u123",
      "question": {
        "questionId": "two-sum",
        "title": "Two Sum",
        "difficulty": "Easy"
      },
      "code": "// final code ...",
      "language": "javascript",
      "participants": ["u123", "u456"],
      "sessionEndedAt": "2024-11-06T01:43:10.212Z",
      "createdAt": "2024-11-06T01:43:10.212Z",
      "updatedAt": "2024-11-06T01:43:10.212Z"
    }
  ],
  "total": 6,
  "limit": 10,
  "skip": 0
}
```

### Creating / updating a snapshot

```
POST /api/v1/history-service/history
Content-Type: application/json
```

```json
{
  "sessionId": "sess-123",
  "userId": "u123",
  "participants": ["u123", "u456"],
  "language": "javascript",
  "code": "// final document contents",
  "question": {
    "questionId": "two-sum",
    "title": "Two Sum",
    "difficulty": "Easy",
    "topics": ["Arrays"]
  },
  "sessionStartedAt": "2024-11-06T01:20:05.000Z",
  "sessionEndedAt": "2024-11-06T01:43:10.212Z",
  "durationMs": 1385000
}
```

If a document with the same `(sessionId, userId)` already exists it is **upserted**.

### Updating metadata

```
PATCH /api/v1/history-service/history/6757baf6f4f1aebc7dce1092
```

```json
{
  "code": "// corrected snapshot",
  "language": "typescript",
  "metadata": { "notes": "Fixed linter issues" }
}
```

## Data Model

`historyEntry.model.js` stores records in the `session_history` collection with these notable fields:

| Field                                 | Type     | Notes                                              |
| ------------------------------------- | -------- | -------------------------------------------------- |
| `sessionId`                           | String   | Required; indexed                                  |
| `userId`                              | String   | Required; indexed; unique with `sessionId`         |
| `participants`                        | [String] | All collaborators; indexed                         |
| `question`                            | Object   | Includes `questionId`, `title`, `difficulty`, etc. |
| `code`                                | String   | Final code snapshot                                |
| `language`                            | String   | Defaults to `"javascript"`                         |
| `sessionStartedAt` / `sessionEndedAt` | Date     | Optional timestamps                                |
| `durationMs`                          | Number   | Duration in milliseconds                           |
| `metadata`                            | Mixed    | Free-form JSON for downstream use                  |

## Interaction with the Collab Service

1. Collab service emits `POST /history` when a session ends or a snapshot needs to be saved.
2. History service validates the payload, upserts the document, and returns the stored snapshot.
3. Frontend modules query `/history` to display attempt timelines or drill into a specific entry with `/history/:id`.

## Troubleshooting

- Ensure `MONGO_URI` is set; the service throws on startup if it is missing.
- For large queries, adjust `limit` and `skip` parameters (capped at 100 records per request).
- Inspect server logs for `[history.controller]` / `[history.service]` tags to trace API calls.

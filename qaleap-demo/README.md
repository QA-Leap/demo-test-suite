# QA Leap — Task Manager (demo)

A small, realistic Task Manager built by **QA Leap** as a public **showcase target** for
automated testing. It has clear, testable flows, stable `data-testid` selectors, deterministic
data, and **two intentional bugs** (see [`KNOWN_BUGS.md`](./KNOWN_BUGS.md)) used to demonstrate
our bug-reporting process.

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + Express, **in-memory** store (no database — data resets on restart)
- **Auth:** fixed demo credentials, fake bearer token

## Run locally

Requires Node.js 18+ (developed on Node 24).

```bash
npm install && npm start
# App:      http://localhost:3000
# API base: http://localhost:3000/api
```

`npm start` builds the client and serves it together with the API on **one port (3000)**.

### Login

```
email:    demo@qaleap.com
password: Demo123
```

### Development (hot reload)

```bash
npm run dev
# Vite dev server: http://localhost:5173 (proxies /api → :3000)
# API:             http://localhost:3000
```

Automated tests should target the production-style build on **:3000** (`npm start`).

## Features

- **Login** with validation (empty fields, invalid email format, wrong credentials).
- **Tasks** table — Title, Status, Priority, Created date.
- **Create / Edit / Delete** (with confirmation) and inline **status change**.
- **Filter** by status: All / To Do / In Progress / Done.
- Seeded with 7 tasks (fixed ids `1..7`, fixed dates) on every start.

## REST API

Base URL `http://localhost:3000/api`. All `/tasks*` routes require an `Authorization: Bearer <token>`
header (get the token from `POST /api/login`). Response envelope:

```jsonc
{ "success": true,  "data": { /* ... */ } }
{ "success": false, "error": { "message": "..." } }
```

| Method | Path | Success | Errors |
|--------|------|---------|--------|
| POST | `/api/login` | 200 `{ token }` | 400 empty, 401 wrong creds |
| GET | `/api/tasks` (`?status=`) | 200 `Task[]` | 401 |
| GET | `/api/tasks/:id` | 200 `Task` | 401, 404 |
| POST | `/api/tasks` | 201 `Task` | 400, 401 |
| PUT | `/api/tasks/:id` | 200 `Task` | 400, 401, 404 |
| PATCH | `/api/tasks/:id/status` | 200 `Task` | 400, 401, 404 |
| DELETE | `/api/tasks/:id` | 200 `{ id }` | 401, 404 |

`Task = { id, title, description, status: todo|in_progress|done, priority: low|medium|high, createdAt }`

### Quick API check

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@qaleap.com","password":"Demo123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["token"])')

curl -s http://localhost:3000/api/tasks -H "Authorization: Bearer $TOKEN"
```

## Intentional bugs

Two bugs are **active by default** (full write-ups in [`KNOWN_BUGS.md`](./KNOWN_BUGS.md)):

- **BUG-107** (client): double-clicking **Create task** creates two tasks (no in-flight guard).
- **BUG-108** (server): `GET /api/tasks?status=DONE` (uppercase) returns an empty list —
  the status filter is case-sensitive.

### Verify BUG-107 (UI)
1. Log in → **+ Create task** → type a title → **double-click** the Create button.
2. Two identical rows appear instead of one.

### Verify BUG-108 (API)
```bash
curl -s "http://localhost:3000/api/tasks?status=done" -H "Authorization: Bearer $TOKEN"  # 2 done tasks
curl -s "http://localhost:3000/api/tasks?status=DONE" -H "Authorization: Bearer $TOKEN"  # [] ← bug
```

### Toggle the bugs off (for "bug → fix" demos)
- Add `?fixed=1` to the URL, or flip the **Bug mode / Fixed mode** switch in the top bar
  (no restart needed).
- Or start the whole instance fixed: `DEMO_FIXED=1 npm start`.

## Project structure

```
qaleap-demo/
├─ client/            # React + TypeScript (Vite)
│  └─ src/            # pages, components, api client, styles
├─ server/            # Express + TypeScript, in-memory store
│  └─ src/            # index, store (seed), auth, task routes
├─ KNOWN_BUGS.md      # the two intentional bugs
├─ package.json       # single root: deps + scripts
└─ README.md
```

## Notes

- No database, no registration / password reset / profiles — intentionally minimal.
- Data is in memory and **resets on every server restart**.
- Every interactive element has a stable `data-testid`; task ids are deterministic.

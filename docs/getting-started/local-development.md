# Local Development Workflow

This document provides deep technical guidance on working within the local development sandbox, accessing SQLite files, making database schema changes, and debugging.

---

## 1. Miniflare & Local Worker Sandbox
Wrangler uses **Miniflare** under the hood to simulate a serverless Cloudflare Workers environment. 
* Local KV namespaces are persisted in `.wrangler/state/v3/kv`.
* Local D1 SQLite files are located under `.wrangler/state/v3/d1`.

---

## 2. Inspecting the Local SQLite Database
If you want to view, debug, or write custom SQL directly against your local development D1 database, you can connect to the sqlite file:
1. Locate the `.sqlite` file under the `.wrangler/` directory:
   ```bash
   # Find the path in api-worker workspace
   dir apps/api-worker/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/
   ```
2. Open it with any SQLite Client (like DB Browser for SQLite, DBeaver, or via the command line):
   ```bash
   sqlite3 "apps/api-worker/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/your_db_file_name.sqlite"
   ```

---

## 3. Database Schema Changes (Drizzle Workflow)
If you need to add columns or tables to the database:
1. Update your schema definitions inside `apps/api-worker/src/db/schema.ts`.
2. Generate a new SQL migration file:
   ```bash
   cd apps/api-worker
   npx drizzle-kit generate
   ```
   *This creates a new migration file under `apps/api-worker/drizzle/`.*
3. Apply the migration to your local development database:
   ```bash
   npx wrangler d1 migrations apply webhook-platform-db --local
   ```

---

## 4. Local Clean & Reset Utilities
For integration testing, the API exposes clean/reset routes that are available in local development (but locked/disabled in production):
* **Reset Database**: `POST /test/reset-db` deletes all rows from D1 tables (organizations, projects, members, users, webhook endpoints, events, deliveries, audit logs).
* **Instant Retry Reset**: `POST /test/reset-retry` resets `next_retry_at` to `0` for all events to force immediate processing.

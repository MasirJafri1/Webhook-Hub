# System Architecture

WebHook Hub is designed from the ground up to leverage Cloudflare's serverless edge computing and database layer.

---

## Edge-First Architecture Topology

The entire application runs at the Cloudflare Edge network across 300+ data centers worldwide. When a client publishes an event, the request is routed to the geographically closest data center, yielding sub-millisecond network times.

```mermaid
graph TD
    subgraph "Client Layer"
        A["Publisher Backend<br/>(SaaS App)"]
        B["Developer Dashboard<br/>(React SPA)"]
    end

    subgraph "Authentication"
        C["Google OAuth<br/>(ID Token Verify)"]
        D["API Key Auth<br/>(SHA-256 Hash)"]
    end

    subgraph "Cloudflare Edge Worker"
        E["itty-router<br/>(API Gateway)"]
        F["Rate Limiter<br/>(IP-based)"]
        G["Auth Middleware<br/>(JWT / API Key)"]
        H["Route Handlers"]
    end

    subgraph "Storage"
        I[("D1 Database<br/>(SQLite)")]
        J[("Workers KV<br/>(Cache)")]
    end

    subgraph "Background Pipeline"
        K["Cron Scheduler<br/>(Every 1 min)"]
        L["Delivery Engine"]
        M["Transform & Sign<br/>(HMAC-SHA256)"]
        N["Target Endpoints"]
    end

    A -->|"POST /api/v1/events"| E
    B -->|"REST API Calls"| E
    B --> C
    A --> D

    E --> F --> G --> H
    H --> I & J

    K --> L
    L --> I & J
    L --> M --> N
    N -->|"Delivery Logs"| I
```

---

## Core Layers

### 1. Ingestion & API Gateway (Cloudflare Workers)
The entry point of the application is a stateless worker that routes HTTP requests using the `itty-router` micro-router. 
* **Ingestion Path**: Accepts event payloads, parses them, registers the event to D1, and schedules background delivery in the edge isolate.
* **Management Path**: Handles developer endpoints (CRUD operations for webhooks, keys, search, etc.) secured via JWT session middleware.
* **Authentication Path**: Verifies Google OAuth tokens and issues JWT sessions for dashboard users.

### 2. Multi-Layer Rate Limiting
Rate limiting is enforced at multiple levels to prevent abuse:

```mermaid
graph LR
    A["Request"] --> B{"Auth<br/>Route?"}
    B -->|"Yes"| C["5 req/min<br/>per IP"]
    B -->|"No"| D["60 req/min<br/>per IP"]
    C --> D
    D --> E["Process"]

    F["Delivery"] --> G["Per-endpoint<br/>throttle (KV)"]
```

* **Auth brute-force**: 5 requests/minute per IP on auth endpoints
* **Global API**: 60 requests/minute per IP on all endpoints
* **Egress**: Configurable per-endpoint rate limit using KV counters

### 3. Distributed Locking & Double Delivery Prevention
To prevent multiple worker threads from processing the same retry or event delivery concurrently:
* A SQLite-based atomic transaction lock is implemented.
* The worker runs a query to update the event status to `"processing"` only if it is currently `"pending"` or `"retrying"`. Since D1 guarantees read-after-write consistency, only one concurrent worker can update the status, preventing double delivery.

### 4. Edge Storage Layer (D1 & KV)
* **Cloudflare D1**: SQL database used as the single source of truth for structural configurations (users, orgs, projects, keys) and transactional logs.
* **Cloudflare KV**: High-performance, distributed key-value store utilized as a cache layer for API key hashes, rate limit counters, and workspaces to skip D1 queries during ingestion cycles.

### 5. Background Processing (`ctx.waitUntil`)
To keep API responses fast, once an event is validated and stored in D1, the API immediately returns `201 Created` to the publisher. The delivery execution is pushed to the edge background thread using `ctx.waitUntil(runDeliveryJob(env))`, ensuring zero latency overhead.

### 6. Dynamic CORS Policy
CORS is enforced with a split strategy:
* **Public ingestion** (`/api/v1/events`): Wildcard `*` origin — any publisher can ingest.
* **Dashboard APIs** (all other routes): Restricted to whitelisted origins (localhost, production domain, Cloudflare Pages previews).

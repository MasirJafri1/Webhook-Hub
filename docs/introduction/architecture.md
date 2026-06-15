# System Architecture

WebHook Hub is designed from the ground up to leverage Cloudflare's serverless edge computing and database layer.

---

## Edge-First Architecture Topology

The entire application runs at the Cloudflare Edge network across 300+ data centers worldwide. When a client publishes an event, the request is routed to the geographically closest data center, yielding sub-millisecond network times.

```mermaid
graph TD
    A[Core Ingestion Client] -->|HTTPS POST| B(Cloudflare Edge: Worker)
    B -->|Check Cache| C[(Workers KV)]
    B -->|Fallback Query| D[(D1 Database)]
    B -->|Ingest & Ack HTTP 201| A
    B -->|Background Job| E{Egress Router}
    E -->|Filter Match| F[Payload Transformer]
    E -->|Filter Mismatch| G[Skip Event]
    F -->|Sign Payload| H[HMAC-SHA256 Signer]
    H -->|Dispatch POST| I[Receiver Endpoint]
    I -->|HTTP Status| J[Update Events & Log Deliveries]
    J --> D
```

---

## Core Layers

### 1. Ingestion & API Gateway (Cloudflare Workers)
The entry point of the application is a stateless worker that routes HTTP requests using the `itty-router` micro-router. 
* **Ingestion Path**: Accepts event payloads, parses them, registers the event to D1, and schedules background delivery in the edge isolate.
* **Management Path**: Handles developer endpoints (crud operations for webhooks, keys, search, etc.) secured via JWT session middleware.

### 2. Distributed Locking & Double Delivery Prevention
To prevent multiple worker threads from processing the same retry or event delivery concurrently:
* A SQLite-based atomic transaction lock is implemented.
* The worker runs a query to update the event status to `"processing"` only if it is currently `"pending"` or `"retrying"`. Since D1 guarantees read-after-write consistency, only one concurrent worker can update the status, preventing double delivery.

### 3. Edge Storage Layer (D1 & KV)
* **Cloudflare D1**: SQL database used as the single source of truth for structural configurations (users, orgs, projects, keys) and transactional logs.
* **Cloudflare KV**: High-performance, distributed key-value store utilized as a cache layer for API key hashes and workspaces to skip D1 queries during ingestion cycles.

### 4. Background Processing (`ctx.waitUntil`)
To keep API responses fast, once an event is validated and stored in D1, the API immediately returns `201 Created` to the publisher. The delivery execution is pushed to the edge background thread using `ctx.waitUntil(runDeliveryJob(env))`, ensuring zero latency overhead.

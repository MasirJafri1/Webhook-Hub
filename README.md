# WebHook Hub

WebHook Hub is an enterprise-grade, edge-first, open-source **Webhooks-as-a-Service (WaaS)** platform. Designed to run entirely on Cloudflare's serverless stack, it provides developers and SaaS platforms with a highly scalable, reliable, and cost-effective event delivery pipeline.

---

## Core Features

* **Edge-Native Ingestion**: Built on Cloudflare Workers for sub-millisecond event ingestion with zero cold starts.
* **Resilient Retry Pipeline**: Exponential backoff retry engine (`[60s, 300s, 900s, 3600s]`) with built-in payload-specific **Poison Event Isolation**.
* **Zero-Downtime Secret Rotation**: Secure rolling webhook secrets (`current` and `previous`) for safe, uninterrupted secret updates.
* **Payload Transformations & Filtering**: In-transit JSON modifications (renaming keys, removing sensitive values, inserting static keys, template nesting) and event type filters.
* **D1 Distributed Locks**: Concurrency control via single-threaded atomic SQLite database updates in Cloudflare D1 (eliminating the need for expensive Durable Objects).
* **Multi-Tenant Scoping**: Dynamic tenant context resolution with strict logical isolation using SHA-256 hashed API Keys (for publishers) and JWT HS256 auth (for dashboard users).
* **Super Admin Gatekeeper**: Pending registrations queue requiring Super Admin approval before workspace provisioning.
* **Developer Portal Dashboard**: Interactive React dashboard for managing endpoints, inspecting deliveries, auditing logs, and viewing latencies.

---

## Project Directory Map

* [`apps/api-worker/`](apps/api-worker): Backend Cloudflare Worker REST API, repository layer, and background scheduled cron jobs.
* [`apps/dashboard/`](apps/dashboard): React SPA client dashboard for project managers and developer configuration.
* [`docs/`](docs): Complete technical specification and architectural documentation.
* [`terraform/`](terraform): Terraform files for automations and provisioning resources on Cloudflare.

---

## Quick Start (Local Development)

### Prerequisites
* Node.js v18 or higher
* npm or yarn
* Wrangler CLI installed globally (`npm install -g wrangler`)

### 1. Backend API Setup
1. Navigate to the api directory:
   ```bash
   cd apps/api-worker
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the local D1 SQLite database:
   ```bash
   npx wrangler d1 migrations apply webhook-platform-db --local
   ```
4. Start the local API development server:
   ```bash
   npm run dev
   ```
   *The API will start running locally at `http://localhost:8787`.*

### 2. Frontend Dashboard Setup
1. Navigate to the dashboard directory:
   ```bash
   cd ../dashboard
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The UI will start running locally at `http://localhost:5173`.*

---

## Detailed Project Documentation Directory

WebHook Hub includes a comprehensive set of operational, security, and architectural design files. Use the links below to access the deep-dive guides:

### 1. Introduction & Core Concepts
* [**Platform Overview**](docs/introduction/overview.md): High-level feature sets, value propositions, and comparative benefits.
* [**System Architecture**](docs/introduction/architecture.md): The structural design mapping API gateways, queue brokers, and scheduling nodes.
* [**Core Concepts**](docs/introduction/concepts.md): Conceptual vocabulary defining publishers, subscribers, events, deliveries, and retries.

### 2. Getting Started
* [**Quick Start Guide**](docs/getting-started/quickstart.md): Step-by-step installation instructions for local development.
* [**Local Development Spec**](docs/getting-started/local-development.md): Mock files, seeding utilities, and local testing configurations.
* [**Deployment Manual**](docs/getting-started/deployment.md): Steps for deploying the worker and dashboard to Cloudflare production.
* [**Infrastructure as Code (IaC)**](docs/getting-started/terraform.md): Terraform configuration variables and Cloudflare target resource variables.

### 3. API Reference
* [**Authentication**](docs/api/authentication.md): API Key validation endpoints and JWT session tokens.
* [**Webhooks API**](docs/api/webhooks.md): CRUD parameters for creating and rotating webhook targets.
* [**Events API**](docs/api/events.md): Specifications for publishing and querying event payloads.
* [**Deliveries API**](docs/api/deliveries.md): Fetching and searching transaction attempts history logs.
* [**Metrics API**](docs/api/metrics.md): Fetching live latencies, totals, and response status counts.
* [**Error Responses**](docs/api/errors.md): Standard error formats (400, 401, 403, 404, 429, 500).

### 4. Advanced Guides
* [**Secret Rotation Guide**](docs/guides/secret-rotation.md): How to execute zero-downtime signing key rotations on your receivers.
* [**Retry Policy Guide**](docs/guides/retry-policy.md): The exponential backoff schedule, states logic, and poison checks.
* [**Filtering & Transformations**](docs/guides/filtering-and-transformations.md): Event type routing and nested JSON templates.

### 5. Security & Isolation
* [**Webhook Signatures**](docs/security/webhook-signatures.md): Verification algorithms and examples in Node.js, Python, and Go.
* [**API Key Protection**](docs/security/api-keys.md): Zero-plaintext SHA-256 hash lookups.
* [**Replay Protection**](docs/security/replay-protection.md): Signature timestamps drift limits and idempotency deduplication.
* [**Security Model**](docs/security/security-model.md): Multi-tenant isolation boundaries, CORS limits, and Super Admin approvals.

### 6. Operations & Maintenance
* [**Monitoring & Metrics**](docs/operations/monitoring.md): Observability charts and administrative action audit logs.
* [**Rate Limits**](docs/operations/rate-limits.md): Ingress rate limiting and egress KV throttling counters.
* [**Data Retention**](docs/operations/retention-policy.md): 7-day storage limits caps and purging sequences.
* [**Dead Letter Queue (DLQ)**](docs/operations/dead-letter-queue.md): Quarantining failed/poisoned webhooks for debugging.
* [**Disaster Recovery**](docs/operations/disaster-recovery.md): Hourly D1 database restoration and failover runbooks.

### 7. Internal System Architecture
* [**Delivery Engine**](docs/architecture/delivery-engine.md): Behind-the-scenes pipeline routing mechanics.
* [**Retry Engine**](docs/architecture/retry-engine.md): Concurrency handling for delayed event retry loops.
* [**Concurrency & Locking**](docs/architecture/durable-objects.md): Stateless distributed event locking using D1 updates.
* [**Database Schema Design**](docs/architecture/database-design.md): In-depth table representations and indexing rules.
* [**Tenancy & Workspace Scoping**](docs/architecture/tenancy-model.md): Multi-tenant isolation filters and user credentials authentication flow.

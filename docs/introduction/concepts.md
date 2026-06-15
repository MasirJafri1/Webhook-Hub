# Core Domain Concepts

To work effectively with WebHook Hub, it is helpful to understand the underlying relational concepts and terminology used throughout the API and codebase.

---

## 1. Organization
An **Organization** is the highest-level entity representing a business, team, or account tenancy. It maps directly to billing limits and contains members (users) who have access to manage the resources.
* *Example*: `Acme Corp`

## 2. Project
A **Project** is a distinct workspace partition inside an Organization. API keys are mapped to a specific project. Webhooks, events, and metrics are isolated at the project level, allowing you to use the same platform for `Staging`, `Production`, and `Development` environments.
* *Example*: `Acme Prod API`

## 3. Webhook Endpoint
An **Endpoint** is a target destination configured by your customers to receive event messages. It contains the target URL, current and previous HMAC signing secrets, specific event filters, custom HTTP headers, version selection (`v1` or `v2`), and consecutive failure counters.
* *Example*: `https://api.customer.com/webhooks/receiver`

## 4. Event
An **Event** represents a transactional occurrence in your SaaS platform. It contains a unique ID, the event type, the raw JSON payload, a status (e.g. `pending`, `delivered`, `failed`, `dead`, `poisoned`), retry count, and error state tracking.
* *Example*: `user.subscription_cancelled`

## 5. Delivery
A **Delivery** is a historical record of an individual HTTP request attempt made to a webhook endpoint for a specific event. It stores the latency, HTTP response status code, exact response body received from the client, and timestamp. A single Event can have multiple Deliveries (one for each retry attempt).

## 6. API Key
An **API Key** is a cryptographically secure token (`whpk_live_...`) utilized by your publisher backend services to authorize event ingestion. To protect keys from being leaked in plaintext if the database is compromised, the D1 database stores only the `SHA-256` hash of the API key.

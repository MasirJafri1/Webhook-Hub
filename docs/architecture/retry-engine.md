# Retry Engine Architecture

WebHook Hub's Retry Engine is responsible for scheduling, throttling, and routing events that fail during delivery attempts. Designed for resilience, it ensures "at least once" delivery while safeguarding platform compute resources and preventing target servers from entering failure loops.

---

## Retrying Logic Flow

When a webhook delivery fails (either because the target URL returned a non-2xx status code or a network timeout/exception occurred):

```mermaid
graph TD
    A[Delivery Failed] --> B[Compute SHA-256 Hash of response/error body]
    B --> C{Is event.lastErrorHash == currentHash \n AND event.retryCount >= 2?}
    C -->|Yes| D[Mark event 'poisoned' \n status = poisoned \n Abort future retries]
    C -->|No| E{Is retryCount < 4?}
    E -->|Yes| F[Read delay = RETRY_DELAYS[retryCount] \n Calculate nextRetry = now + delay]
    F --> G[UPDATE events SET \n status = 'retrying', \n retryCount = retryCount + 1, \n nextRetryAt = nextRetry, \n lastErrorHash = currentHash]
    E -->|No| H[Mark event 'dead' \n status = dead \n Abort future retries]
```

---

## Tiered Backoff Schedule

WebHook Hub uses a tiered interval array (`RETRY_DELAYS` in seconds): `[60, 300, 900, 3600]`.

This design addresses specific downtime patterns:
1. **Attempt 1 (60 seconds)**: Handles ephemeral TCP connection glitches or quick server process recycles.
2. **Attempt 2 (300 seconds / 5 mins)**: Gives the downstream receiver time to recover from short database restarts or deployment rollouts.
3. **Attempt 3 (900 seconds / 15 mins)**: Addresses brief infrastructure outages (e.g., secondary server failovers).
4. **Attempt 4 (3600 seconds / 1 hour)**: The final attempt, allowing developers to receive notifications and deploy fixes for longer outages.

---

## Poison Event Isolation (Payload Fingerprinting)

One of the key innovations of the Retry Engine is **Poison Event Isolation**, which checks for payload-specific rejections.

### The Problem:
A downstream API server may return a `400 Bad Request` or `422 Unprocessable Entity` because a webhook payload is malformed or violates validation rules. Retrying this payload with exponential backoff is useless; the content of the payload will not change, and the downstream server will reject it every time, wasting execution time and CPU.

### The Solution (Error Fingerprinting):
1. On every failure, the response body or connection error message is hashed:
   
$$\text{ErrorHash} = \text{SHA-256}(\text{ResponseText})$$

2. The hash is saved to `last_error_hash`.
3. Before scheduling the next retry:
   * If `retryCount >= 2` AND `lastErrorHash == ErrorHash`, the engine flags the event as **poisoned**.
   * The status is updated to `poisoned = true`, halting all automatic attempts.
   * This isolates payload-specific validation failures early (on the third attempt) while still allowing connection failures (which change error signatures or succeed on retry) to go through the full 4-attempt backoff lifecycle.

---

## Database Schema Representation

The state of the retry pipeline is tracked natively in the `events` table:

```typescript
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),            // 'pending' | 'processing' | 'delivered' | 'retrying' | 'dead' | 'poisoned'
  retryCount: integer("retry_count").notNull(), // Increments on failure (0 to 4)
  nextRetryAt: integer("next_retry_at"),        // Epoch ms when event becomes deliverable again
  lastAttemptAt: integer("last_attempt_at"),    // Epoch ms of last HTTP fetch
  lastErrorHash: text("last_error_hash"),       // SHA-256 fingerprint of last failure
  poisoned: integer("poisoned", { mode: "boolean" }), // Flag for isolated payload errors
});
```
*Note: Because all locks and status transitions are transactional SQLite updates, the retry engine operates in a stateless serverless context, using the database table as the primary queue state broker.*

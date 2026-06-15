# Replay Attack Protection

A replay attack occurs when an attacker intercepts a valid webhook request (payload and headers) and sends it repeatedly to the destination server. Even though the attacker cannot read the encrypted HTTPS traffic or modify the payload, they can force the target server to process duplicate actions (such as duplicate checkouts, double-credits, or database insert exhaustion).

WebHook Hub implements a dual-defense architecture using **Timestamp Verification** and **Idempotency Keys** to mitigate replay attacks.

---

## Defense 1: Signature-Timestamp Binding

The core defense against webhook replay attacks is binding the request timestamp directly to the cryptographic signature.

### How the Attacker is Blocked:
1. When a webhook is dispatched, WebHook Hub adds the `x-webhook-timestamp` header containing the Unix timestamp.
2. The payload signature is computed over:
   
$$\text{Signature} = \text{HMAC-SHA256}(\text{Secret}, \text{timestamp} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{eventId} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{payload})$$

3. If an attacker intercepts the request and tries to replay it after 10 minutes:
   * **Case A (Replaying unmodified request)**: The receiver checks the `x-webhook-timestamp` header. The timestamp is older than the 5-minute threshold ($300\text{ seconds}$), and the receiver rejects the request.
   * **Case B (Modifying the timestamp header to look recent)**: If the attacker updates the `x-webhook-timestamp` header to the current time, the signature verification fails because the timestamp is part of the signed message payload. The computed HMAC will not match the `x-webhook-signature` header.

---

## Implementing Timestamp Drift Verification

Your webhook receiver must enforce a strict drift validation window. A 5-minute (300 seconds) window is recommended to account for slight clock drifts between WebHook Hub edge nodes and your servers.

```typescript
const driftLimitSeconds = 300;
const timestampSeconds = parseInt(request.headers['x-webhook-timestamp'], 10);
const nowSeconds = Math.floor(Date.now() / 1000);

if (Math.abs(nowSeconds - timestampSeconds) > driftLimitSeconds) {
  throw new Error("Request rejected: Timestamp drift limit exceeded (Replay Attack suspected).");
}
```

---

## Defense 2: Deduplication via Idempotency Keys

While timestamp verification limits the replay attack window to 5 minutes, an attacker could theoretically replay a captured request multiple times *within* that 5-minute window. To prevent this, idempotency keys should be used.

### 1. Inbound Event Publishing (Client to WebHook Hub)
When publishing events to WebHook Hub, clients can include the `idempotency-key` header:
* The platform checks if an event with that `idempotencyKey` already exists for the project in the D1 database.
* If a match is found, the platform returns the existing event record instead of inserting a duplicate event.
* This allows clients to safely retry failed API requests (e.g., due to connection timeouts) without publishing duplicate webhook events.

### 2. Outbound Event Consumption (WebHook Hub to Consumer)
To guarantee "exactly-once" processing on your backend, your webhook receiver should implement deduplication using the `x-webhook-id` header:
* For each incoming webhook, extract `x-webhook-id`.
* Store the processed event IDs in a fast key-value store (e.g., Redis or an index-supported database table) with a Time-To-Live (TTL) of 24 to 48 hours.
* Check the store before processing a request. If the ID exists, immediately return a `200 OK` response and skip execution.

```typescript
async function handleWebhook(req: Request) {
  const eventId = req.headers['x-webhook-id'];
  
  // Try to acquire a lock/mark key in Redis with 24h expiration
  const isDuplicate = !(await redis.set(`processed_event:${eventId}`, "true", "NX", "EX", 86400));
  
  if (isDuplicate) {
    return { status: 200, message: "Duplicate request ignored." };
  }
  
  // Process webhook action...
}
```
*Note: Because WebHook Hub uses an "at least once" delivery guarantee (which can trigger duplicate attempts under network latency, packet loss, or worker timeout retries), implementing deduplication at your application boundary is critical.*

# Secret Rotation Guide

WebHook Hub provides an enterprise-grade, zero-downtime secret rotation mechanism for webhook endpoints. This guide details why secret rotation is necessary, how it works under the hood, and how consumers can handle rotations gracefully without dropping any webhook events.

---

## Why Rotate Secrets?

A webhook endpoint secret is a shared key used to compute cryptographic signatures (`HMAC-SHA256`) for webhook payloads. If an unauthorized party obtains this secret, they can forge fake event payloads, presenting them as legitimate traffic from WebHook Hub.

Secret rotation should be done:
1. **Periodically**: As a security best practice (e.g., every 90 days).
2. **On Demand**: Immediately if a secret is accidentally exposed, committed to version control, or compromised.

---

## How It Works: Rolling Secrets

To prevent service disruption during secret rotation, WebHook Hub implements a **rolling secret strategy** using two database columns on the `webhook_endpoints` table:
* `current_secret`: The secret currently used to sign outgoing webhook payloads.
* `previous_secret`: The secret used prior to the last rotation.

When you trigger a rotation:
1. The `current_secret` is copied into `previous_secret`.
2. A new secure random UUID is generated and saved as the new `current_secret`.
3. `secret_rotated_at` is updated with the current timestamp.
4. An audit log event (`SECRET_ROTATED`) is registered.

During the propagation window, receiver services can authenticate messages against either the new `current_secret` or the old `previous_secret` to avoid failure during deployment updates.

---

## Triggering Secret Rotation

### Via the Developer Dashboard
1. Navigate to the **Webhooks** dashboard.
2. Click on the specific webhook endpoint you wish to manage.
3. Find the **Signing Secrets** section.
4. Click **Rotate Secret**. The dashboard will display the new secret once.

### Via the REST API
Send a `POST` request to the rotate endpoint authenticated with your API Key:

```http
POST /api/v1/webhooks/:endpoint_id/rotate-secret
Authorization: Bearer <your_api_key>
Content-Type: application/json
```

**Response (200 OK)**:
```json
{
  "secret": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

---

## Receiver Verification Pattern (Zero-Downtime)

To ensure zero downtime, your webhook receiving endpoint should support verifying signatures against **both** the new and old secrets during the rotation period. Here is a TypeScript example of how to implement this pattern:

```typescript
import { createHmac, timingSafeEqual } from "crypto";

interface WebhookHeaders {
  signature: string;
  timestamp: string;
  eventId: string;
}

// Stored in your application's environment variables or secrets manager
const CURRENT_SECRET = process.env.WEBHOOK_SECRET_CURRENT!;
const PREVIOUS_SECRET = process.env.WEBHOOK_SECRET_PREVIOUS; // Optional

function verifySignature(
  payload: string,
  headers: WebhookHeaders,
  secret: string
): boolean {
  const content = `${headers.timestamp}.${headers.eventId}.${payload}`;
  const computedHash = createHmac("sha256", secret)
    .update(content)
    .digest("hex");

  const computedBuffer = Buffer.from(computedHash);
  const receivedBuffer = Buffer.from(headers.signature);

  if (computedBuffer.length !== receivedBuffer.length) {
    return false;
  }
  return timingSafeEqual(computedBuffer, receivedBuffer);
}

export async function handleWebhook(req: any, res: any) {
  const payload = JSON.stringify(req.body);
  const headers: WebhookHeaders = {
    signature: req.headers["x-webhook-signature"],
    timestamp: req.headers["x-webhook-timestamp"],
    eventId: req.headers["x-webhook-id"],
  };

  // 1. Try verifying with the primary current secret
  let isValid = verifySignature(payload, headers, CURRENT_SECRET);

  // 2. If it fails, and a previous secret exists, try the previous secret
  if (!isValid && PREVIOUS_SECRET) {
    isValid = verifySignature(payload, headers, PREVIOUS_SECRET);
  }

  if (!isValid) {
    return res.status(401).send("Invalid signature");
  }

  // Proceed with processing the webhook payload safely...
  res.status(200).send("Accepted");
}
```

By allowing a transition window (e.g., 24-48 hours) where the receiving server accepts both secrets, you can rotate secrets across high-volume systems without losing a single webhook notification.

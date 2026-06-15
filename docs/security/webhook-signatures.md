# Webhook Signatures

To ensure that webhook events received by your application are actually sent by WebHook Hub and have not been tampered with in transit, you must verify the cryptographic signature sent with each webhook request.

---

## Signature Headers

WebHook Hub signs every outgoing HTTP POST payload and appends the following headers to the request:

| Header | Description |
| :--- | :--- |
| `x-webhook-id` | The unique ID of the event (e.g., `evt_123456789`). |
| `x-webhook-timestamp` | The Unix epoch timestamp (in seconds) representing when the request was signed. |
| `x-webhook-signature` | The calculated HMAC-SHA256 signature hash of the request content. |
| `x-webhook-version` | The version of the webhook schema (default is `v1`). |

---

## Signature Construction

The signature is computed using **HMAC-SHA256** with the endpoint's unique signing secret (accessible in the dashboard or via API).

The message payload input string to the HMAC function is constructed by concatenating the timestamp, event ID, and raw JSON request body, separated by a dot (`.`):

$$\text{SigningContent} = \text{timestamp} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{eventId} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{rawPayload}$$

In TypeScript:
```typescript
const content = `${timestamp}.${eventId}.${rawPayload}`;
const expectedSignature = hmacSha256(signingSecret, content);
```

---

## Verification Flow

To implement secure signature verification, your service should follow this step-by-step workflow:

1. **Extract Headers**: Retrieve the values of `x-webhook-signature`, `x-webhook-timestamp`, and `x-webhook-id`.
2. **Retrieve Raw Body**: Read the raw request body as a string. Do **not** use the parsed JSON object directly, as different JSON parsers can reorder keys or alter spacing, modifying the raw text footprint and invalidating the signature.
3. **Verify Timestamp**: Verify that the timestamp is within 300 seconds (5 minutes) of the current time. If it is older or newer, reject the request to prevent Replay Attacks.
4. **Compute Signature**: Calculate the HMAC-SHA256 signature using the shared secret and the constructed signature content.
5. **Compare Safely**: Compare your computed signature string to the value of the `x-webhook-signature` header using a constant-time comparison helper. This prevents timing analysis attacks.

---

## Code Examples

### 1. Node.js / TypeScript
```typescript
import { createHmac, timingSafeEqual } from "crypto";

export function verifyWebhook(
  rawBody: string,
  secret: string,
  signature: string,
  timestamp: string,
  eventId: string
): boolean {
  // 1. Prevent Replay attacks (5-minute drift)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    return false;
  }

  // 2. Compute signature
  const content = `${timestamp}.${eventId}.${rawBody}`;
  const computed = createHmac("sha256", secret)
    .update(content)
    .digest("hex");

  // 3. Constant-time comparison
  const a = Buffer.from(computed);
  const b = Buffer.from(signature);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
```

### 2. Python (Flask example)
```python
import hmac
import hashlib
import time
from flask import request, abort

def verify_webhook(secret: str):
    signature = request.headers.get("x-webhook-signature")
    timestamp = request.headers.get("x-webhook-timestamp")
    event_id = request.headers.get("x-webhook-id")
    
    if not all([signature, timestamp, event_id]):
        abort(401, "Missing headers")
        
    # Prevent Replay attacks
    now = int(time.time())
    if abs(now - int(timestamp)) > 300:
        abort(401, "Timestamp expired")
        
    raw_body = request.get_data(as_text=True)
    content = f"{timestamp}.{event_id}.{raw_body}".encode("utf-8")
    
    # Compute signature
    computed = hmac.new(
        secret.encode("utf-8"),
        content,
        hashlib.sha256
    ).hexdigest()
    
    # Constant-time comparison
    if not hmac.compare_digest(computed, signature):
        abort(401, "Invalid signature")
```

### 3. Go
```go
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"
)

func VerifyWebhook(w http.ResponseWriter, r *http.Request, secret string, rawBody []byte) bool {
	signature := r.Header.Get("x-webhook-signature")
	timestampStr := r.Header.Get("x-webhook-timestamp")
	eventID := r.Header.Get("x-webhook-id")

	// Verify timestamp
	timestamp, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		return false
	}
	now := time.Now().Unix()
	if math.Abs(float64(now-timestamp)) > 300 {
		return false
	}

	// Compute HMAC
	content := fmt.Sprintf("%d.%s.%s", timestamp, eventID, string(rawBody))
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(content))
	computed := hex.EncodeToString(mac.Sum(nil))

	// Constant-time comparison
	return hmac.Equal([]byte(computed), []byte(signature))
}
```

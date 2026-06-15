# Webhook Endpoints API

The webhook endpoints API allows you to create and manage target receiver destinations.

---

## 1. Create a Webhook Endpoint
`POST /api/v1/webhooks`

Creates a new target webhook endpoint configuration.

### Request Headers
```http
Authorization: Bearer <JWT_or_API_Key>
Content-Type: application/json
```

### Request Body Parameters
* **`name`** (String, Required): Name/label of the webhook. Min 3, max 100 characters.
* **`url`** (String, Required): Target URL where HTTP POST payloads will be dispatched.
* **`version`** (String, Optional, Default: `"v1"`): Webhook payload structure version. Options: `"v1"`, `"v2"`.
* **`eventFilters`** (Array of Strings, Optional): Array of specific event types this webhook subscribes to. If omitted, subscribes to all events.
* **`customHeaders`** (Record of Strings, Optional): Record of static custom headers to attach to each egress request.
* **`payloadTransform`** (Object, Optional): Structural mapping rules. (See Transformations guide).

```json
{
  "name": "Production Slack Sync",
  "url": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
  "version": "v1",
  "eventFilters": ["user.created", "invoice.paid"],
  "customHeaders": {
    "X-Source-App": "WebhookHub"
  }
}
```

### Response (201 Created)
```json
{
  "id": "whk_7JEQ-j2PDuAKGhzwEglhf",
  "projectId": "proj_rcU2dyx7Fvjoarx9mCvyZ",
  "name": "Production Slack Sync",
  "url": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
  "currentSecret": "whsec_live_7A4fEa31bC9DeFgHjK123456",
  "version": "v1",
  "active": true,
  "consecutiveFailures": 0,
  "createdAt": 1781441927374
}
```

---

## 2. List Webhook Endpoints
`GET /api/v1/webhooks`

Returns a list of all active webhook endpoints configured in your active project.

### Response (200 OK)
```json
[
  {
    "id": "whk_7JEQ-j2PDuAKGhzwEglhf",
    "name": "Production Slack Sync",
    "url": "https://hooks.slack.com/services/...",
    "active": true,
    "createdAt": 1781441927374
  }
]
```

---

## 3. Retrieve Webhook Endpoint
`GET /api/v1/webhooks/:id`

Retrieves the details of a specific webhook endpoint.

### Response (200 OK)
```json
{
  "id": "whk_7JEQ-j2PDuAKGhzwEglhf",
  "name": "Production Slack Sync",
  "url": "https://hooks.slack.com/services/...",
  "currentSecret": "whsec_live_...",
  "previousSecret": null,
  "version": "v1",
  "eventFilters": "[\"user.created\",\"invoice.paid\"]",
  "customHeaders": "{\"X-Source-App\":\"WebhookHub\"}",
  "active": true,
  "createdAt": 1781441927374
}
```

---

## 4. Delete Webhook Endpoint
`DELETE /api/v1/webhooks/:id`

Soft-deletes the webhook endpoint, disabling any future deliveries.

### Response (200 OK)
```json
{
  "success": true
}
```

---

## 5. Rotate Secret
`POST /api/v1/webhooks/:id/rotate-secret`

Rotates the signing secret key. The current active secret is moved to `previousSecret` (valid for a rolling grace window to allow consumers to transition signature validation scripts), and a new secure `currentSecret` is generated.

### Response (200 OK)
```json
{
  "secret": "whsec_live_new_rotated_secret_key_abc123"
}
```

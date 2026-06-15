# Events API

The Events API allows publisher systems to ingest new payloads to be processed and dispatched to customer webhook endpoints.

---

## 1. Publish (Ingest) an Event
`POST /api/v1/events`

Publishes a new event payload. The endpoint evaluates filters and dispatches the webhook asynchronously in the background.

### Request Body Parameters
* **`endpointId`** (String, Required): ID of the destination webhook endpoint.
* **`eventType`** (String, Required): Event type/name (e.g. `user.signup`).
* **`payload`** (Object, Required): JSON object containing the payload content.
* **`idempotencyKey`** (String, Optional): Unique string to prevent duplicate processing of the same request.

```json
{
  "endpointId": "whk_7JEQ-j2PDuAKGhzwEglhf",
  "eventType": "user.created",
  "payload": {
    "userId": "usr_x5vQ2",
    "name": "John Doe",
    "plan": "premium"
  }
}
```

### Response (201 Created)
```json
{
  "id": "evt_HiYupxMp1XusVuuikyHFX",
  "projectId": "proj_rcU2dyx7Fvjoarx9mCvyZ",
  "endpointId": "whk_7JEQ-j2PDuAKGhzwEglhf",
  "eventType": "user.created",
  "payload": "{\"userId\":\"usr_x5vQ2\",\"name\":\"John Doe\",\"plan\":\"premium\"}",
  "status": "pending",
  "retryCount": 0,
  "nextRetryAt": null,
  "lastAttemptAt": null,
  "idempotencyKey": null,
  "lastErrorHash": null,
  "poisoned": false,
  "createdAt": 1781441927374
}
```

---

## 2. List Event Logs
`GET /api/v1/events`

Returns a list of event logs. Supports pagination.

### Query Parameters
* **`page`** (Number, Optional, Default: `1`): Target page.
* **`limit`** (Number, Optional, Default: `20`): Page size limit.

### Response (200 OK)
```json
{
  "data": [
    {
      "id": "evt_HiYupxMp1XusVuuikyHFX",
      "endpointId": "whk_7JEQ-j2PDuAKGhzwEglhf",
      "eventType": "user.created",
      "payload": {
        "userId": "usr_x5vQ2",
        "name": "John Doe"
      },
      "status": "delivered",
      "createdAt": 1781441927374
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

## 3. Replay Individual Event
`POST /api/v1/events/:id/replay`

Forces an immediate redelivery attempt for a specific event ID.

### Response (200 OK)
```json
{
  "success": true
}
```

---

## 4. Replay Time Window
`POST /api/v1/events/replay-window`

Finds all events within a specific time window and schedules them for redelivery. Useful for correcting customer server crashes during a outage window.

### Request Body Parameters
* **`from`** (String/ISO Date, Required): Start date window.
* **`to`** (String/ISO Date, Required): End date window.

```json
{
  "from": "2026-06-15T10:00:00.000Z",
  "to": "2026-06-15T12:00:00.000Z"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "from": "2026-06-15T10:00:00.000Z",
  "to": "2026-06-15T12:00:00.000Z"
}
```

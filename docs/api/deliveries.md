# Deliveries API

A Delivery is an execution log recording the details of an individual HTTP request attempt made to a webhook receiver.

---

## 1. Get Event Delivery Timeline
`GET /api/v1/events/:id/timeline`

Retrieves all delivery attempts made for a specific event ID.

### Response (200 OK)
```json
[
  {
    "id": "del_7JEQ-j2PDuAKGhzwEglhf",
    "eventId": "evt_HiYupxMp1XusVuuikyHFX",
    "endpointId": "whk_7JEQ-j2PDuAKGhzwEglhf",
    "status": "success",
    "responseCode": 200,
    "responseBody": "{\"received\":true}",
    "latencyMs": 142,
    "createdAt": 1781441927516
  }
]
```

---

## 2. Search Operational Egress Logs
`GET /api/v1/deliveries/search`

Enables querying and searching of delivery histories using operational filter parameters.

### Query Parameters
* **`endpointId`** (String, Optional): Filter by specific webhook destination.
* **`status`** (String, Optional): Filter by status (`success` or `failed`).
* **`from`** (Number, Optional): Start epoch timestamp.
* **`to`** (Number, Optional): End epoch timestamp.

### Response (200 OK)
```json
[
  {
    "id": "del_7JEQ-j2PDuAKGhzwEglhf",
    "eventId": "evt_HiYupxMp1Xus",
    "status": "failed",
    "responseCode": 500,
    "responseBody": "Internal Server Error",
    "latencyMs": 80,
    "createdAt": 1781441927516
  }
]
```

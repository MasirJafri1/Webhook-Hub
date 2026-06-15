# Metrics & Analytics API

WebHook Hub aggregates operational data to compile performance dashboards.

---

## 1. Get Project Overview Metrics
`GET /api/v1/metrics`

Returns aggregated transactional metrics for the active project space over the past 30 days.

### Response (200 OK)
```json
{
  "totalEvents": 4212,
  "successfulDeliveries": 4180,
  "failedDeliveries": 32,
  "avgLatencyMs": 112,
  "consecutiveFailures": 0,
  "rateLimitLimit": 60,
  "usagePercent": 4.21
}
```

---

## 2. Get Endpoint Performance Metrics
`GET /api/v1/webhooks/:id/metrics`

Retrieves localized performance statistics for a specific webhook endpoint ID.

### Response (200 OK)
```json
{
  "total": 150,
  "success": 148,
  "failed": 2,
  "avgLatency": 98,
  "lastAttemptStatus": "success",
  "consecutiveFailures": 0
}
```

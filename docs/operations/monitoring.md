# Monitoring & Observability

WebHook Hub provides built-in tools for tracking the health, latency, and throughput of webhook pipelines, alongside a compliance-friendly audit log system.

---

## Webhook Metrics & Analytics

Observability is built directly into the database engine. Every delivery attempt creates a record in the `deliveries` table. Using this data, the platform calculates real-time metrics available in the developer dashboard.

### Key Metrics Available:
1. **Total Volume**: Total events published vs. successfully delivered over a given time window.
2. **Success Rate**: The percentage of deliveries resulting in a `2xx` response code.
3. **Response Status Distribution**: Breakdown of HTTP statuses (e.g., `200`, `201`, `400`, `404`, `500`, and `0` for network failures).
4. **Latency Statistics**: Average and p95 request latency in milliseconds (`latencyMs`).

### Metrics REST Endpoint
Fetch endpoint-specific performance telemetry via:

```http
GET /api/v1/webhooks/:endpoint_id/metrics
Authorization: Bearer <your_api_key>
```

**Response (200 OK)**:
```json
{
  "total": 1250,
  "success": 1245,
  "failures": 5,
  "successRate": 99.6,
  "avgLatencyMs": 84.5
}
```

---

## System Audit Logs

To track user administrative actions and system modifications, WebHook Hub records audit events in the `audit_logs` database table.

### Audit Log Schema:
* `id`: Unique audit record UUID.
* `project_id`: The project associated with the action.
* `action`: The code identifier of the event.
* `actor`: Who triggered the action.
  * If triggered via the dashboard, this stores the user's email (sent via `x-member-email` header).
  * If triggered via the API, this stores `api_key:<key_name>`.
  * If triggered by background cron runners, this stores `system`.
* `created_at`: Epoch timestamp.

### Supported Audit Events:

| Event Name | Trigger | Actor Type |
| :--- | :--- | :--- |
| `WEBHOOK_CREATED` | A new webhook endpoint is registered. | User / API Key |
| `WEBHOOK_DELETED` | A webhook endpoint is deleted (soft-deleted). | User / API Key |
| `SECRET_ROTATED` | Signing secret rotation is triggered. | User / API Key |
| `WEBHOOK_DISABLED` | Webhook exceeds 20 consecutive failures (Circuit Breaker). | System |
| `DATA_RETAINED` | Log retention cleaner job runs and deletes old entries. | System |

---

## Log Inspection & Error Hashing

For failed deliveries, WebHook Hub stores:
1. **Response Body Summary**: Truncated to fit within SQLite boundaries.
2. **Error Message**: The connection error or exception message (e.g., `TypeError: Failed to fetch`).
3. **Error Hashing**: The `last_error_hash` represents a SHA-256 fingerprint of the error. This hash is used by the retry engine to detect if the target server is stuck in a repeating error state (Poison Event detection).

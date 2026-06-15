# Replaying Failed Events

If a customer's destination server goes offline or has a bug, events will fail to deliver. This guide shows how to inspect and replay those events once the customer resolves their server issues.

---

## 1. Inspecting the Delivery Timeline
Before replaying, inspect the historical failure logs to verify the HTTP response code returned by the client:
1. Open the **Deliveries** or **Events** tab on your dashboard.
2. Select the failed event.
3. You will see a list of all delivery attempts. Click on an attempt to see the **exact Response Body** returned by the customer's server (e.g. `500 Internal Server Error` or `Timeout`).

---

## 2. Replaying a Single Event
You can trigger an immediate redelivery attempt for a specific event:
* **Via Dashboard**: Select the event and click the **Replay Event** button.
* **Via API**: Send an authorized POST request:
  ```bash
  curl -X POST https://your-api.workers.dev/api/v1/events/evt_eventIdHere/replay \
    -H "Authorization: Bearer whpk_live_your_key"
  ```
The system will immediately reset the event status to `"pending"`, reset its retry count, and trigger an egress post.

---

## 3. Bulk Replays via Time-Window
If a customer server was down for a specific period (e.g. during a 2-hour server outage), you can replay all events within that time window at once:
* **Via Dashboard**: Go to the **Events** page, click **Replay Window**, choose the start/end dates, and confirm.
* **Via API**: Post a date range object:
  ```bash
  curl -X POST https://your-api.workers.dev/api/v1/events/replay-window \
    -H "Authorization: Bearer whpk_live_your_key" \
    -H "Content-Type: application/json" \
    -d '{
      "from": "2026-06-15T12:00:00.000Z",
      "to": "2026-06-15T14:00:00.000Z"
    }'
  ```
The system will locate all events belonging to your project within that timeframe, reset their states to pending, and dispatch them to their respective webhooks.

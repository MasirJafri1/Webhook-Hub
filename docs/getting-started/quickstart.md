# Developer Quickstart Guide

This guide will walk you through launching a local instance of WebHook Hub, registering a webhook endpoint, ingesting an event, and verifying its delivery.

---

## Prerequisites
Ensure you have the following installed locally:
* **Node.js** v24+
* **Git**

---

## 1. Clone & Install
Clone the repository and install all dependencies:
```bash
git clone https://github.com/MasirJafri1/webhook-platform.git
cd webhook-platform
```

Install packages inside both workspaces:
```bash
# In apps/api-worker/
cd apps/api-worker
npm install

# In apps/dashboard/
cd ../dashboard
npm install
```

---

## 2. Initialize the Local SQLite Database
Run the local migrations using wrangler to build your SQLite tables in Miniflare's sandbox:
```bash
cd ../api-worker
npx wrangler d1 migrations apply webhook-platform-db --local
```

---

## 3. Launch Development Servers
Run the servers in two separate terminal tabs:

```bash
# Terminal 1: Backend API Worker
cd apps/api-worker
npx wrangler dev --port 8790

# Terminal 2: Frontend Dashboard (Vite)
cd apps/dashboard
npm run dev
```

---

## 4. Run the Dev Bootstrapper
1. Open the dashboard locally at **[http://localhost:5173](http://localhost:5173)**.
2. Click the **"Seed & Login as Admin"** button. This automatically:
   * Sets up `usr_seed_admin` in D1 (`admin@webhook.com` / `AdminSecurePassword123`).
   * Provisions a default Organization and Project.
   * Generates a primary publisher API Key.
   * Logs you in and routes you to the dashboard page!

---

## 5. Register Your First Webhook Endpoint
1. Go to the **Webhooks** page in the dashboard.
2. Click **Create Webhook**.
3. Fill in:
   * **Name**: `My Local Receiver`
   * **URL**: Use a mock endpoint from a service like [Webhook.site](https://webhook.site) or a local HTTP server.
4. Click **Save**. Copy the generated **Secret Key** (`whsec_...`) and the **Webhook ID** (`whk_...`).

---

## 6. Publish an Event
Use `curl` in your terminal to ingest a test event using the publisher API Key (`whpk_live_seed_dev_key_abc123`):

```bash
curl -X POST http://localhost:8790/api/v1/events \
  -H "Authorization: Bearer whpk_live_seed_dev_key_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": "YOUR_WEBHOOK_ID",
    "eventType": "user.created",
    "payload": {
      "id": "usr_99",
      "email": "quickstart@user.com",
      "name": "Quickstart User"
    }
  }'
```

---

## 7. Verify Delivery
1. The API will instantly return a `201 Created` status code containing the event metadata.
2. Check the **Deliveries** page in your dashboard or inspect your mock receiver URL. You will see the event delivered with standard `x-webhook-signature` headers validated and active!

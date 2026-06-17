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

## 4. Bootstrap the Local Super Admin
For security and flexibility, you must manually bootstrap your local Super Admin account.

You can configure credentials by defining `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file (or passing them as environment variables / command-line flags):

1. Generate your credentials using the admin script:
   ```bash
   cd apps/api-worker
   # Option A: Reads from .env file or environment variables:
   node scripts/create-admin.js

   # Option B: Pass credentials directly as arguments:
   node scripts/create-admin.js --email=admin@webhook.com --password=AdminSecurePassword123
   ```
2. The script will output a secure `npx wrangler d1 execute` query command. Copy and run that command in your terminal to seed the local SQLite database. Take note of the printed **API Key** (e.g. `whpk_live_...`).
3. Open the dashboard locally at **[http://localhost:5173](http://localhost:5173)** and log in using the email and password you configured.

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
Use `curl` in your terminal to ingest a test event using the publisher API Key printed in step 4:

```bash
curl -X POST http://localhost:8790/api/v1/events \
  -H "Authorization: Bearer YOUR_GENERATED_API_KEY" \
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

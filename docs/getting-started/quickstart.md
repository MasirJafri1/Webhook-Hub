# Developer Quickstart Guide

This guide will walk you through launching a local instance of WebHook Hub, signing in via Google OAuth, registering a webhook endpoint, ingesting an event, and verifying its delivery.

---

## Prerequisites
Ensure you have the following installed locally:
* **Node.js** v18+
* **Git**
* **Wrangler CLI** (`npm install -g wrangler`)

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

## 4. Sign In with Google OAuth

WebHook Hub uses **passwordless Google OAuth** exclusively. No email/password setup required.

```mermaid
flowchart LR
    A["Open Dashboard<br/>localhost:5173"] --> B["Click 'Sign in with Google'"]
    B --> C["Select Google Account"]
    C --> D["Auto-Provisioned Workspace"]
    D --> E["🎉 Ready to Use"]
```

1. Open the dashboard at **[http://localhost:5173](http://localhost:5173)**.
2. Click **"Sign in with Google"** on the login page.
3. Select your Google account and authorize.
4. On first sign-in, the platform automatically creates:
   - A default **Organization** (named after your email)
   - A default **Project**
   - A default **API Key** (`whpk_live_...`)
5. You're now logged in and can access the full dashboard.

> **Note**: To promote a user to Super Admin, update the `role` field in the `users` table directly via `wrangler d1 execute`.

---

## 5. Get Your API Key

1. Navigate to the **Settings** page in the dashboard.
2. Your auto-generated API Key will be displayed. You can also **rotate** or **create new keys** from this page.
3. Copy the API Key (e.g. `whpk_live_...`) — you'll need it to publish events.

---

## 6. Register Your First Webhook Endpoint
1. Go to the **Webhooks** page in the dashboard.
2. Click **Create Webhook**.
3. Fill in:
   * **Name**: `My Local Receiver`
   * **URL**: Use a mock endpoint from a service like [Webhook.site](https://webhook.site) or a local HTTP server.
4. Click **Save**. Copy the generated **Secret Key** (`whsec_...`) and the **Webhook ID** (`whk_...`).

---

## 7. Publish an Event
Use `curl` in your terminal to ingest a test event using the publisher API Key:

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

## 8. Verify Delivery
1. The API will instantly return a `201 Created` status code containing the event metadata.
2. Check the **Deliveries** page in your dashboard or inspect your mock receiver URL. You will see the event delivered with standard `x-webhook-signature` headers validated and active!

---

## What's Next?

* [Create Your First Webhook](../guides/create-first-webhook.md) — Detailed walkthrough
* [Secret Rotation Guide](../guides/secret-rotation.md) — Zero-downtime secret rotations
* [Filtering & Transformations](../guides/filtering-and-transformations.md) — Event filtering and payload transforms
* [Deployment Manual](./deployment.md) — Deploy to Cloudflare production

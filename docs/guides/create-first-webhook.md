# Creating Your First Webhook

This step-by-step guide will show you how to register a webhook endpoint in WebHook Hub and test it using a local listener.

---

## 1. Setup a Mock Webhook Listener
Before registering, you need a URL to receive the webhooks.
* **Option A**: Go to [Webhook.site](https://webhook.site) and copy your unique **Webhook.site URL**.
* **Option B**: Spin up a quick local Node.js server:
  ```javascript
  import http from 'node:http';
  http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      console.log('Received Headers:', req.headers);
      console.log('Received Body:', body);
      res.writeHead(200);
      res.end('OK');
    });
  }).listen(9000, () => console.log('Listening on port 9000'));
  ```

---

## 2. Register the Webhook via Dashboard
1. Log into your dashboard (e.g. **[https://webhook-platform.pages.dev](https://webhook-platform.pages.dev)**).
2. Go to **Webhooks** ➡️ **Create Webhook**.
3. Fill in:
   - **Name**: `Primary Test Hook`
   - **URL**: Paste your mock URL (e.g., `https://webhook.site/your-id` or `http://localhost:9000/webhook`).
4. Click **Create**.
5. Copy the generated **Secret Key** (`whsec_live_...`). This secret is required to verify the webhook signatures on your server.

---

## 3. Dispatch a Test Event
Using your publisher API key (`whpk_live_...`), send a POST request to your API worker to trigger an event:

```bash
curl -X POST https://your-api-worker.workers.dev/api/v1/events \
  -H "Authorization: Bearer whpk_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": "YOUR_WEBHOOK_ID",
    "eventType": "payment.succeeded",
    "payload": {
      "amount": 2999,
      "currency": "usd",
      "customer": "cus_982b13"
    }
  }'
```

---

## 4. Observe the Result
* The API will instantly return `201 Created` with status `"pending"`.
* In the background, WebHook Hub will sign the JSON payload and post it to your listener.
* Check your listener logs or Webhook.site dashboard to verify the payload and the cryptographic `x-webhook-signature` headers were delivered.

# Production Cloud Deployment Guide

This guide details deploying WebHook Hub into a live Cloudflare production environment using Wrangler CLI or GitHub Actions.

---

## 1. Cloudflare Account Requirements
Before launching, make sure you have:
* A Cloudflare account.
* A registered domain zone mapped to your Cloudflare account (if you intend to use custom domains for webhooks or dashboard).

---

## 2. Deploying via GitHub Actions (CI/CD)
The project comes pre-configured with a Git-triggered automated deployment pipeline inside `.github/workflows/deploy.yml`.

### Configuring GitHub Secrets
Add the following secrets under **Your Repo Settings ➡️ Secrets and variables ➡️ Actions**:
* `CLOUDFLARE_API_TOKEN`: Your Cloudflare API Token with Workers, KV, D1, and Pages Edit permissions.
* `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.
* `PRODUCTION_API_URL`: The deployed Worker API URL (e.g. `https://webhook-platform-api.<subdomain>.workers.dev/api/v1`).
* `CLOUDFLARE_PAGES_PROJECT_NAME`: The name of the project in Cloudflare Pages for your dashboard.

Pushing changes to `main` branch will automatically trigger a clean build, compile, and deploy the entire stack to Cloudflare.

---

## 3. Manual CLI Deployment
If you prefer to deploy directly from your local terminal:

### A. Apply D1 Migrations
Apply your SQL migration configurations to your remote database on Cloudflare D1:
```bash
cd apps/api-worker
npx wrangler d1 migrations apply webhook-platform-db --remote
```

### B. Inject Production Runtime Secrets
Run these commands to bind secure parameters to the worker edge:
```bash
# Set environment to production (disables local test utilities)
npx wrangler secret put ENVIRONMENT
# Value: production

# Add secure JWT token signing key
npx wrangler secret put JWT_SECRET
# Value: <generate secure random base64 string>
```

### C. Seed Production Super Admin (Secure Bootstrapping)
For security, WebHook Hub does not accept plaintext admin passwords in environment variables. You must generate the hashed credentials using the bootstrap script and insert them directly into your remote database:

> [!NOTE]
> The admin bootstrapping script `create-admin.js` is committed to version control and reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env` file (or system environment variables) to keep your credentials secure.

1. Generate your admin password hash and database seeding command:
   ```bash
   # Option A: Reads from .env file or environment variables:
   node scripts/create-admin.js --remote

   # Option B: Pass credentials directly as arguments:
   node scripts/create-admin.js --email=admin@yourdomain.com --password=YourSecurePassword123 --remote
   ```
2. The script will output a secure `wrangler d1 execute` query command. Copy and run that command in your terminal to bootstrap the Super Admin user, organization, default project, member, and default API keys.

---

### D. Deploy Worker
Run the deployment command:
```bash
npx wrangler deploy
```

### D. Deploy Vite Dashboard to Pages
Build the production build and upload it to Cloudflare Pages:
```bash
cd ../dashboard
# Create .env.production containing VITE_API_URL pointing to the worker URL
echo "VITE_API_URL=https://webhook-platform-api.YOUR-SUBDOMAIN.workers.dev/api/v1" > .env.production
npm run build
npx wrangler pages deploy dist --project-name=YOUR-PAGES-PROJECT-NAME
```

---

## 4. Custom Domains (Recommended)
By default, your worker will be deployed to `<project>.<subdomain>.workers.dev`. For production usage, it is recommended to map your API to a custom subdomain (e.g., `api.webhookhub.com`).
1. Go to your **Cloudflare Dashboard** ➡️ **Workers & Pages** ➡️ Select `webhook-platform-api`.
2. Go to **Settings** ➡️ **Triggers** ➡️ **Custom Domains**.
3. Click **Add Custom Domain** and enter your desired subdomain (e.g. `api.webhookhub.com`). Cloudflare will automatically provision the SSL certificates and configure DNS routing.

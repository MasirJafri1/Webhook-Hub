# Disaster Recovery & Backups

Because WebHook Hub is built entirely on top of Cloudflare's serverless infrastructure, high availability and geographic redundancy are handled natively by Cloudflare. However, operational failures, database corruption, or security breaches require a documented Disaster Recovery (DR) plan.

---

## High Availability & Geographic Failover

WebHook Hub operates in a serverless configuration:
* **Cloudflare Workers**: Execution runs globally on Cloudflare's edge network in over 300 cities. If an edge location experiences a network outage, traffic is automatically rerouted to the nearest active edge node.
* **Cloudflare KV**: Storage is replicated globally. While writes propagate asynchronously, reads are cached edge-local for sub-millisecond lookups.
* **Cloudflare D1**: The primary SQLite-based relational database runs active replication. It provides high-performance reads with write serialization handled under the hood.

---

## Database Backups (Cloudflare D1)

WebHook Hub relies on the relational data stored in D1. If data is corrupted due to user error or application bugs, it can be restored from backups.

### 1. Automated Backups
Cloudflare D1 automatically creates scheduled snapshots:
* **Hourly Backups**: Retained for the past 24 hours.
* **Daily Backups**: Retained for the past 7 days.

### 2. Manual Backup Creation
Before performing database migrations or major schema updates, manually trigger a database snapshot using Wrangler:

```bash
# Execute local CLI backup command
npx wrangler d1 backup create webhook-platform-db
```

### 3. Restoring from a Backup
To restore a production database to a previous backup snapshot:
1. List all available backups to identify the target `backup-id`:
   ```bash
   npx wrangler d1 backup list webhook-platform-db
   ```
2. Restore the database using the specific backup identifier:
   ```bash
   npx wrangler d1 backup restore webhook-platform-db <backup-id>
   ```
   *WARNING: Restoring a backup will overwrite the current database state. Any events or deliveries recorded after the snapshot timestamp will be lost.*

---

## Disaster Recovery Runbook: Critical Scenarios

### Scenario A: Compromised Database Credentials or JWT Secret
If the `JWT_SECRET` or Cloudflare credentials are leaked:
1. Immediately rotate the Cloudflare API tokens.
2. Update the Worker environment secrets:
   ```bash
   npx wrangler secret put JWT_SECRET
   ```
3. Re-deploy the Worker API. This will invalidate all active user JWT sessions immediately, forcing users to log in again.

### Scenario B: Accidental Data Deletion (E.g., Dropped Table)
If a table is dropped or D1 data is deleted:
1. Pause outbound event dispatching by disabling the cron trigger in wrangler (or comment out cron tasks in `wrangler.jsonc` and deploy).
2. Restore the database from the last automated hourly snapshot using `npx wrangler d1 backup restore`.
3. Re-enable the cron trigger and redeploy.
4. Notify clients to re-publish events that occurred during the restoration gap window using their inbound idempotency keys.

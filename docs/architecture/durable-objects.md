# Concurrency & Distributed Lock Architecture

In serverless architectures, hundreds of edge workers can execute code concurrently across different global data centers. When building an event delivery engine, this concurrency presents a challenge: **how to prevent multiple worker instances from fetching and delivering the same webhook event concurrently.**

This document details why WebHook Hub does not use Cloudflare Durable Objects for distributed locking, and instead uses **SQLite Atomic Updates** in Cloudflare D1.

---

## Why Durable Objects Were Omitted

Cloudflare Durable Objects (DO) provide coordinate state and execution guarantees at a single global point. While they make excellent distributed locks, they introduce trade-offs for a lightweight, cost-effective platform:

1. **Financial Cost**: Durable Objects require a paid Cloudflare Workers subscription, which violates the goal of running WebHook Hub entirely on the Cloudflare Free Tier.
2. **Complexity**: Configuring bindings, managing DO lifecycles, and handling routing protocols adds significant maintenance overhead.
3. **Latency**: Directing all locks to a single coordinates-bound DO location adds network latency for workers executing in remote regions.

---

## The Solution: SQLite Atomic Updates (D1 Lock)

Instead of in-memory distributed locks, WebHook Hub leverages **single-threaded SQLite mutation queues** in Cloudflare D1. 

### Core Premise:
All write operations to a Cloudflare D1 database are routed through a primary coordinator that executes SQL statements sequentially and atomically. We use this atomic write guarantee to implement a lock by updating the status of an event at the database layer.

### The Locking Query:
When a background job retrieves a pending event, it attempts to acquire a lock by executing this query:

```typescript
async acquireLock(id: string) {
  const result = await this.db
    .update(events)
    .set({ status: "processing" })
    .where(
      and(
        eq(events.id, id),
        or(eq(events.status, "pending"), eq(events.status, "retrying"))
      )
    );
    
  // Check if any rows were actually updated
  const changes = result.meta?.changes ?? result.changes ?? 0;
  return changes > 0;
}
```

### Execution Flow:
1. **Worker A** and **Worker B** simultaneously retrieve Event `evt_990` (which is currently in the `pending` state).
2. Both attempt to execute the `acquireLock` update query.
3. Because D1 processes queries sequentially, **Worker A's** update is processed first:
   * The status is updated from `pending` to `processing`.
   * The number of changes returned is `1`.
   * **Worker A** receives `true` and proceeds to deliver the event.
4. **Worker B's** update is processed second:
   * The query looks for `events.id = 'evt_990'` AND `status` in `['pending', 'retrying']`.
   * Because the status is now `processing`, the query matches 0 rows.
   * The number of changes returned is `0`.
   * **Worker B** receives `false`, logs `Event evt_990 already locked. Skipping.`, and terminates execution for this event.

This approach guarantees that even with highly concurrent edge execution, each event is delivered exactly once per scheduled attempt.

---

## Comparative Analysis: SQLite Lock vs. Durable Objects

| Attribute | SQLite Atomic Lock (WebHook Hub) | Durable Objects Lock |
| :--- | :--- | :--- |
| **Pricing Tier** | Free Tier Compatible | Paid Subscription Required |
| **Additional Infrastructure** | None (Uses existing D1 Database) | Requires DO class definitions & bindings |
| **Atomicity Broker** | SQLite master coordinator queue | In-memory JavaScript class coordination |
| **Network Hop** | 1 database request | 1 coordinator routing hop + 1 database request |
| **Maintenance Cost** | Low | Medium (Handling storage migrations, class bindings) |
| **Scale Limits** | Capped by D1 write throughput | Distributed across unique DO instances |

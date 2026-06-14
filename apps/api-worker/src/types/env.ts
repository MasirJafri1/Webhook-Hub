export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  EVENT_LOCK: DurableObjectNamespace;
}

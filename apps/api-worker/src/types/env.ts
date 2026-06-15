export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT?: string;
  JWT_SECRET?: string;
  SUPER_ADMIN_EMAIL?: string;
  SUPER_ADMIN_PASSWORD?: string;
}

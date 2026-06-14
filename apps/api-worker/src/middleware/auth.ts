import { getDb } from "../db/client";
import { apiKeys } from "../db/schema";
import { eq } from "drizzle-orm";
import { sha256 } from "../utils/hash";
import { json } from "../utils/response";
import type { Env } from "../types/env";

export async function authenticate(request: any, env: Env) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401);
  }

  const key = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!key) {
    return json({ error: "Unauthorized" }, 401);
  }

  const hash = await sha256(key);
  const db = getDb(env);
  const rows = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, hash));

  const apiKey = rows[0];
  if (!apiKey || !apiKey.active) {
    return json({ error: "Unauthorized" }, 401);
  }

  request.projectId = apiKey.projectId;
  request.apiKeyName = apiKey.name;
}

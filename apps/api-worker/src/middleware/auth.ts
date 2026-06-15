import { getDb } from "../db/client";
import { apiKeys, members, projects } from "../db/schema";
import { eq } from "drizzle-orm";
import { sha256 } from "../utils/hash";
import { json } from "../utils/response";
import type { Env } from "../types/env";
import { verifyJwt } from "../utils/crypto";

export async function authenticate(request: any, env: Env) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401);
  }

  const key = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!key) {
    return json({ error: "Unauthorized" }, 401);
  }

  const db = getDb(env);

  if (key.startsWith("whpk_")) {
    const hash = await sha256(key);
    const rows = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, hash));

    const apiKey = rows[0];
    if (!apiKey || !apiKey.active) {
      return json({ error: "Unauthorized" }, 401);
    }

    request.projectId = apiKey.projectId;
    request.apiKeyName = apiKey.name;
  } else {
    // JWT Token auth
    const jwtSecret = env.JWT_SECRET || "JWT_SECRET_DEV_KEY_abc123";
    const decoded = await verifyJwt(key, jwtSecret);
    if (!decoded) {
      return json({ error: "Unauthorized" }, 401);
    }

    request.user = decoded; // Attach payload (userId, email, role)

    // Lookup user's project
    const memberRows = await db
      .select()
      .from(members)
      .where(eq(members.email, decoded.email));

    if (memberRows.length > 0) {
      const orgId = memberRows[0].organizationId;
      if (orgId) {
        const projectRows = await db
          .select()
          .from(projects)
          .where(eq(projects.organizationId, orgId));

        if (projectRows.length > 0) {
          request.projectId = projectRows[0].id;
        }
      }
    }
  }
}


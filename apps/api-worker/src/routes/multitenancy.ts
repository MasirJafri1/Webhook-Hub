import { Router } from "itty-router";
import { getDb } from "../db/client";
import {
  organizations,
  projects,
  apiKeys,
  members,
  auditLogs,
} from "../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateApiKey } from "../utils/api-key";
import { sha256 } from "../utils/hash";
import { json } from "../utils/response";
import { authenticate } from "../middleware/auth";
import { AuditService } from "../services/audit.service";
import type { Env } from "../types/env";

export const registerMultitenancyRoutes = (router: any) => {
  // Organizations
  router.post("/api/v1/orgs", async (request: Request, env: Env) => {
    const body: any = await request.json();
    if (!body.name) {
      return json({ error: "Name is required" }, 400);
    }
    const db = getDb(env);
    const id = "org_" + nanoid();
    const org = {
      id,
      name: body.name,
      createdAt: Date.now(),
    };
    await db.insert(organizations).values(org);
    return json(org, 201);
  });

  router.get("/api/v1/orgs", async (_request: any, env: Env) => {
    const db = getDb(env);
    const rows = await db.select().from(organizations);
    return json(rows);
  });

  // Projects
  router.post("/api/v1/projects", async (request: Request, env: Env) => {
    const body: any = await request.json();
    if (!body.name || !body.organizationId) {
      return json({ error: "Name and organizationId are required" }, 400);
    }
    const db = getDb(env);
    const id = "proj_" + nanoid();
    const project = {
      id,
      organizationId: body.organizationId,
      name: body.name,
      monthlyEventLimit:
        body.monthlyEventLimit !== undefined
          ? Number(body.monthlyEventLimit)
          : null,
      createdAt: Date.now(),
    };
    await db.insert(projects).values(project);
    return json(project, 201);
  });

  router.get("/api/v1/projects", async (_request: any, env: Env) => {
    const db = getDb(env);
    const rows = await db.select().from(projects);
    return json(rows);
  });

  // Members
  router.post("/api/v1/members", async (request: Request, env: Env) => {
    const body: any = await request.json();
    if (!body.organizationId || !body.email || !body.role) {
      return json(
        { error: "organizationId, email, and role are required" },
        400,
      );
    }
    const db = getDb(env);
    const id = "mem_" + nanoid();
    const member = {
      id,
      organizationId: body.organizationId,
      email: body.email,
      role: body.role,
    };
    await db.insert(members).values(member);
    return json(member, 201);
  });

  // API Keys
  router.post("/api/v1/api-keys", async (request: Request, env: Env) => {
    const body: any = await request.json();
    if (!body.name || !body.projectId) {
      return json({ error: "Name and projectId are required" }, 400);
    }
    const db = getDb(env);
    const id = "key_" + nanoid();
    const rawKey = generateApiKey();
    const keyHash = await sha256(rawKey);

    const apiKeyData = {
      id,
      projectId: body.projectId,
      keyHash,
      name: body.name,
      active: true,
      createdAt: Date.now(),
    };
    await db.insert(apiKeys).values(apiKeyData);

    // Write audit log
    const auditService = new AuditService(db);
    const actor = request.headers.get("x-member-email") || "system";
    await auditService.log("API_KEY_CREATED", actor, body.projectId);

    return json(
      {
        id,
        name: body.name,
        key: rawKey,
      },
      201,
    );
  });

  router.get("/api/v1/api-keys", async (request: any, env: Env) => {
    const db = getDb(env);

    // Attempt authentication middleware or check query param
    await authenticate(request, env).catch(() => {});
    const projectId =
      request.projectId || new URL(request.url).searchParams.get("projectId");

    if (!projectId) {
      return json({ error: "Unauthorized" }, 401);
    }

    const rows = await db
      .select({ id: apiKeys.id, name: apiKeys.name })
      .from(apiKeys)
      .where(eq(apiKeys.projectId, projectId));

    return json(rows);
  });

  router.delete("/api/v1/api-keys/:id", async (request: any, env: Env) => {
    const db = getDb(env);
    const id = request.params.id;

    // Get key before deleting for audit log
    const rows = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    const apiKey = rows[0];
    if (!apiKey) {
      return json({ error: "API Key not found" }, 404);
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, id));

    const auditService = new AuditService(db);
    const actor = request.headers.get("x-member-email") || "system";
    await auditService.log("API_KEY_REVOKED", actor, apiKey.projectId);

    return json({ success: true });
  });

  // Query Audit Logs
  router.get("/api/v1/audit-logs", async (request: any, env: Env) => {
    const db = getDb(env);
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    const rows = projectId
      ? await db
          .select()
          .from(auditLogs)
          .where(eq(auditLogs.projectId, projectId))
      : await db.select().from(auditLogs);
    return json(rows);
  });
};

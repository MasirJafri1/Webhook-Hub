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
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");
      return json({ error: "Internal server error" }, 500);
    }
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
      const targetProjId = request.headers.get("x-project-id");
      let selectedOrgId = memberRows[0].organizationId;
      let selectedProjId: string | null = null;

      if (targetProjId) {
        // Verify the user has access to this project
        const projectRows = await db
          .select()
          .from(projects)
          .where(eq(projects.id, targetProjId));
        if (projectRows.length > 0) {
          const projectOrgId = projectRows[0].organizationId;
          const isMember = memberRows.some((m) => m.organizationId === projectOrgId);
          if (isMember) {
            selectedOrgId = projectOrgId;
            selectedProjId = projectRows[0].id;
          }
        }
      }

      if (!selectedProjId && selectedOrgId) {
        const projectRows = await db
          .select()
          .from(projects)
          .where(eq(projects.organizationId, selectedOrgId));
        if (projectRows.length > 0) {
          selectedProjId = projectRows[0].id;
        }
      }

      if (selectedProjId) {
        request.projectId = selectedProjId;
      }
    }
  }

  // Ensure request.projectId is present for non-admin routes
  const url = new URL(request.url);
  const isAdminRoute = url.pathname.startsWith("/api/v1/admin");
  if (!request.projectId && !isAdminRoute) {
    return json({ 
      error: "No active project found for this user account. Please contact an administrator to associate your account with an organization and project." 
    }, 403);
  }
}

export function getActor(request: any): string {
  if (request.user?.email) {
    return request.user.email;
  }
  if (request.apiKeyName) {
    return `api_key:${request.apiKeyName}`;
  }
  return request.headers.get("x-member-email") || "system";
}


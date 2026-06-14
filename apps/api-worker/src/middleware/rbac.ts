import { getDb } from "../db/client";
import { members, projects } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { json } from "../utils/response";
import type { Env } from "../types/env";

const ROLE_LEVELS: Record<string, number> = {
  viewer: 1,
  developer: 2,
  admin: 3,
  owner: 4,
};

export function requireRole(requiredRole: string) {
  return async (request: any, env: Env) => {
    if (!request.projectId) {
      return json({ error: "Unauthorized" }, 401);
    }

    const email = request.headers.get("x-member-email");
    if (!email) {
      return json({ error: "Forbidden: Member context required" }, 403);
    }

    const db = getDb(env);

    // Get organizationId for the project
    const projectRows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, request.projectId));

    const project = projectRows[0];
    if (!project) {
      return json({ error: "Forbidden: Project not found" }, 403);
    }

    // Get member details
    const memberRows = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.organizationId, project.organizationId),
          eq(members.email, email),
        ),
      );

    const member = memberRows[0];
    if (!member || !member.role) {
      return json(
        { error: "Forbidden: Member not found in organization" },
        403,
      );
    }

    const currentLevel = ROLE_LEVELS[member.role] || 0;
    const requiredLevel = ROLE_LEVELS[requiredRole] || 0;

    if (currentLevel < requiredLevel) {
      return json({ error: "Forbidden: Insufficient permissions" }, 403);
    }
  };
}

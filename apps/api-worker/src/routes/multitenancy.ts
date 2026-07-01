import { Router } from "itty-router";
import { getDb } from "../db/client";
import {
  organizations,
  projects,
  apiKeys,
  members,
  auditLogs,
  users,
  webhookEndpoints,
  events,
  deliveries,
} from "../db/schema";
import { and, eq, ne, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateApiKey } from "../utils/api-key";
import { sha256 } from "../utils/hash";
import { json } from "../utils/response";
import { authenticate, getActor } from "../middleware/auth";
import { AuditService } from "../services/audit.service";
import type { Env } from "../types/env";

export const registerMultitenancyRoutes = (router: any) => {
  // Organizations
  router.post("/api/v1/orgs", authenticate, async (request: any, env: Env) => {
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

    // Automatically add creator to organization members as admin (accepted status)
    await db.insert(members).values({
      id: "mem_" + nanoid(),
      organizationId: id,
      email: request.user.email,
      role: "admin",
      status: "accepted",
    });

    return json(org, 201);
  });

  router.get("/api/v1/orgs", authenticate, async (request: any, env: Env) => {
    const db = getDb(env);
    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        createdAt: organizations.createdAt,
      })
      .from(members)
      .innerJoin(organizations, eq(members.organizationId, organizations.id))
      .where(
        and(
          eq(members.email, request.user.email),
          eq(members.status, "accepted")
        )
      );
    return json(rows);
  });

  // Projects
  router.post("/api/v1/projects", authenticate, async (request: any, env: Env) => {
    const body: any = await request.json();
    if (!body.name || !body.organizationId) {
      return json({ error: "Name and organizationId are required" }, 400);
    }
    const db = getDb(env);

    // Verify creator is member of the organization
    const membership = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.organizationId, body.organizationId),
          eq(members.email, request.user.email)
        )
      );
    if (membership.length === 0) {
      return json({ error: "Forbidden: You are not a member of this organization" }, 403);
    }

    const id = "proj_" + nanoid();
    const project = {
      id,
      organizationId: body.organizationId,
      name: body.name,
      monthlyEventLimit:
        body.monthlyEventLimit !== undefined
          ? Number(body.monthlyEventLimit)
          : null,
      retentionDays:
        body.retentionDays !== undefined
          ? Number(body.retentionDays)
          : 30,
      createdAt: Date.now(),
    };
    await db.insert(projects).values(project);
    return json(project, 201);
  });

  router.get("/api/v1/projects", authenticate, async (request: any, env: Env) => {
    const db = getDb(env);
    const rows = await db
      .select({
        id: projects.id,
        organizationId: projects.organizationId,
        name: projects.name,
        monthlyEventLimit: projects.monthlyEventLimit,
        retentionDays: projects.retentionDays,
        createdAt: projects.createdAt,
      })
      .from(members)
      .innerJoin(projects, eq(members.organizationId, projects.organizationId))
      .where(
        and(
          eq(members.email, request.user.email),
          eq(members.status, "accepted")
        )
      );
    return json(rows);
  });

  router.get("/api/v1/members", authenticate, async (request: any, env: Env) => {
    try {
      const db = getDb(env);
      const url = new URL(request.url);
      const orgId = url.searchParams.get("organizationId");
      if (!orgId) {
        return json({ error: "organizationId is required" }, 400);
      }

      // Verify requester has access to organization
      const membership = await db
        .select()
        .from(members)
        .where(
          and(
            eq(members.organizationId, orgId),
            eq(members.email, request.user.email)
          )
        );
      if (membership.length === 0) {
        return json({ error: "Forbidden: You are not a member of this organization" }, 403);
      }

      const rows = await db
        .select()
        .from(members)
        .where(eq(members.organizationId, orgId));

      return json(rows);
    } catch (err: any) {
      console.error("Error fetching members:", err);
      return json({ error: "Internal server error" }, 500);
    }
  });

  // Members
  router.post("/api/v1/members", authenticate, async (request: any, env: Env) => {
    const body: any = await request.json();
    if (!body.organizationId || !body.email || !body.role) {
      return json(
        { error: "organizationId, email, and role are required" },
        400,
      );
    }
    const db = getDb(env);

    // Verify creator is member of the organization
    const membership = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.organizationId, body.organizationId),
          eq(members.email, request.user.email)
        )
      );
    if (membership.length === 0) {
      return json({ error: "Forbidden: You are not a member of this organization" }, 403);
    }

    const targetUserEmail = body.email.toLowerCase().trim();

    // Verify target user exists on the platform
    const targetUserRows = await db
      .select()
      .from(users)
      .where(eq(users.email, targetUserEmail));

    if (targetUserRows.length === 0) {
      return json({ error: "User with this email does not exist on the platform." }, 400);
    }

    // Check if user is already a member of this organization
    const existingMembership = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.organizationId, body.organizationId),
          eq(members.email, targetUserEmail)
        )
      );

    if (existingMembership.length > 0) {
      return json({ error: "User is already a member of this organization." }, 400);
    }

    const id = "mem_" + nanoid();
    const member = {
      id,
      organizationId: body.organizationId,
      email: targetUserEmail,
      role: body.role,
      status: "pending",
    };
    await db.insert(members).values(member);
    return json(member, 201);
  });

  // API Keys
  router.post("/api/v1/api-keys", authenticate, async (request: any, env: Env) => {
    const body: any = await request.json();
    if (!body.name) {
      return json({ error: "Name is required" }, 400);
    }
    const projectId = request.projectId || body.projectId;
    if (!projectId || projectId === "__auto__") {
      return json({ error: "projectId is required" }, 400);
    }
    const db = getDb(env);
    const id = "key_" + nanoid();
    const rawKey = generateApiKey();
    const keyHash = await sha256(rawKey);

    const apiKeyData = {
      id,
      projectId,
      keyHash,
      name: body.name,
      active: true,
      createdAt: Date.now(),
    };
    await db.insert(apiKeys).values(apiKeyData);

    // Write audit log
    const auditService = new AuditService(db);
    const actor = getActor(request);
    await auditService.log("API_KEY_CREATED", actor, projectId);

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
      .select({ id: apiKeys.id, name: apiKeys.name, active: apiKeys.active })
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
    const actor = getActor(request);
    await auditService.log("API_KEY_REVOKED", actor, apiKey.projectId);

    return json({ success: true });
  });

  // Query Audit Logs
  router.get("/api/v1/audit-logs", authenticate, async (request: any, env: Env) => {
    const db = getDb(env);
    const projectId = request.projectId;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.projectId, projectId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.all(
      sql`SELECT COUNT(*) as count FROM audit_logs WHERE project_id = ${projectId}`,
    );
    const total = Number((countResult[0] as any)?.count || 0);

    return json({
      data: rows,
      total,
      page,
      limit,
    });
  });

  // Invitations management
  router.get("/api/v1/invitations", authenticate, async (request: any, env: Env) => {
    try {
      const db = getDb(env);
      const rows = await db
        .select({
          id: members.id,
          organizationId: members.organizationId,
          role: members.role,
          status: members.status,
          orgName: organizations.name,
        })
        .from(members)
        .innerJoin(organizations, eq(members.organizationId, organizations.id))
        .where(
          and(
            eq(members.email, request.user.email),
            eq(members.status, "pending")
          )
        );
      return json(rows);
    } catch (err: any) {
      console.error("Error fetching invitations:", err);
      return json({ error: "Internal server error" }, 500);
    }
  });

  router.post("/api/v1/invitations/:id/accept", authenticate, async (request: any, env: Env) => {
    try {
      const db = getDb(env);
      const id = request.params.id;

      // Verify the invitation exists for this user
      const rows = await db
        .select()
        .from(members)
        .where(
          and(
            eq(members.id, id),
            eq(members.email, request.user.email),
            eq(members.status, "pending")
          )
        );
      if (rows.length === 0) {
        return json({ error: "Invitation not found or unauthorized." }, 404);
      }

      await db
        .update(members)
        .set({ status: "accepted" })
        .where(eq(members.id, id));

      return json({ success: true });
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      return json({ error: "Internal server error" }, 500);
    }
  });

  router.post("/api/v1/invitations/:id/decline", authenticate, async (request: any, env: Env) => {
    try {
      const db = getDb(env);
      const id = request.params.id;

      // Verify the invitation exists for this user
      const rows = await db
        .select()
        .from(members)
        .where(
          and(
            eq(members.id, id),
            eq(members.email, request.user.email),
            eq(members.status, "pending")
          )
        );
      if (rows.length === 0) {
        return json({ error: "Invitation not found or unauthorized." }, 404);
      }

      await db.delete(members).where(eq(members.id, id));

      return json({ success: true });
    } catch (err: any) {
      console.error("Error declining invitation:", err);
      return json({ error: "Internal server error" }, 500);
    }
  });

  router.delete("/api/v1/orgs/:id", authenticate, async (request: any, env: Env) => {
    try {
      const db = getDb(env);
      const id = request.params.id;

      // Verify the requester is an admin in this organization
      const requesterMembership = await db
        .select()
        .from(members)
        .where(
          and(
            eq(members.organizationId, id),
            eq(members.email, request.user.email),
            eq(members.role, "admin")
          )
        );
      if (requesterMembership.length === 0) {
        return json({ error: "Forbidden: Only organization admins can delete the organization" }, 403);
      }

      // Fetch projects
      const orgProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.organizationId, id));
      const projectIds = orgProjects.map((p) => p.id);

      if (projectIds.length > 0) {
        for (const projId of projectIds) {
          // Delete related records
          await db.delete(apiKeys).where(eq(apiKeys.projectId, projId));
          
          // Delete deliveries related to events under this project
          const projectEvents = await db
            .select()
            .from(events)
            .where(eq(events.projectId, projId));
          const eventIds = projectEvents.map((e) => e.id);
          
          if (eventIds.length > 0) {
            for (const evId of eventIds) {
              await db.delete(deliveries).where(eq(deliveries.eventId, evId));
            }
            await db.delete(events).where(eq(events.projectId, projId));
          }

          await db.delete(webhookEndpoints).where(eq(webhookEndpoints.projectId, projId));
          await db.delete(auditLogs).where(eq(auditLogs.projectId, projId));
        }
        await db.delete(projects).where(eq(projects.organizationId, id));
      }

      // Delete all member relations
      await db.delete(members).where(eq(members.organizationId, id));

      // Delete the organization
      await db.delete(organizations).where(eq(organizations.id, id));

      return json({ success: true });
    } catch (err: any) {
      console.error("Error deleting organization:", err);
      return json({ error: "Internal server error" }, 500);
    }
  });

  router.delete("/api/v1/members/:id", authenticate, async (request: any, env: Env) => {
    try {
      const db = getDb(env);
      const id = request.params.id;

      // Find target member
      const targetMemberRows = await db
        .select()
        .from(members)
        .where(eq(members.id, id));
      const targetMember = targetMemberRows[0];
      if (!targetMember) {
        return json({ error: "Member not found" }, 404);
      }

      const targetOrgId = targetMember.organizationId;
      if (!targetOrgId) {
        return json({ error: "Invalid organization state" }, 400);
      }

      // Verify the requester is an admin in target organization
      const requesterMembership = await db
        .select()
        .from(members)
        .where(
          and(
            eq(members.organizationId, targetOrgId),
            eq(members.email, request.user.email),
            eq(members.role, "admin")
          )
        );
      if (requesterMembership.length === 0) {
        return json({ error: "Forbidden: Only admins can remove organization members" }, 403);
      }

      // If deleting themselves, ensure they are not the last admin
      if (targetMember.email === request.user.email) {
        const otherAdmins = await db
          .select()
          .from(members)
          .where(
            and(
              eq(members.organizationId, targetOrgId),
              eq(members.role, "admin"),
              eq(members.status, "accepted"),
              ne(members.email, request.user.email)
            )
          );
        if (otherAdmins.length === 0) {
          return json({ error: "Forbidden: You are the last admin in this organization. You cannot leave without assigning another admin first." }, 403);
        }
      }

      await db.delete(members).where(eq(members.id, id));

      return json({ success: true });
    } catch (err: any) {
      console.error("Error removing member:", err);
      return json({ error: "Internal server error" }, 500);
    }
  });
};

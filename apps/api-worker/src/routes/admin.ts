import { eq, and } from "drizzle-orm";
import { getDb } from "../db/client";
import { users, organizations, projects, apiKeys, members } from "../db/schema";
import { json } from "../utils/response";
import type { Env } from "../types/env";
import { nanoid } from "nanoid";
import { generateApiKey } from "../utils/api-key";
import { sha256 } from "../utils/hash";
import { authenticate } from "../middleware/auth";

export const registerAdminRoutes = (router: any) => {
  // GET pending users for approval
  router.get("/api/v1/admin/pending", authenticate, async (request: any, env: Env) => {
    // Check if the current request user is a super admin
    if (!request.user || request.user.role !== "super_admin") {
      return json({ error: "Forbidden: Super Admin access required" }, 403);
    }

    try {
      const db = getDb(env);
      const pendingUsers = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          approved: users.approved,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.approved, false));

      return json(pendingUsers);
    } catch (err: any) {
      console.error("Admin pending users error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  });

  // Approve a user and bootstrap workspace
  router.post("/api/v1/admin/approve/:id", authenticate, async (request: any, env: Env) => {
    if (!request.user || request.user.role !== "super_admin") {
      return json({ error: "Forbidden: Super Admin access required" }, 403);
    }

    try {
      const targetUserId = request.params.id;
      const db = getDb(env);

      // Find user
      const targetRows = await db
        .select()
        .from(users)
        .where(eq(users.id, targetUserId));

      const targetUser = targetRows[0];
      if (!targetUser) {
        return json({ error: "User not found" }, 404);
      }

      if (targetUser.approved) {
        return json({ error: "User is already approved" }, 400);
      }

      // 1. Set user approved = true
      await db
        .update(users)
        .set({ approved: true })
        .where(eq(users.id, targetUserId));

      // 2. Create default Org for the user
      const orgId = "org_" + nanoid();
      await db.insert(organizations).values({
        id: orgId,
        name: `${targetUser.email.split("@")[0]}'s Org`,
        createdAt: Date.now(),
      });

      // 3. Create default Project for the user
      const projectId = "proj_" + nanoid();
      await db.insert(projects).values({
        id: projectId,
        organizationId: orgId,
        name: "Default Project",
        monthlyEventLimit: 100000,
        retentionDays: 30,
        createdAt: Date.now(),
      });

      // 4. Create default Member relationship
      const memberId = "mem_" + nanoid();
      await db.insert(members).values({
        id: memberId,
        organizationId: orgId,
        email: targetUser.email,
        role: "admin",
      });

      // 5. Generate and insert default API key for the Project
      const rawApiKey = generateApiKey();
      const keyHash = await sha256(rawApiKey);
      const keyId = "key_" + nanoid();
      
      await db.insert(apiKeys).values({
        id: keyId,
        projectId,
        keyHash,
        name: "Default Key",
        active: true,
        createdAt: Date.now(),
      });

      return json({
        success: true,
        message: "User approved and default workspace provisioned.",
        details: {
          organizationId: orgId,
          projectId,
          apiKey: rawApiKey,
        },
      });

    } catch (err: any) {
      console.error("Admin approve user error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  });
};

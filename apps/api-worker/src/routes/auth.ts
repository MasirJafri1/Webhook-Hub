import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { users, members, projects } from "../db/schema";
import { hashPassword, verifyPassword, signJwt } from "../utils/crypto";
import { json } from "../utils/response";
import type { Env } from "../types/env";
import { nanoid } from "nanoid";
import { WorkspaceService } from "../services/workspace.service";
import { RateLimitService } from "../services/rate-limit.service";
import { authenticate } from "../middleware/auth";

export const registerAuthRoutes = (router: any) => {

  router.post("/api/v1/auth/google", async (request: any, env: Env) => {
    try {
      const body = await request.json();
      const { credential } = body;

      if (!credential) {
        return json({ error: "Credential token is required" }, 400);
      }

      // Verify Google ID token using Google tokeninfo API
      const tokenInfoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      );
      if (!tokenInfoRes.ok) {
        return json({ error: "Invalid Google token credential" }, 401);
      }

      const tokenInfo: any = await tokenInfoRes.json();

      if (
        tokenInfo.email_verified !== "true" &&
        tokenInfo.email_verified !== true
      ) {
        return json({ error: "Google account email is not verified" }, 400);
      }

      if (env.GOOGLE_CLIENT_ID && tokenInfo.aud !== env.GOOGLE_CLIENT_ID) {
        console.error(
          `Google token audience mismatch. Expected: ${env.GOOGLE_CLIENT_ID}, Got: ${tokenInfo.aud}`,
        );
        return json({ error: "Google token audience mismatch" }, 401);
      }

      const email = tokenInfo.email.toLowerCase().trim();
      const db = getDb(env);

      // Check if user exists
      const rows = await db.select().from(users).where(eq(users.email, email));

      let user = rows[0];

      if (user) {
        // If user exists but is not approved, auto-approve them
        if (!user.approved) {
          await db
            .update(users)
            .set({ approved: true })
            .where(eq(users.id, user.id));
          user.approved = true;
        }
      } else {
        // User does not exist, signup rate limit check
        const clientIp = request.headers.get("CF-Connecting-IP") || "local-ip";
        const rateLimitService = new RateLimitService(env.CACHE);
        const isRateLimited = await rateLimitService.isRateLimited(
          `signup:${clientIp}`,
          5,
          10800,
        );
        if (isRateLimited) {
          return json(
            {
              error:
                "Too many accounts created from this IP. Please try again later.",
            },
            429,
          );
        }

        // Create new user (Google authentication registration)
        const passwordHash = await hashPassword("google_oauth_" + nanoid());
        user = {
          id: "usr_" + nanoid(),
          email,
          passwordHash,
          role: "user",
          approved: true,
          createdAt: Date.now(),
        };

        await db.insert(users).values(user);

        // Bootstrap workspace
        const workspaceService = new WorkspaceService(db);
        await workspaceService.bootstrap(email);
      }

      const jwtSecret = env.JWT_SECRET;
      if (!jwtSecret) {
        console.error("JWT_SECRET environment variable is not defined");
        return json({ error: "Internal server error" }, 500);
      }

      const token = await signJwt(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        jwtSecret,
      );

      return json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err: any) {
      console.error("Google auth error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  });

  router.get("/api/v1/auth/me", authenticate, async (request: any, env: Env) => {
    try {
      const db = getDb(env);
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.id, request.user.userId));
      const user = rows[0];
      if (!user) {
        return json({ error: "User not found" }, 404);
      }

      const memberRows = await db
        .select()
        .from(members)
        .where(eq(members.email, user.email));

      let activeProject: any = null;
      let activeRole = "member";
      let activeOrgId: string | null = null;

      if (request.projectId) {
        const projRows = await db
          .select()
          .from(projects)
          .where(eq(projects.id, request.projectId));
        if (projRows.length > 0) {
          activeProject = projRows[0];
          activeOrgId = activeProject.organizationId;
          const matchingMember = memberRows.find(
            (m) => m.organizationId === activeOrgId
          );
          if (matchingMember) {
            activeRole = matchingMember.role || "member";
          }
        }
      }

      return json({
        id: user.id,
        email: user.email,
        role: user.role,
        memberships: memberRows,
        activeProjectId: request.projectId,
        activeProject,
        activeOrgId,
        activeRole,
      });
    } catch (err: any) {
      console.error("Auth me error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  });
};

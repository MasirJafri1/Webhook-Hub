import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { users } from "../db/schema";
import { hashPassword, verifyPassword, signJwt } from "../utils/crypto";
import { json } from "../utils/response";
import type { Env } from "../types/env";
import { nanoid } from "nanoid";

export const registerAuthRoutes = (router: any) => {
  router.post("/api/v1/auth/signup", async (request: any, env: Env) => {
    try {
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return json({ error: "Email and password are required" }, 400);
      }

      const db = getDb(env);
      
      // Check if user already exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()));

      if (existing.length > 0) {
        return json({ error: "Email already registered" }, 400);
      }

      const passwordHash = await hashPassword(password);
      
      const newUser = {
        id: "usr_" + nanoid(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "user",
        approved: false,
        createdAt: Date.now(),
      };

      await db.insert(users).values(newUser);

      return json({
        success: true,
        message: "Signup successful. Your account is pending administrator approval.",
      }, 201);

    } catch (err: any) {
      return json({ error: err.message || "Internal server error" }, 500);
    }
  });

  router.post("/api/v1/auth/login", async (request: any, env: Env) => {
    try {
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return json({ error: "Email and password are required" }, 400);
      }

      const db = getDb(env);
      const normalizedEmail = email.toLowerCase().trim();
      
      let rows = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail));

      let user = rows[0];

      // On-the-fly provisioning of Super Admin from env/secrets
      const isProd = env.ENVIRONMENT === "production";
      const adminEmail = env.SUPER_ADMIN_EMAIL || (isProd ? null : "admin@webhook.com");
      const adminPassword = env.SUPER_ADMIN_PASSWORD || (isProd ? null : "AdminSecurePassword123");

      if (!user && adminEmail && adminPassword && normalizedEmail === adminEmail.toLowerCase().trim()) {
        if (password === adminPassword) {
          const adminPasswordHash = await hashPassword(adminPassword);
          const now = Date.now();
          const adminId = "usr_seed_admin";
          
          await db.insert(users).values({
            id: adminId,
            email: adminEmail.toLowerCase().trim(),
            passwordHash: adminPasswordHash,
            role: "super_admin",
            approved: true,
            createdAt: now,
          });

          // Fetch the newly provisioned admin user
          const newRows = await db
            .select()
            .from(users)
            .where(eq(users.id, adminId));
          user = newRows[0];
        }
      }

      if (!user) {
        return json({ error: "Invalid email or password" }, 401);
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return json({ error: "Invalid email or password" }, 401);
      }

      if (!user.approved && user.role !== "super_admin") {
        return json({
          error: "pending_approval",
          message: "Your account is pending approval by a Super Admin.",
        }, 403);
      }

      const jwtSecret = env.JWT_SECRET || "JWT_SECRET_DEV_KEY_abc123";
      const token = await signJwt(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        jwtSecret
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
      return json({ error: err.message || "Internal server error" }, 500);
    }
  });
};

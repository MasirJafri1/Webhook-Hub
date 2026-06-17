import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { users } from "../db/schema";
import { hashPassword, verifyPassword, signJwt } from "../utils/crypto";
import { json } from "../utils/response";
import type { Env } from "../types/env";
import { nanoid } from "nanoid";

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain both letters and numbers.";
  }
  return null;
}

export const registerAuthRoutes = (router: any) => {
  router.post("/api/v1/auth/signup", async (request: any, env: Env) => {
    try {
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return json({ error: "Email and password are required" }, 400);
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        return json({ error: passwordError }, 400);
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
      console.error("Auth signup error:", err);
      return json({ error: "Internal server error" }, 500);
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
      console.error("Auth login error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  });
};

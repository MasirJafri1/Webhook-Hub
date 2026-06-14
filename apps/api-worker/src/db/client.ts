import { drizzle } from "drizzle-orm/d1";
import type { Env } from "../types/env";

export const getDb = (env: Env) => {
  return drizzle(env.DB);
};

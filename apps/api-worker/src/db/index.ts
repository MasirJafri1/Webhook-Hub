import type { Env } from "../types/env"

export const getDb = (env: Env) => {
  return env.DB
}
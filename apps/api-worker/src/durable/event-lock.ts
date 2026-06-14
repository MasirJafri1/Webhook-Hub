import type { Env } from "../types/env";

export class EventLock {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);

      if (url.pathname === "/acquire") {
        const lockExpiry =
          (await this.state.storage.get<number>("lockExpiry")) ?? 0;
        const now = Date.now();

        if (lockExpiry > now) {
          // Lock is still held
          return new Response(JSON.stringify({ acquired: false }), {
            headers: { "content-type": "application/json" },
          });
        }

        // Acquire lock for 30 seconds
        await this.state.storage.put("lockExpiry", now + 30000);

        return new Response(JSON.stringify({ acquired: true }), {
          headers: { "content-type": "application/json" },
        });
      }

      if (url.pathname === "/release") {
        await this.state.storage.delete("lockExpiry");
        return new Response(JSON.stringify({ released: true }), {
          headers: { "content-type": "application/json" },
        });
      }

      return new Response("Not Found", { status: 404 });
    } catch (err) {
      console.error("Durable Object EventLock fetch error:", err);
      throw err;
    }
  }
}

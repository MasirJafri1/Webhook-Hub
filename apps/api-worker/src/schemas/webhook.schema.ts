import { z } from "zod";

export const CreateWebhookSchema = z.object({
  name: z.string().min(3).max(100),

  url: z.string().url(),

  requestsPerMinute: z.number().int().positive().optional(),

  eventFilters: z.array(z.string()).optional(),

  payloadTransform: z
    .object({
      rename: z.record(z.string(), z.string()).optional(),
      remove: z.array(z.string()).optional(),
      static: z.record(z.string(), z.unknown()).optional(),
      template: z.record(z.string(), z.string()).optional(),
    })
    .optional(),

  version: z.enum(["v1", "v2"]).optional(),

  customHeaders: z.record(z.string(), z.string()).optional(),
});

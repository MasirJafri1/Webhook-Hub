import { z } from "zod";

export const CreateWebhookSchema = z.object({
  name: z.string().min(3).max(100),

  url: z.string().url(),

  requestsPerMinute: z.number().int().positive().optional(),
});

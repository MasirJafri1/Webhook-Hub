import { z } from "zod";

export const CreateEventSchema = z.object({
  endpointId: z.string(),
  eventType: z.string(),
  payload: z.unknown(),
  idempotencyKey: z.string().optional(),
});

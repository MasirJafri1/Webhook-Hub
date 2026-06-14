import { nanoid } from "nanoid";

export function generateApiKey(): string {
  return `whpk_live_${nanoid(32)}`;
}

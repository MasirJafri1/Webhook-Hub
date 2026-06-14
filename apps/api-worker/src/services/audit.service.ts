import { nanoid } from "nanoid";
import { auditLogs } from "../db/schema";

export class AuditService {
  constructor(private db: any) {}

  async log(action: string, actor: string, projectId: string | null = null) {
    const logEntry = {
      id: "aud_" + nanoid(),
      projectId,
      action,
      actor,
      createdAt: Date.now(),
    };
    await this.db.insert(auditLogs).values(logEntry);
    return logEntry;
  }
}

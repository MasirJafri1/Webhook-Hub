import { getDb } from "../db/client";
import { projects } from "../db/schema";
import { sql } from "drizzle-orm";
import { AuditService } from "../services/audit.service";

export async function runRetentionJob(env: any) {
  const db = getDb(env);

  const allProjects = await db.select().from(projects);

  for (const project of allProjects) {
    // Cap log retention to at most 7 days to fit under Cloudflare D1 free storage limits.
    const retentionDays = Math.min(project.retentionDays ?? 30, 7);
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    // Delete old deliveries (for events belonging to this project)
    await db.run(
      sql`DELETE FROM deliveries WHERE event_id IN (
        SELECT id FROM events WHERE project_id = ${project.id} AND created_at < ${cutoff}
      )`,
    );

    // Delete old events
    const result = await db.run(
      sql`DELETE FROM events WHERE project_id = ${project.id} AND created_at < ${cutoff}`,
    );

    const deletedCount =
      (result as any)?.meta?.changes ?? (result as any)?.changes ?? 0;

    if (deletedCount > 0) {
      const auditService = new AuditService(db);
      await auditService.log("DATA_RETAINED", "system", project.id);
      console.log(
        `Retention: Deleted ${deletedCount} events for project ${project.id} (retention: ${retentionDays} days)`,
      );
    }
  }
}

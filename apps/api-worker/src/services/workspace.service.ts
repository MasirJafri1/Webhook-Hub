import { nanoid } from "nanoid";
import { organizations, projects, members, apiKeys } from "../db/schema";
import { generateApiKey } from "../utils/api-key";
import { sha256 } from "../utils/hash";

export class WorkspaceService {
  constructor(private db: any) {}

  async bootstrap(email: string) {
    // 1. Create default Org for the user
    const orgId = "org_" + nanoid();
    await this.db.insert(organizations).values({
      id: orgId,
      name: `${email.split("@")[0]}'s Org`,
      createdAt: Date.now(),
    });

    // 2. Create default Project for the user
    const projectId = "proj_" + nanoid();
    await this.db.insert(projects).values({
      id: projectId,
      organizationId: orgId,
      name: "Default Project",
      monthlyEventLimit: 100000,
      retentionDays: 30,
      createdAt: Date.now(),
    });

    // 3. Create default Member relationship
    const memberId = "mem_" + nanoid();
    await this.db.insert(members).values({
      id: memberId,
      organizationId: orgId,
      email: email,
      role: "admin",
    });

    // 4. Generate and insert default API key for the Project
    const rawApiKey = generateApiKey();
    const keyHash = await sha256(rawApiKey);
    const keyId = "key_" + nanoid();

    await this.db.insert(apiKeys).values({
      id: keyId,
      projectId,
      keyHash,
      name: "Default Key",
      active: true,
      createdAt: Date.now(),
    });

    return {
      organizationId: orgId,
      projectId,
      apiKey: rawApiKey,
    };
  }
}

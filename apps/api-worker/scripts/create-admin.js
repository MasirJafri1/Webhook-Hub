import crypto from "crypto";
import { nanoid } from "nanoid";

try { process.loadEnvFile(); } catch {}
try { process.loadEnvFile("../../.env"); } catch {}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 32, "sha256");
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

const isRemote = process.argv.includes("--remote");
const email = process.argv.find(a => a.startsWith("--email="))?.split("=")[1] || process.env.ADMIN_EMAIL;
const password = process.argv.find(a => a.startsWith("--password="))?.split("=")[1] || process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Error: Credentials must be set via system env, `.env` file, or CLI flags.");
  console.error("\nUsage:\n  node scripts/create-admin.js --email=admin@example.com --password=SecurePass123 [--remote]");
  process.exit(1);
}

const now = Date.now();
const [usrId, orgId, projId, memId, keyId] = ["usr", "org", "proj", "mem", "key"].map(p => `${p}_${nanoid()}`);
const rawApiKey = "whpk_live_" + Array.from(crypto.randomBytes(32), b => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[b % 62]).join("");
const hashedApiKey = crypto.createHash("sha256").update(rawApiKey).digest("hex");

const sql = [
  `INSERT INTO users (id, email, password_hash, role, approved, created_at) VALUES ('${usrId}', '${email.toLowerCase().trim()}', '${hashPassword(password)}', 'super_admin', 1, ${now});`,
  `INSERT INTO organizations (id, name, created_at) VALUES ('${orgId}', 'Default Organization', ${now});`,
  `INSERT INTO projects (id, organization_id, name, monthly_event_limit, retention_days, created_at) VALUES ('${projId}', '${orgId}', 'Default Project', 100000, 30, ${now});`,
  `INSERT INTO members (id, organization_id, email, role) VALUES ('${memId}', '${orgId}', '${email.toLowerCase().trim()}', 'admin');`,
  `INSERT INTO api_keys (id, project_id, key_hash, name, active, created_at) VALUES ('${keyId}', '${projId}', '${hashedApiKey}', 'Default Key', 1, ${now});`
].join(" ");

console.log(`
==================================================
             BOOTSTRAP CREDENTIALS
==================================================
Email:      ${email}
Password:   ${password}
API Key:    ${rawApiKey}
==================================================

Run the following command to bootstrap your database:
--------------------------------------------------
npx wrangler d1 execute webhook-platform-db --command="${sql.replace(/'/g, "'\\''")}"${isRemote ? " --remote" : " --local"}
--------------------------------------------------
`);

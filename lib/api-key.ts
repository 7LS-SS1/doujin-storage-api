import { createHash, randomBytes } from "crypto";
import { sql } from "./db";

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `csa_${randomBytes(32).toString("hex")}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.substring(0, 8);
  return { raw, hash, prefix };
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function validateApiKey(key: string) {
  const hash = hashApiKey(key);
  const rows = await sql`
    SELECT id, name, is_active FROM api_keys 
    WHERE key_hash = ${hash} AND is_active = true
  `;
  if (rows.length === 0) return null;

  // Update last used
  await sql`UPDATE api_keys SET last_used_at = NOW() WHERE id = ${rows[0].id}`;

  return rows[0];
}

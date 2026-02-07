import { sql } from "./db";

export async function logAudit(params: {
  userEmail: string;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: Record<string, unknown>;
}) {
  await sql`
    INSERT INTO audit_logs (user_email, action, entity_type, entity_id, details)
    VALUES (
      ${params.userEmail},
      ${params.action},
      ${params.entityType ?? null},
      ${params.entityId ?? null},
      ${params.details ? JSON.stringify(params.details) : null}
    )
  `;
}

import { sql } from "./db";

export async function logAudit(params: {
  userEmail: string;
  action: string;
  entityType?: string;
  entityId?: number | string;
  details?: Record<string, unknown>;
}) {
  let entityId: number | null = null;
  if (typeof params.entityId === "number" && Number.isFinite(params.entityId)) {
    entityId = params.entityId;
  } else if (
    typeof params.entityId === "string" &&
    params.entityId.trim() !== "" &&
    /^[0-9]+$/.test(params.entityId)
  ) {
    entityId = Number(params.entityId);
  }
  const details =
    entityId === null && params.entityId
      ? { ...(params.details ?? {}), entityId: params.entityId }
      : params.details;
  try {
    await sql`
      INSERT INTO audit_logs (user_email, action, entity_type, entity_id, details)
      VALUES (
        ${params.userEmail},
        ${params.action},
        ${params.entityType ?? null},
        ${entityId},
        ${details ? JSON.stringify(details) : null}
      )
    `;
  } catch (err) {
    // Do not block main actions if audit logging fails
    console.error("Audit log error:", err);
  }
}

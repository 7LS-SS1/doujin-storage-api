import { sql } from "./db";
import { getTableColumns } from "./db-schema";

export async function logAudit(params: {
  userEmail: string;
  action: string;
  entityType?: string;
  entityId?: number | string;
  details?: Record<string, unknown>;
}) {
  let entityId: number | null = null;
  let rawEntityId: string | null = null;
  if (typeof params.entityId === "number" && Number.isFinite(params.entityId)) {
    entityId = params.entityId;
    rawEntityId = String(params.entityId);
  } else if (
    typeof params.entityId === "string" &&
    params.entityId.trim() !== ""
  ) {
    rawEntityId = params.entityId.trim();
    if (/^[0-9]+$/.test(rawEntityId)) {
      entityId = Number(rawEntityId);
    }
  }
  const entity =
    (params.entityType && rawEntityId && `${params.entityType}#${rawEntityId}`) ||
    params.entityType ||
    rawEntityId ||
    params.action;
  const details =
    entityId === null && params.entityId
      ? { ...(params.details ?? {}), entityId: params.entityId }
      : params.details;
  try {
    const columns = await getTableColumns("audit_logs");
    const hasEntity = columns.has("entity");
    const hasEntityType = columns.has("entity_type");
    const hasEntityId = columns.has("entity_id");
    const hasDetails = columns.has("details");
    const detailsJson = details ? JSON.stringify(details) : null;

    if (hasEntity && hasEntityType && hasEntityId && hasDetails) {
      await sql`
        INSERT INTO audit_logs (user_email, action, entity, entity_type, entity_id, details)
        VALUES (
          ${params.userEmail},
          ${params.action},
          ${entity},
          ${params.entityType ?? null},
          ${entityId},
          ${detailsJson}
        )
      `;
      return;
    }

    if (hasEntity && hasDetails) {
      await sql`
        INSERT INTO audit_logs (user_email, action, entity, details)
        VALUES (
          ${params.userEmail},
          ${params.action},
          ${entity},
          ${detailsJson}
        )
      `;
      return;
    }

    if (hasEntity && hasEntityType && hasEntityId) {
      await sql`
        INSERT INTO audit_logs (user_email, action, entity, entity_type, entity_id)
        VALUES (
          ${params.userEmail},
          ${params.action},
          ${entity},
          ${params.entityType ?? null},
          ${entityId}
        )
      `;
      return;
    }

    if (hasEntityType && hasEntityId && hasDetails) {
      await sql`
        INSERT INTO audit_logs (user_email, action, entity_type, entity_id, details)
        VALUES (
          ${params.userEmail},
          ${params.action},
          ${params.entityType ?? null},
          ${entityId},
          ${detailsJson}
        )
      `;
      return;
    }

    if (hasEntityType && hasEntityId) {
      await sql`
        INSERT INTO audit_logs (user_email, action, entity_type, entity_id)
        VALUES (
          ${params.userEmail},
          ${params.action},
          ${params.entityType ?? null},
          ${entityId}
        )
      `;
      return;
    }

    if (hasEntity) {
      await sql`
        INSERT INTO audit_logs (user_email, action, entity)
        VALUES (
          ${params.userEmail},
          ${params.action},
          ${entity}
        )
      `;
      return;
    }

    if (hasDetails) {
      await sql`
        INSERT INTO audit_logs (user_email, action, details)
        VALUES (
          ${params.userEmail},
          ${params.action},
          ${detailsJson}
        )
      `;
      return;
    }

    await sql`
      INSERT INTO audit_logs (user_email, action)
      VALUES (${params.userEmail}, ${params.action})
    `;
  } catch (err) {
    // Do not block main actions if audit logging fails
    console.error("Audit log error:", err);
  }
}

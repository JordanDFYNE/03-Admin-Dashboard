export async function recordAudit(
  client,
  { entityType, entityId, action, changedByUserId = null, beforeData = null, afterData = null }
) {
  await client.query(
    `
      insert into audit_events (entity_type, entity_id, action, changed_by_user_id, before_data, after_data)
      values ($1, $2, $3, $4, $5, $6)
    `,
    [entityType, entityId, action, changedByUserId, beforeData, afterData]
  );
}

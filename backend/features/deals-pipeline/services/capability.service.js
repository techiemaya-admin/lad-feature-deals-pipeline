const { query } = require('../shared/database/connection');

exports.getUserCapabilities = async (userId, tenantId) => {
  const sql = `
    SELECT capability_key
    FROM lad_dev.user_capabilities
    WHERE user_id = $1
      AND tenant_id = $2
      AND enabled = true
  `;
  const result = await query(sql, [userId, tenantId]);
  return result.rows.map((row) => row.capability_key);
};

// Lead Repository for deals-pipeline - LAD Architecture Compliant
const { query } = require('../../../shared/database/connection');
const leadDTO = require('../dtos/lead.dto');
const { PRIORITY_TO_INT } = require('../constants/priority');

// Use core utils in LAD architecture
const { DEFAULT_SCHEMA } = require('../../../core/utils/schemaHelper');
const logger = require('../../../core/utils/logger');

// Use DTO functions for field mapping
const mapFieldsToDB = leadDTO.toDatabase;
const mapFieldsFromDB = leadDTO.fromDatabase;

function normalizeStage(stage) {
  if (!stage || typeof stage !== 'string') return stage;
  if (stage.match(/^\d+_contacted$/)) return 'contacted';
  if (stage.match(/^\d+_followup$/)) return 'follow_up';
  if (stage === 'followup') return 'follow_up';
  return stage.replace(/^[\d_]+/, '');
}

// Get all leads
async function getAllLeads(tenant_id, schema = DEFAULT_SCHEMA, filters = {}, pagination = {}) {
  if (!tenant_id) {
    throw new Error('tenant_id is required for getAllLeads');
  }

  const { page = 1, limit = 0 } = pagination;

  // Base conditions
  let whereClause = `WHERE l.tenant_id = $1 AND l.is_deleted = FALSE`;
  let params = [tenant_id];
  let paramIndex = 2;

  // Add filters
  if (filters.stage) {
    whereClause += ` AND l.stage ~ ('^\\d*' || $${paramIndex} || '$')`;
    params.push(filters.stage);
    paramIndex++;
  }

  if (filters.status) {
    whereClause += ` AND l.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.search) {
    whereClause += ` AND (l.first_name ILIKE $${paramIndex} OR l.last_name ILIKE $${paramIndex} OR l.email ILIKE $${paramIndex} OR l.company_name ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  // Get total count first (Fast index scan)
  let countSql = `SELECT COUNT(*) FROM ${schema}.leads l ${whereClause}`;
  const countResult = await query(countSql, params);
  const total = parseInt(countResult.rows[0].count);

  // Get data (Fast index order + limit)
  let dataSql = `
    SELECT l.*
    FROM ${schema}.leads l
    ${whereClause}
    ORDER BY l.updated_at DESC
  `;

  if (limit > 0) {
    const offset = (page - 1) * limit;
    dataSql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
  }
  
  const result = await query(dataSql, params);
  const leads = result.rows.map(lead => ({
    ...mapFieldsFromDB(lead),
    stage: normalizeStage(lead.stage),
    tags: lead.tags || [] 
  }));

  if (limit > 0) {
    return {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  return leads;
}

async function getLeadsByStage(tenant_id, schema = DEFAULT_SCHEMA, filters = {}, pagination = {}) {
  if (!tenant_id) {
    throw new Error('tenant_id is required for getLeadsByStage');
  }

  const { page = 1, limit = 10 } = pagination;

  let whereClause = `WHERE l.tenant_id = $1 AND l.is_deleted = FALSE`;
  let params = [tenant_id];
  let paramIndex = 2;

  if (filters.stage) {
    whereClause += ` AND l.stage ~ ('^\\d*' || $${paramIndex} || '$')`;
    params.push(filters.stage);
    paramIndex++;
  }

  if (filters.status) {
    whereClause += ` AND l.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  const countSql = `SELECT COUNT(*) FROM ${schema}.leads l ${whereClause}`;
  const countResult = await query(countSql, params);
  const total = parseInt(countResult.rows[0].count);

  const offset = (page - 1) * limit;
  let dataSql = `
    SELECT l.*
    FROM ${schema}.leads l
    ${whereClause}
    ORDER BY l.updated_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);
  const result = await query(dataSql, params);

  const leads = result.rows.map(lead => ({
    ...mapFieldsFromDB(lead),
    stage: normalizeStage(lead.stage),
    tags: lead.tags || []
  }));

  return {
    leads,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// Get lead by ID
async function getLeadById(id, tenant_id, schema = DEFAULT_SCHEMA) {
  if (!tenant_id) {
    throw new Error('tenant_id is required for getLeadById');
  }

  // Get lead details
  const leadSql = `SELECT * FROM ${schema}.leads WHERE id = $1 AND tenant_id = $2 AND is_deleted = FALSE`;
  const leadResult = await query(leadSql, [id, tenant_id]);
  const lead = leadResult.rows[0];
  
  if (!lead) return null;

  // Get bookings for this lead
  const bookingsSql = `
    SELECT 
      id,
      booking_type,
      booking_source,
      scheduled_at,
      status,
      assigned_user_id,
      timezone,
      call_result,
      retry_count,
      parent_booking_id,
      notes,
      created_at
    FROM ${schema}.lead_bookings
    WHERE lead_id = $1 AND tenant_id = $2
    ORDER BY scheduled_at DESC
  `;
  const bookingsResult = await query(bookingsSql, [id, tenant_id]);
  
  // Separate current and past bookings
  const now = new Date();
  const bookings = bookingsResult.rows.map(b => ({
    id: b.id,
    booking_type: b.booking_type,
    booking_source: b.booking_source,
    scheduled_at: b.scheduled_at,
    status: b.status,
    assigned_user_id: b.assigned_user_id,
    timezone: b.timezone,
    call_result: b.call_result,
    retry_count: b.retry_count || 0,
    parent_booking_id: b.parent_booking_id,
    notes: b.notes,
    created_at: b.created_at,
    is_past: new Date(b.scheduled_at) < now
  }));

  const currentBookings = bookings.filter(b => !b.is_past);
  const pastBookings = bookings.filter(b => b.is_past);

  // Map lead fields and add bookings
  const mappedLead = mapFieldsFromDB(lead);
  mappedLead.stage = normalizeStage(lead.stage);
  mappedLead.bookings = {
    current: currentBookings,
    past: pastBookings
  };

  return mappedLead;
}

// Create new lead
async function createLead(leadData, tenant_id, schema = DEFAULT_SCHEMA) {
  if (!tenant_id) {
    throw new Error('tenant_id is required for createLead');
  }

  const sql = `
    INSERT INTO ${schema}.leads (
      tenant_id, first_name, email, phone, company_name, stage, status, 
      source, priority, estimated_value
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const params = [
    tenant_id,
    leadData.name || '',
    leadData.email || null,
    leadData.phone || null,
    leadData.company || null,
    leadData.stage || 'new',
    leadData.status || 'active',
    leadData.source || null,
    PRIORITY_TO_INT[leadData.priority] || 2, // Convert to integer, default to medium (2)
    leadData.amount || leadData.value || null // Accept both amount and value
  ];
  const result = await query(sql, params);
  return mapFieldsFromDB(result.rows[0]);
}

// Update lead
async function updateLead(id, tenant_id, leadData, schema = DEFAULT_SCHEMA) {
  if (!tenant_id) {
    throw new Error('tenant_id is required for updateLead');
  }

  // Map API fields to database columns
  const mappedData = mapFieldsToDB(leadData);
  
  const fields = [];
  const params = [];
  let paramIndex = 1;

  Object.keys(mappedData).forEach(key => {
    if (mappedData[key] !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      params.push(mappedData[key]);
      paramIndex++;
    }
  });

  if (fields.length === 0) return getLeadById(id, tenant_id, schema);

  fields.push(`updated_at = NOW()`);
  params.push(id);
  const idIndex = paramIndex;
  paramIndex++;
  
  params.push(tenant_id);
  const tenantIndex = paramIndex;

  const sql = `
    UPDATE ${schema}.leads 
    SET ${fields.join(', ')}
    WHERE id = $${idIndex} AND tenant_id = $${tenantIndex} AND is_deleted = FALSE
    RETURNING *
  `;
  
  const result = await query(sql, params);
  return mapFieldsFromDB(result.rows[0]);
}

// Delete lead (soft delete)
async function deleteLead(id, tenant_id, schema = DEFAULT_SCHEMA) {
  if (!tenant_id) {
    throw new Error('tenant_id is required for deleteLead');
  }

  const sql = `UPDATE ${schema}.leads SET is_deleted = TRUE WHERE id = $1 AND tenant_id = $2 RETURNING *`;
  const result = await query(sql, [id, tenant_id]);
  return mapFieldsFromDB(result.rows[0]);
}

// Get conversion stats
async function getLeadConversionStats(tenant_id, schema = DEFAULT_SCHEMA) {
  if (!tenant_id) {
    throw new Error('tenant_id is required for getLeadConversionStats');
  }

  const sql = `
    SELECT 
      stage,
      COUNT(*) as count,
      COALESCE(SUM(estimated_value), 0) as total_value
    FROM ${schema}.leads
    WHERE tenant_id = $1 AND is_deleted = FALSE
    GROUP BY stage
  `;
  const result = await query(sql, [tenant_id]);
  return result.rows;
}

// Get pipeline statistics
async function getPipelineStats(tenant_id, schema = DEFAULT_SCHEMA) {
  if (!tenant_id) {
    throw new Error('tenant_id is required for getPipelineStats');
  }

  // Query 1: Total leads
  const totalLeadsSql = `
    SELECT COUNT(*) as total
    FROM ${schema}.leads
    WHERE tenant_id = $1 AND is_deleted = FALSE
  `;

  // Query 2: Connections sent (LinkedIn connect/message sent status)
  const connectionsSentSql = `
    SELECT COUNT(*) as total
    FROM ${schema}.leads
    WHERE tenant_id = $1 AND is_deleted = FALSE AND stage = $2
  `;

  // Query 3: Messages sent (all channels)
  const messagesSentSql = `
    SELECT COUNT(*) as total
    FROM ${schema}.leads
    WHERE tenant_id = $1 AND is_deleted = FALSE AND stage = $2
  `;

  // Query 4: Successful interactions (replied or connected)
  const contactedSql = `
    SELECT COUNT(*) as total
    FROM ${schema}.leads
    WHERE tenant_id = $1 AND is_deleted = FALSE AND stage = 'contacted'
  `;

  // Execute all queries in parallel
  const [totalLeads, connectionsSent, messagesSent, contacted] = await Promise.all([
    query(totalLeadsSql, [tenant_id]),
    query(connectionsSentSql, [tenant_id, 'connection_sent']),
    query(messagesSentSql, [tenant_id, 'message_sent']),
    query(contactedSql, [tenant_id])
  ]);

  return {
    totalLeads: parseInt(totalLeads.rows[0]?.total || 0),
    connectionsSent: parseInt(connectionsSent.rows[0]?.total || 0),
    messagesSent: parseInt(messagesSent.rows[0]?.total || 0),
    contacted: parseInt(contacted.rows[0]?.total || 0),
    successfulInteractions: parseInt(contacted.rows[0]?.total || 0),
    successRate: totalLeads.rows[0]?.total > 0 
      ? ((parseInt(contacted.rows[0]?.total || 0) / parseInt(totalLeads.rows[0].total)) * 100).toFixed(2)
      : 0
  };
}

module.exports = {
  getAllLeads,
  getLeadsByStage,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadConversionStats,
  getPipelineStats
};
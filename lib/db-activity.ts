import { query } from './db'

// ─── Log an activity event ──────────────────────────────────────────
export async function logActivity(
  tenantId: string,
  userEmail: string,
  eventType: 'login' | 'page_view' | 'action',
  module?: string,
  metadata?: Record<string, any>
) {
  await query(
    `INSERT INTO tenant_activity_logs (tenant_id, user_email, event_type, module, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [tenantId, userEmail, eventType, module || null, JSON.stringify(metadata || {})]
  )

  // Also update the tenant's last_active_at
  await query(
    `UPDATE tenants SET last_active_at = NOW() WHERE id = $1`,
    [tenantId]
  )
}

// ─── Get login history for a tenant ─────────────────────────────────
export async function getLoginHistory(tenantId: string, days: number = 30) {
  const result = await query(
    `SELECT user_email, metadata, created_at
     FROM tenant_activity_logs
     WHERE tenant_id = $1 AND event_type = 'login'
       AND created_at >= NOW() - INTERVAL '1 day' * $2
     ORDER BY created_at DESC
     LIMIT 50`,
    [tenantId, days]
  )
  return result.rows
}

// ─── Get module usage breakdown ─────────────────────────────────────
export async function getModuleUsage(tenantId: string, days: number = 30) {
  const result = await query(
    `SELECT module, COUNT(*) as visits
     FROM tenant_activity_logs
     WHERE tenant_id = $1
       AND event_type = 'page_view'
       AND module IS NOT NULL
       AND created_at >= NOW() - INTERVAL '1 day' * $2
     GROUP BY module
     ORDER BY visits DESC`,
    [tenantId, days]
  )
  return result.rows
}

// ─── Get daily activity counts (for heatmap / chart) ────────────────
export async function getActivityTimeline(tenantId: string, days: number = 30) {
  const result = await query(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM tenant_activity_logs
     WHERE tenant_id = $1
       AND created_at >= NOW() - INTERVAL '1 day' * $2
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [tenantId, days]
  )
  return result.rows
}

// ─── Get activity summary stats ────────────────────────────────────
export async function getActivitySummary(tenantId: string, days: number = 30) {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE event_type = 'login') as total_logins,
       COUNT(DISTINCT DATE(created_at)) as unique_active_days,
       COUNT(*) as total_events,
       MAX(created_at) as last_event_at
     FROM tenant_activity_logs
     WHERE tenant_id = $1
       AND created_at >= NOW() - INTERVAL '1 day' * $2`,
    [tenantId, days]
  )
  return result.rows[0]
}

// ─── Get the most used module ───────────────────────────────────────
export async function getMostUsedModule(tenantId: string, days: number = 30) {
  const result = await query(
    `SELECT module, COUNT(*) as visits
     FROM tenant_activity_logs
     WHERE tenant_id = $1
       AND event_type = 'page_view'
       AND module IS NOT NULL
       AND created_at >= NOW() - INTERVAL '1 day' * $2
     GROUP BY module
     ORDER BY visits DESC
     LIMIT 1`,
    [tenantId, days]
  )
  return result.rows[0] || null
}

// ─── Get last_active_at from tenants table ──────────────────────────
export async function getLastActiveAt(tenantId: string): Promise<Date | null> {
  const result = await query(
    `SELECT last_active_at FROM tenants WHERE id = $1`,
    [tenantId]
  )
  return result.rows[0]?.last_active_at || null
}

// ─── Check if tenant is inactive (7+ days) ──────────────────────────
export async function isTenantInactive(tenantId: string): Promise<boolean> {
  const lastActive = await getLastActiveAt(tenantId)
  
  if (!lastActive) {
    // Never logged in before — not inactive (first login)
    return false
  }

  const now = new Date()
  const diff = now.getTime() - new Date(lastActive).getTime()
  const daysDiff = diff / (1000 * 60 * 60 * 24)
  
  return daysDiff >= 7
}

// ─── Cleanup old logs (retention policy) ────────────────────────────
export async function cleanupOldLogs(daysToKeep: number = 90) {
  const result = await query(
    `DELETE FROM tenant_activity_logs
     WHERE created_at < NOW() - INTERVAL '1 day' * $1`,
    [daysToKeep]
  )
  return result.rowCount || 0
}

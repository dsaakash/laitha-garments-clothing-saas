import { query } from './db'

export interface Lead {
  id: number
  name: string
  store_name: string
  phone: string
  city: string
  store_type: string
  monthly_revenue: string
  staff_count: string
  billing_software: string
  main_problem: string
  email: string
  status: 'new' | 'contacted' | 'converted' | 'rejected'
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateLeadData {
  name: string
  store_name: string
  phone: string
  city: string
  store_type?: string
  monthly_revenue?: string
  staff_count?: string
  billing_software?: string
  main_problem?: string
  email?: string
}

export async function createLead(data: CreateLeadData): Promise<Lead> {
  const result = await query(
    `INSERT INTO leads (
      name, store_name, phone, city,
      store_type, monthly_revenue, staff_count,
      billing_software, main_problem, email,
      status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *`,
    [
      data.name,
      data.store_name,
      data.phone,
      data.city,
      data.store_type || null,
      data.monthly_revenue || null,
      data.staff_count || null,
      data.billing_software || null,
      data.main_problem || null,
      data.email || null,
    ]
  )

  if (!result.rows || result.rows.length === 0) {
    throw new Error('Failed to create lead')
  }

  return result.rows[0]
}

export async function getAllLeads(): Promise<Lead[]> {
  const result = await query(
    'SELECT * FROM leads ORDER BY created_at DESC'
  )
  return result.rows || []
}

export async function updateLeadStatus(
  id: number,
  status: Lead['status'],
  notes?: string
): Promise<Lead | null> {
  const result = await query(
    `UPDATE leads SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING *`,
    [status, notes || null, id]
  )
  return result.rows?.[0] || null
}

export async function deleteLead(id: number): Promise<boolean> {
  const result = await query('DELETE FROM leads WHERE id = $1', [id])
  return (result.rowCount || 0) > 0
}

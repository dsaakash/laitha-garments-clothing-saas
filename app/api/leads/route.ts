import { NextRequest, NextResponse } from 'next/server'
import { createLead, getAllLeads, updateLeadStatus, deleteLead } from '@/lib/db-leads'
import { decodeBase64 } from '@/lib/utils'

// Public POST — save lead from landing page trial form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, store_name, phone, city, store_type, monthly_revenue, staff_count, billing_software, main_problem, email } = body

    if (!name || !phone || !city) {
      return NextResponse.json({ success: false, error: 'Name, phone, and city are required.' }, { status: 400 })
    }

    const lead = await createLead({
      name,
      store_name: store_name || '',
      phone,
      city,
      store_type,
      monthly_revenue,
      staff_count,
      billing_software,
      main_problem,
      email,
    })

    return NextResponse.json({ success: true, data: lead }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ success: false, error: 'Failed to save lead.' }, { status: 500 })
  }
}

// Superadmin GET — list all leads
export async function GET(request: NextRequest) {
  try {
    // Check auth
    const sessionCookie = request.cookies.get('admin_session')
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = decodeBase64(sessionCookie.value)
    const parts = decoded.split(':')
    const userType = parts[0]

    if (userType !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const leads = await getAllLeads()
    return NextResponse.json({ success: true, data: leads })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch leads.' }, { status: 500 })
  }
}

// PATCH — update lead status
export async function PATCH(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session')
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = decodeBase64(sessionCookie.value)
    const parts = decoded.split(':')
    const userType = parts[0]
    if (userType !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, notes } = body
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'id and status are required.' }, { status: 400 })
    }

    const updated = await updateLeadStatus(id, status, notes)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ success: false, error: 'Failed to update lead.' }, { status: 500 })
  }
}

// DELETE — delete a lead
export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session')
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = decodeBase64(sessionCookie.value)
    const parts = decoded.split(':')
    const userType = parts[0]
    if (userType !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required.' }, { status: 400 })
    }

    await deleteLead(parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete lead.' }, { status: 500 })
  }
}

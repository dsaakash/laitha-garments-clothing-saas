import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUserRole, hasPermission } from '@/lib/rbac'
import { decodeBase64 } from '@/lib/utils'

// Get all workflows
export async function GET(request: NextRequest) {
    try {
        const session = request.cookies.get('admin_session')
        if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

        // Check permission
        try {
            const decoded = decodeBase64(session.value)
            const adminId = parseInt(decoded.split(':')[1])
            const role = await getCurrentUserRole(adminId)

            if (!role || !hasPermission(role, 'workflow', 'read')) {
                return NextResponse.json({ success: false, message: 'Insufficient permissions' }, { status: 403 })
            }
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 })
        }

        const result = await query(
            `SELECT w.*, r.name as approver_role_name 
       FROM workflows w
       LEFT JOIN roles r ON w.approver_role_id = r.id
       ORDER BY w.created_at DESC`
        )

        return NextResponse.json({ success: true, workflows: result.rows })
    } catch (error) {
        console.error('Get workflows error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}

// Create new workflow rule
export async function POST(request: NextRequest) {
    try {
        const session = request.cookies.get('admin_session')
        if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

        // Check permission
        try {
            const decoded = decodeBase64(session.value)
            const adminId = parseInt(decoded.split(':')[1])
            const role = await getCurrentUserRole(adminId)

            if (!role || !hasPermission(role, 'workflow', 'write')) {
                return NextResponse.json({ success: false, message: 'Insufficient permissions' }, { status: 403 })
            }
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 })
        }

        const { module, trigger_type, trigger_value, action, approver_role_id } = await request.json()

        if (!module || !trigger_type || !action || !approver_role_id) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        const result = await query(
            `INSERT INTO workflows (module, trigger_type, trigger_value, action, approver_role_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [module, trigger_type, trigger_value || null, action, approver_role_id]
        )

        return NextResponse.json({ success: true, workflow: result.rows[0] })
    } catch (error) {
        console.error('Create workflow error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}

// Delete workflow rule
export async function DELETE(request: NextRequest) {
    try {
        const session = request.cookies.get('admin_session')
        if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

        // Check permission
        try {
            const decoded = decodeBase64(session.value)
            const adminId = parseInt(decoded.split(':')[1])
            const role = await getCurrentUserRole(adminId)

            if (!role || !hasPermission(role, 'workflow', 'delete')) {
                return NextResponse.json({ success: false, message: 'Insufficient permissions' }, { status: 403 })
            }
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 })

        await query('DELETE FROM workflows WHERE id = $1', [id])

        return NextResponse.json({ success: true, message: 'Workflow deleted' })
    } catch (error) {
        console.error('Delete workflow error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}

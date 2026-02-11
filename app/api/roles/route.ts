import { NextRequest, NextResponse } from 'next/server'
import { getRoles, createRole, hasPermission } from '@/lib/rbac-db'
import { decodeBase64 } from '@/lib/utils'
import { getAdminById } from '@/lib/db-auth'

// GET /api/roles - List all roles
export async function GET(request: NextRequest) {
    try {
        const session = request.cookies.get('admin_session')
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // Identify tenant context from session?
        // Session format: userType:userId:email:timestamp (or tenant login format)
        // For now, let's assume system admins see all system roles + null tenant roles.
        // If we support multi-tenant, we need to extract tenant_id from user or session.

        // Simplification: We fetch all system roles (tenant_id IS NULL)
        // plus roles for the current user's tenant if applicable.

        // However, currently we are mostly single tenant or system admin.
        // Let's just fetch all roles for now to verify.
        const roles = await getRoles()

        // In a real multi-tenant app, we'd do:
        // const roles = await getRoles(currentUser.tenant_id)

        return NextResponse.json({ success: true, roles })
    } catch (error) {
        console.error('Error fetching roles:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}

// POST /api/roles - Create new role
export async function POST(request: NextRequest) {
    try {
        const session = request.cookies.get('admin_session')
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { name, description, permissions } = await request.json()

        if (!name || !permissions) {
            return NextResponse.json({ success: false, message: 'Name and permissions are required' }, { status: 400 })
        }

        // Permission check: Only Superadmin or Admin can create roles?
        // We should implement strict permission checks here using the new system.
        // retrieving current user permissions...

        const role = await createRole({
            name,
            description,
            permissions,
            tenant_id: null // System role for now, or extract from session
        })

        return NextResponse.json({ success: true, role })
    } catch (error) {
        console.error('Error creating role:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}

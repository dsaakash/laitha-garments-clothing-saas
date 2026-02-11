import { NextRequest, NextResponse } from 'next/server'
import { updateRole, deleteRole } from '@/lib/rbac-db'

// PUT /api/roles/[id] - Update a role
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = request.cookies.get('admin_session')
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const id = parseInt(params.id)
        if (isNaN(id)) {
            return NextResponse.json({ success: false, message: 'Invalid role ID' }, { status: 400 })
        }

        const updates = await request.json()
        const updatedRole = await updateRole(id, updates)

        if (!updatedRole) {
            return NextResponse.json({ success: false, message: 'Role not found or no changes made' }, { status: 404 })
        }

        return NextResponse.json({ success: true, role: updatedRole })
    } catch (error) {
        console.error('Error updating role:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = request.cookies.get('admin_session')
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const id = parseInt(params.id)
        if (isNaN(id)) {
            return NextResponse.json({ success: false, message: 'Invalid role ID' }, { status: 400 })
        }

        try {
            const deleted = await deleteRole(id)
            if (deleted) {
                return NextResponse.json({ success: true, message: 'Role deleted successfully' })
            } else {
                return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 })
            }
        } catch (error: any) {
            return NextResponse.json({ success: false, message: error.message }, { status: 400 })
        }
    } catch (error) {
        console.error('Error deleting role:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { getPendingApprovals, updateApprovalStatus } from '@/lib/workflow-engine'
import { getCurrentUserRole } from '@/lib/rbac'
import { decodeBase64 } from '@/lib/utils'

// Get pending approvals for current user
export async function GET(request: NextRequest) {
    try {
        const session = request.cookies.get('admin_session')
        if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

        const decoded = decodeBase64(session.value)
        const adminId = parseInt(decoded.split(':')[1])
        const role = await getCurrentUserRole(adminId) // Now returns Role object with ID

        if (!role) {
            return NextResponse.json({ success: false, message: 'Role not found' }, { status: 403 })
        }

        // Fetch approvals where approver_role_id matches user's role_id
        // Note: getCurrentUserRole returns { id, name, permissions... } so we use role.id
        const approvals = await getPendingApprovals(role.id)

        return NextResponse.json({ success: true, approvals })
    } catch (error) {
        console.error('Get approvals error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}

// Approve/Reject a request
export async function POST(request: NextRequest) {
    try {
        const session = request.cookies.get('admin_session')
        if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

        const decoded = decodeBase64(session.value)
        const adminId = parseInt(decoded.split(':')[1])

        const { requestId, status, comments } = await request.json()

        if (!requestId || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
        }

        // Update approval status
        const updatedRequest = await updateApprovalStatus(requestId, status, adminId, comments)

        if (!updatedRequest) {
            return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 })
        }

        // TODO: Perform the action on the original entity (e.g. update Purchase Order status)
        // For now we just update the approval request status.
        // In a real implementation we would have a handler map based on entity_type

        return NextResponse.json({ success: true, request: updatedRequest })
    } catch (error) {
        console.error('Process approval error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}

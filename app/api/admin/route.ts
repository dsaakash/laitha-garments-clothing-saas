import { NextRequest, NextResponse } from 'next/server'
import { createAdmin, getAllAdmins, deleteAdmin, getAdminById, updateAdminRole, getAdminCount, getTenantAdminLimit } from '@/lib/db-auth'
import { verifyAdmin, getAdminByEmail } from '@/lib/db-auth'
import { getCurrentUserRole, hasPermission } from '@/lib/rbac'
import { decodeBase64 } from '@/lib/utils'

// Get all admins
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = request.cookies.get('admin_session')
    if (!session) {
      console.log('Admin API: No session found')
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    let tenantId: string | null | undefined
    let userType: string | undefined
    let adminId: number | undefined

    // Check if user has permission to view admins
    try {
      const decoded = decodeBase64(session.value)
      console.log('Admin API: Decoded session', decoded)

      const parts = decoded.split(':')
      userType = parts[0]
      adminId = parseInt(parts[1])

      // Extract tenantId if present (index 3)
      if (parts.length > 3 && parts[3] && parts[3] !== 'null') {
        tenantId = parts[3]
      }

      // Superadmins should see only System Admins (Lalitha Garments staff) by default
      // This prevents mixing Tenant Admins with System Admins
      if (userType === 'superadmin') {
        tenantId = null
      }

      console.log('Admin API: Parsed', { userType, adminId, tenantId })

      // Tenant owners have implicit permission for their own tenant
      if (userType === 'tenant') {
        // Proceed
      } else {
        if (isNaN(adminId)) {
          throw new Error('Invalid admin ID')
        }

        const role = await getCurrentUserRole(adminId)
        console.log('Admin API: User role', role)

        if (!role || !hasPermission(role, 'admins', 'read')) {
          console.log('Admin API: Insufficient permissions', { role })
          return NextResponse.json(
            { success: false, message: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }
    } catch (error) {
      console.error('Admin API: Session decode error', error)
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      )
    }

    const admins = await getAllAdmins(tenantId)
    let limit = 0

    if (userType === 'tenant' && tenantId) {
      limit = await getTenantAdminLimit(tenantId)
    }

    return NextResponse.json({
      success: true,
      admins,
      limit
    })
  } catch (error) {
    console.error('Get admins error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// Create new admin
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = request.cookies.get('admin_session')
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    let tenantId: string | undefined
    let userType: string = 'admin'

    // Check if user has permission to create admins
    try {
      const decoded = decodeBase64(session.value)
      const parts = decoded.split(':')
      userType = parts[0]
      const adminId = parseInt(parts[1])

      // Extract tenantId if present
      if (parts.length > 3 && parts[3] && parts[3] !== 'null') {
        tenantId = parts[3]
      }

      // Check Admin Limit for Tenants
      if (tenantId) {
        const currentCount = await getAdminCount(tenantId)
        const limit = await getTenantAdminLimit(tenantId)

        if (currentCount >= limit) {
          return NextResponse.json(
            { success: false, message: `Admin limit reached (${currentCount}/${limit}). Upgrade your plan to add more.` },
            { status: 403 }
          )
        }
      }

      if (userType === 'tenant') {
        // Tenant owners allowed
      } else {
        const role = await getCurrentUserRole(adminId)

        if (!role || !hasPermission(role, 'admins', 'write')) {
          return NextResponse.json(
            { success: false, message: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      )
    }

    const { email, password, name, role, roleId } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Prevent non-superadmins from creating superadmins
    if (role === 'superadmin' && userType !== 'superadmin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to create Superadmin' },
        { status: 403 }
      )
    }

    // Validate role
    const validRole = role && ['superadmin', 'admin', 'user'].includes(role) ? role : 'admin'

    // Check if admin already exists
    const existing = await getAdminByEmail(email)
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Admin with this email already exists' },
        { status: 400 }
      )
    }

    const admin = await createAdmin(
      email,
      password,
      name,
      validRole as 'superadmin' | 'admin' | 'user',
      roleId ? parseInt(roleId) : undefined,
      tenantId
    )

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        role_id: admin.role_id,
        tenant_id: admin.tenant_id
      }
    })
  } catch (error: any) {
    console.error('Create admin error:', error)

    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { success: false, message: 'Admin with this email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// Delete admin
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const session = request.cookies.get('admin_session')
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    let userType = 'admin'

    // Check if user has permission to delete admins
    try {
      const decoded = decodeBase64(session.value)
      const parts = decoded.split(':')
      userType = parts[0]
      const adminId = parseInt(parts[1])

      if (userType === 'tenant') {
        // Tenant Owner allowed
      } else {
        const role = await getCurrentUserRole(adminId)

        if (!role || !hasPermission(role, 'admins', 'delete')) {
          return NextResponse.json(
            { success: false, message: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Admin ID is required' },
        { status: 400 }
      )
    }

    const adminIdToDelete = parseInt(id)

    // Prevent deleting yourself
    try {
      const decoded = decodeBase64(session.value)
      const parts = decoded.split(':')
      const currentAdminId = parseInt(parts[1])
      if (currentAdminId === adminIdToDelete) {
        return NextResponse.json(
          { success: false, message: 'Cannot delete your own account' },
          { status: 400 }
        )
      }
    } catch (error) {
      // Ignore if session decode fails
    }

    const deleted = await deleteAdmin(adminIdToDelete)

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Admin deleted successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Delete admin error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// Update admin role
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const session = request.cookies.get('admin_session')
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    let userType = 'admin'

    // Check if user has permission to update admins
    try {
      const decoded = decodeBase64(session.value)
      const parts = decoded.split(':')
      userType = parts[0]
      const adminId = parseInt(parts[1])

      if (userType === 'tenant') {
        // Tenant owner allowed
      } else {
        const role = await getCurrentUserRole(adminId)

        if (!role || !hasPermission(role, 'admins', 'write')) {
          return NextResponse.json(
            { success: false, message: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      )
    }

    const { id, role, roleId } = await request.json()

    if (!id || !role) {
      return NextResponse.json(
        { success: false, message: 'Admin ID and role are required' },
        { status: 400 }
      )
    }

    // Prevent setting superadmin if not superadmin
    if (role === 'superadmin' && userType !== 'superadmin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to assign Superadmin role' },
        { status: 403 }
      )
    }

    if (!['superadmin', 'admin', 'user'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      )
    }

    const updated = await updateAdminRole(
      parseInt(id),
      role as 'superadmin' | 'admin' | 'user',
      roleId ? parseInt(roleId) : undefined
    )

    if (updated) {
      return NextResponse.json({
        success: true,
        message: 'Admin role updated successfully',
        admin: updated
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Update admin error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

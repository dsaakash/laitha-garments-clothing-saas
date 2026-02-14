import { NextRequest, NextResponse } from 'next/server'
import { createUser, getAllUsers, deleteUser, getUserById } from '@/lib/db-auth'
import { getUserByEmail } from '@/lib/db-auth'
import { getCurrentUserRole, hasPermission } from '@/lib/rbac'
import { getTenantContext } from '@/lib/tenant-context'

// Get all users
export async function GET(request: NextRequest) {
  try {
    const context = getTenantContext(request)

    // Verify permission
    const session = request.cookies.get('admin_session')
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const users = await getAllUsers(context.isSuperAdmin ? null : context.tenantId)
    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

// Create new user
export async function POST(request: NextRequest) {
  try {
    const context = getTenantContext(request)
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 })
    }

    // Check if user already exists
    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 400 })
    }

    const user = await createUser(email, password, name, context.isTenant ? context.tenantId! : undefined)

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 })
  }
}

// Delete user
export async function DELETE(request: NextRequest) {
  try {
    const context = getTenantContext(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 })
    }

    const userId = parseInt(id)
    const user = await getUserById(userId)

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Isolate deletion: can only delete users from your own tenant
    if (!context.isSuperAdmin && user.tenant_id !== context.tenantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    if (context.isSuperAdmin && user.tenant_id !== null) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const deleted = await deleteUser(userId)
    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

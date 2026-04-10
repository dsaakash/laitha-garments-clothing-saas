export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { decodeBase64 } from '@/lib/utils'
import { getAdminById, getUserById } from '@/lib/db-auth'
import { getTenantById } from '@/lib/db-tenants'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session')

    if (!sessionCookie) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    // Decode session token
    const decoded = decodeBase64(sessionCookie.value)
    console.log('Session decoded:', decoded)

    const parts = decoded.split(':')
    if (parts.length < 3) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    const userType = parts[0] // 'superadmin', 'tenant', 'user'
    const userId = parts[1]
    const email = parts[2]
    const tenantId = parts.length > 4 ? parts[3] : null

    let admin: any = null

    // Handle different user types
    if (userType === 'tenant') {
      // For tenants, get from tenants table
      if (tenantId) {
        const tenant = await getTenantById(tenantId)
        if (tenant) {
          admin = {
            id: 0,
            name: tenant.owner_name,
            email: tenant.owner_email,
            role: 'admin',
            type: 'tenant',
            tenant_id: tenantId,
            modules: tenant.modules || [],
            permissions: { '*': ['manage'] }
          }
        }
      }
    } else if (userType === 'superadmin' || userType === 'admin') {
      // Admin from admin table (Superadmin or Tenant Sub-admin)
      const userIdNum = parseInt(userId)
      if (!isNaN(userIdNum)) {
        admin = await getAdminById(userIdNum)
        if (admin) {
          admin.type = userType
          // For superadmin, tenant_id should be null. For admin, it should be whatever is in the DB.
          if (userType === 'superadmin') {
            admin.tenant_id = null
          }
          admin.permissions = admin.role_permissions || {}
          // Use dynamic role name if available, else fallback to legacy
          if (admin.role_name) {
            admin.role = admin.role_name.toLowerCase().replace(' ', '')
          }
        }
      }
    } else if (userType === 'user') {
      // Regular user from users table
      const userIdNum = parseInt(userId)
      if (!isNaN(userIdNum)) {
        admin = await getUserById(userIdNum)
        if (admin) {
          admin.type = 'user'
          admin.tenant_id = null
          admin.permissions = admin.role_permissions || {}
          if (admin.role_name) {
            admin.role = admin.role_name.toLowerCase().replace(' ', '')
          }
        }
      }
    }

    if (!admin) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      admin
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }
}

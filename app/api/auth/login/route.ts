import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, verifyUser } from '@/lib/db-auth'
import { verifyTenant } from '@/lib/db-tenants'
import { encodeBase64, getNodeEnv } from '@/lib/utils'
import { isTenantInactive, logActivity } from '@/lib/db-activity'

export async function POST(request: NextRequest) {
  try {
    const { email, password, loginType } = await request.json()

    console.log('API ROUTE process.env.DATABASE_URL is:', process.env.DATABASE_URL ? 'SET' : 'UNDEFINED')

    console.log('🔐 Login attempt:', { email, loginType, passwordLength: password?.length })

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!loginType || !['business', 'admin', 'user'].includes(loginType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid login type' },
        { status: 400 }
      )
    }

    let authenticated = false
    let userData = null
    let userType = loginType
    let tenantId: string | null = null

    // Check credentials based on selected tab
    switch (loginType) {
      case 'business':
        // Check tenants table (Owners)
        console.log('🏢 Checking business credentials for:', email)
        const tenant = await verifyTenant(email, password)
        console.log('🏢 Tenant owner found:', tenant ? `Yes (ID: ${tenant.id})` : 'No')

        if (tenant) {
          // Check 7-day inactivity lock
          const inactive = await isTenantInactive(tenant.id)
          if (inactive) {
            console.log('🔒 Tenant locked due to inactivity:', tenant.id)
            return NextResponse.json(
              {
                success: false,
                message: 'Your account has been suspended due to inactivity. Please contact +919353083597 to reactivate.',
                locked: true
              },
              { status: 403 }
            )
          }

          authenticated = true
          userData = {
            id: 0, // Tenant owners don't have numeric IDs in admins table
            name: tenant.owner_name,
            email: tenant.owner_email,
            role: 'admin'
          }
          tenantId = tenant.id
          userType = 'tenant'
        } else {
          // Check admins table (Tenant Sub-admins)
          console.log('🏢 Checking sub-admin credentials for:', email)
          const subAdmin = await verifyAdmin(email, password)
          if (subAdmin && subAdmin.tenant_id) {
            // Also check inactivity for sub-admins of this tenant
            const inactive = await isTenantInactive(subAdmin.tenant_id)
            if (inactive) {
              console.log('🔒 Tenant sub-admin locked due to inactivity:', subAdmin.tenant_id)
              return NextResponse.json(
                {
                  success: false,
                  message: 'Your account has been suspended due to inactivity. Please contact +919353083597 to reactivate.',
                  locked: true
                },
                { status: 403 }
              )
            }

            console.log('🏢 Sub-admin found for tenant:', subAdmin.tenant_id)
            authenticated = true
            userData = subAdmin
            tenantId = subAdmin.tenant_id
            userType = 'admin' // Tenant sub-admins use 'admin' type
          }
        }
        break

      case 'admin':
        // Check admin table (Super admins only)
        console.log('👑 Checking admin credentials for:', email)
        const admin = await verifyAdmin(email, password)
        console.log('👑 Admin found:', admin ? 'Yes' : 'No')

        // Super admins have no tenant_id
        if (admin && !admin.tenant_id) {
          authenticated = true
          userData = admin
          userType = 'superadmin'
        } else if (admin && admin.tenant_id) {
          console.log('⚠️ Sub-admin tried to login via Superadmin tab')
          // Force them to use Business tab
          return NextResponse.json(
            { success: false, message: 'Please use the Business tab to login' },
            { status: 401 }
          )
        }
        break

      case 'user':
        // Check users table (Lalitha Garments staff)
        console.log('👤 Checking user credentials for:', email)
        const user = await verifyUser(email, password)
        console.log('👤 User found:', user ? 'Yes' : 'No')
        if (user) {
          authenticated = true
          userData = user
          userType = 'user'
        }
        break
    }

    if (!authenticated || !userData) {
      console.log('❌ Authentication failed for:', email, 'via', loginType, 'tab')
      return NextResponse.json(
        { success: false, message: 'Invalid credentials for selected login type' },
        { status: 401 }
      )
    }

    // Create session token with tenant_id if business login
    const sessionData = tenantId
      ? `${userType}:${userData.id}:${email}:${tenantId}:${Date.now()}`
      : `${userType}:${userData.id}:${email}:${Date.now()}`

    const sessionToken = encodeBase64(sessionData)

    console.log('✅ Login successful:', { email, userType, tenantId })

    // Log login activity for tenants
    if (tenantId) {
      try {
        await logActivity(tenantId, email, 'login', 'auth', {
          userType,
          userAgent: request.headers.get('user-agent') || 'unknown',
          loginMethod: loginType,
        })
      } catch (e) {
        console.error('Failed to log login activity:', e)
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      admin: {
        ...userData,
        type: userType,
        tenant_id: tenantId
      }
    })

    // Set cookie for session
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: getNodeEnv() === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    console.error('💥 Login error:', error)

    // Provide more specific error messages for debugging
    let errorMessage = 'Server error'
    if (error instanceof Error) {
      if (error.message.includes('DATABASE_URL')) {
        errorMessage = 'Database configuration error. Please check your environment variables.'
      } else if (error.message.includes('connect') || error.message.includes('connection')) {
        errorMessage = 'Database connection error. Please check your database settings.'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, verifyUser } from '@/lib/db-auth'
import { verifyTenant } from '@/lib/db-tenants'
import { encodeBase64, getNodeEnv } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password, loginType } = await request.json()

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
        // Check tenants table
        console.log('🏢 Checking business credentials for:', email)
        const tenant = await verifyTenant(email, password)
        console.log('🏢 Tenant found:', tenant ? `Yes (ID: ${tenant.id})` : 'No')
        if (tenant) {
          authenticated = true
          userData = {
            id: 0, // Tenant admins don't have numeric IDs
            name: tenant.owner_name,
            email: tenant.owner_email,
            role: 'admin'
          }
          tenantId = tenant.id
          userType = 'tenant'
        }
        break

      case 'admin':
        // Check admin table (super admin from database)
        console.log('👑 Checking admin credentials for:', email)
        const admin = await verifyAdmin(email, password)
        console.log('👑 Admin found:', admin ? 'Yes' : 'No')
        if (admin) {
          authenticated = true
          userData = admin
          userType = 'superadmin'
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

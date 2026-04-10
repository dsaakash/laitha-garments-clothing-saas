import { NextRequest, NextResponse } from 'next/server'
import { decodeBase64 } from '@/lib/utils'
import { logActivity } from '@/lib/db-activity'

// Map URL paths to module names
function getModuleFromPath(path: string): string {
  const segments = path.split('/').filter(Boolean)
  // Expected format: /admin/[module]/...
  if (segments.length >= 2 && segments[0] === 'admin') {
    return segments[1] // e.g., 'inventory', 'sales', 'dashboard'
  }
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session')
    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    const decoded = decodeBase64(sessionCookie.value)
    const parts = decoded.split(':')
    
    const userType = parts[0]
    const email = parts[2]
    const tenantId = parts.length > 4 ? parts[3] : null

    // Only track activity for tenant users (business owners + sub-admins)
    if (!tenantId || (userType !== 'tenant' && userType !== 'admin')) {
      return NextResponse.json({ success: true, tracked: false })
    }

    const body = await request.json()
    const { page, action } = body
    
    const module = getModuleFromPath(page || '')
    const eventType = action === 'login' ? 'login' : 'page_view'

    await logActivity(tenantId, email, eventType as any, module, {
      page,
      action: action || 'view',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, tracked: true })
  } catch (error) {
    console.error('Activity tracking error:', error)
    // Don't fail silently — but also don't block the user
    return NextResponse.json({ success: true, tracked: false })
  }
}

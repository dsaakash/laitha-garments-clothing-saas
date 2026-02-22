import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pages that are always accessible even with an expired subscription
const PUBLIC_PATHS = [
  '/admin/login',
  '/trial-expired',
  '/subscription-expired',
]

// API routes that must also be reachable regardless of subscription
// (auth, subscription-check itself, logout)
const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/check',
  '/api/auth/subscription-status',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Always skip static assets ──────────────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // ── 2. Always allow public paths & public API routes ──────────────
  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next()
  }

  // ── 3. Extract session cookie ──────────────────────────────────────
  const sessionCookie = request.cookies.get('admin_session')

  // Redirect unauthenticated users trying to access /admin/*
  if (!sessionCookie && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Redirect already-logged-in users away from login page
  if (sessionCookie && pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // ── 4. Decode session and set context headers ──────────────────────
  if (sessionCookie) {
    try {
      const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      const parts = decoded.split(':')
      const response = NextResponse.next()

      if (parts.length >= 3) {
        const userType = parts[0]   // 'tenant' | 'superadmin' | 'admin' | 'user'
        const tenantId = parts.length > 4 ? parts[3] : null

        response.headers.set('x-user-type', userType)
        if (tenantId) {
          response.headers.set('x-tenant-id', tenantId)
        }

        // ── 5. Subscription enforcement FOR TENANT pages only ─────────
        //
        // Superadmins + internal Lalitha Garments users are never blocked.
        // Only 'tenant' and 'admin' (tenant sub-admin) sessions are checked.
        //
        // We only block admin page navigation (not API calls) here —
        // API routes rely on the /api/auth/subscription-status endpoint
        // which individual pages / components call.
        if (
          (userType === 'tenant' || userType === 'admin') &&
          tenantId &&
          pathname.startsWith('/admin') &&
          !pathname.startsWith('/admin/login')
        ) {
          // Call our own subscription-status API to decide
          const statusUrl = new URL('/api/auth/subscription-status', request.url)

          // Forward the session cookie to the internal API call
          const statusRes = await fetch(statusUrl.toString(), {
            headers: {
              cookie: `admin_session=${sessionCookie.value}`,
            },
          })

          if (statusRes.ok) {
            const statusData = await statusRes.json()

            // Block access if subscription is not active
            if (statusData.success && !statusData.isActive) {
              const expiredUrl = new URL('/subscription-expired', request.url)
              return NextResponse.redirect(expiredUrl)
            }
          }
        }

        return response
      }
    } catch (error) {
      console.error('Middleware session decode error:', error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

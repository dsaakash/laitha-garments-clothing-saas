import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files, API routes, and public pages
  if (pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/admin/login' ||
    pathname === '/trial-expired' ||
    pathname === '/subscription-expired') {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('admin_session')

  if (!sessionCookie && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (sessionCookie && pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Extract tenant context and add to headers
  if (sessionCookie) {
    try {
      // Decode session to extract tenant info
      const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      const parts = decoded.split(':')
      const response = NextResponse.next()

      if (parts.length >= 3) {
        const userType = parts[0] // 'tenant', 'superadmin', 'admin', 'user'
        const tenantId = parts.length > 4 ? parts[3] : null

        // Add tenant context to request headers for API routes
        response.headers.set('x-user-type', userType)

        if (tenantId) {
          response.headers.set('x-tenant-id', tenantId)
        }
      }

      return response
    } catch (error) {
      console.error('Middleware session decode error:', error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

'use client'

import { useEffect, useRef } from 'react'

/**
 * Hook that tracks tenant page navigations by posting to `/api/activity/track`.
 * Only fires for tenant users (role = admin with a tenantId).
 */
export function useActivityTracker(
  pathname: string,
  tenantId: string | null,
  userRole: string | null
) {
  const lastTrackedPath = useRef<string>('')

  useEffect(() => {
    // Only track for tenant users
    if (!tenantId || userRole !== 'admin') return

    // Don't re-track the same path
    if (pathname === lastTrackedPath.current) return
    lastTrackedPath.current = pathname

    // Fire-and-forget — don't block or error the UI
    const controller = new AbortController()
    
    fetch('/api/activity/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      signal: controller.signal,
      body: JSON.stringify({
        page: pathname,
        action: 'view',
      }),
    }).catch(() => {
      // Silently ignore tracking failures
    })

    return () => {
      controller.abort()
    }
  }, [pathname, tenantId, userRole])
}

import { NextRequest, NextResponse } from 'next/server'
import {
  getLoginHistory,
  getModuleUsage,
  getActivityTimeline,
  getActivitySummary,
  getMostUsedModule,
  getLastActiveAt,
} from '@/lib/db-activity'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30')

    const [summary, moduleUsage, timeline, loginHistory, topModule, lastActive] = await Promise.all([
      getActivitySummary(tenantId, days),
      getModuleUsage(tenantId, days),
      getActivityTimeline(tenantId, days),
      getLoginHistory(tenantId, days),
      getMostUsedModule(tenantId, days),
      getLastActiveAt(tenantId),
    ])

    // Calculate days since last activity
    let daysSinceActive: number | null = null
    if (lastActive) {
      const diff = new Date().getTime() - new Date(lastActive).getTime()
      daysSinceActive = Math.floor(diff / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      success: true,
      analytics: {
        summary: {
          totalLogins: parseInt(summary?.total_logins || '0'),
          uniqueActiveDays: parseInt(summary?.unique_active_days || '0'),
          totalEvents: parseInt(summary?.total_events || '0'),
          lastEventAt: summary?.last_event_at || null,
        },
        topModule: topModule ? { name: topModule.module, visits: parseInt(topModule.visits) } : null,
        moduleUsage: moduleUsage.map((m: any) => ({
          module: m.module,
          visits: parseInt(m.visits),
        })),
        timeline: timeline.map((t: any) => ({
          date: t.date,
          count: parseInt(t.count),
        })),
        loginHistory: loginHistory.map((l: any) => ({
          email: l.user_email,
          metadata: l.metadata,
          timestamp: l.created_at,
        })),
        lastActive,
        daysSinceActive,
        isInactive: daysSinceActive !== null && daysSinceActive >= 7,
      },
    })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

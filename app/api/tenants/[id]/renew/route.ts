import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantById } from '@/lib/db-tenants'

/**
 * POST /api/tenants/[id]/renew
 *
 * Called by Superadmin to renew / activate a tenant's subscription.
 *
 * Body:
 *   plan           – 'basic' | 'premium' | 'enterprise'
 *   billingCycle   – 'monthly' | 'yearly' | 'custom'
 *   monthlyRevenue – custom price in ₹ (optional override)
 *   customEndDate  – ISO date string (required when billingCycle === 'custom')
 *
 * Auto-calculation logic (monthly / yearly):
 *   - If tenant has a future expiry, extend FROM that date (early renewal)
 *   - Otherwise extend from today
 *
 * Custom date logic:
 *   - Use the exact date the superadmin chose (no auto-extension)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { plan, billingCycle, monthlyRevenue, customEndDate } = body

        if (!plan || !billingCycle) {
            return NextResponse.json(
                { success: false, message: 'plan and billingCycle are required' },
                { status: 400 }
            )
        }

        if (billingCycle === 'custom' && !customEndDate) {
            return NextResponse.json(
                { success: false, message: 'customEndDate is required when billingCycle is custom' },
                { status: 400 }
            )
        }

        const tenant = await getTenantById(params.id)
        if (!tenant) {
            return NextResponse.json(
                { success: false, message: 'Tenant not found' },
                { status: 404 }
            )
        }

        const now = new Date()
        let newEndDate: Date

        if (billingCycle === 'custom') {
            // Use exact date chosen by superadmin
            newEndDate = new Date(customEndDate)
            if (isNaN(newEndDate.getTime())) {
                return NextResponse.json(
                    { success: false, message: 'Invalid customEndDate' },
                    { status: 400 }
                )
            }
            if (newEndDate <= now) {
                return NextResponse.json(
                    { success: false, message: 'Custom end date must be in the future' },
                    { status: 400 }
                )
            }
        } else {
            // Auto-calculate: extend from existing future expiry (early renewal) or from today
            const startBase =
                tenant.subscription_end_date &&
                    new Date(tenant.subscription_end_date) > now
                    ? new Date(tenant.subscription_end_date)
                    : now

            newEndDate = new Date(startBase)
            if (billingCycle === 'yearly') {
                newEndDate.setFullYear(newEndDate.getFullYear() + 1)
            } else {
                // monthly
                newEndDate.setMonth(newEndDate.getMonth() + 1)
            }
        }

        // Persist billing_cycle as 'monthly' or 'yearly' for DB enum compatibility.
        // For custom, store the cycle that most closely matches the duration, or 'monthly' as default.
        const dbBillingCycle = billingCycle === 'yearly' ? 'yearly' : 'monthly'

        const result = await query(
            `UPDATE tenants SET
                plan                    = $1,
                billing_cycle           = $2,
                monthly_revenue         = $3,
                status                  = 'active',
                subscription_status     = 'active',
                subscription_start_date = $4,
                subscription_end_date   = $5,
                updated_at              = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING *`,
            [
                plan,
                dbBillingCycle,
                monthlyRevenue ?? tenant.monthly_revenue ?? 0,
                now.toISOString(),
                newEndDate.toISOString(),
                params.id,
            ]
        )

        if (!result.rows.length) {
            return NextResponse.json(
                { success: false, message: 'Failed to renew subscription' },
                { status: 500 }
            )
        }

        const updated = result.rows[0]

        const formattedEnd = newEndDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })

        return NextResponse.json({
            success: true,
            message: `Subscription renewed successfully until ${formattedEnd}`,
            data: {
                id: updated.id,
                plan: updated.plan,
                billingCycle: updated.billing_cycle,
                status: updated.status,
                subscriptionStatus: updated.subscription_status,
                subscriptionStartDate: updated.subscription_start_date,
                subscriptionEndDate: updated.subscription_end_date,
                monthlyRevenue: parseFloat(updated.monthly_revenue || 0),
            },
        })
    } catch (error) {
        console.error('Error renewing subscription:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to renew subscription' },
            { status: 500 }
        )
    }
}

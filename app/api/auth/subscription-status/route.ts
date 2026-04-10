export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

/**
 * GET /api/auth/subscription-status
 *
 * Called by the tenant's frontend (middleware + dashboard) to check whether
 * the currently logged-in tenant's subscription is active or expired.
 *
 * Returns:
 *   isActive       – can the tenant use the system?
 *   daysRemaining  – days until expiry (null if no date set)
 *   plan           – current plan
 *   billingCycle   – 'monthly' | 'yearly'
 *   subscriptionEndDate – ISO date string
 *   status         – 'active' | 'trial' | 'expired' | 'cancelled' | 'suspended'
 *   showRenewalBanner – true if < 7 days remaining
 */
export async function GET(request: NextRequest) {
    try {
        const context = getTenantContext(request)

        // Only tenants use this endpoint; superadmins are always allowed
        if (context.isSuperAdmin) {
            return NextResponse.json({ success: true, isActive: true, status: 'superadmin' })
        }

        if (!context.tenantId) {
            return NextResponse.json(
                { success: false, message: 'Not authenticated' },
                { status: 401 }
            )
        }

        const result = await query(
            `SELECT
          id, status, plan, billing_cycle,
          subscription_status, subscription_start_date, subscription_end_date,
          trial_start_date, trial_end_date
       FROM tenants WHERE id = $1`,
            [context.tenantId]
        )

        if (!result.rows.length) {
            return NextResponse.json(
                { success: false, message: 'Tenant not found' },
                { status: 404 }
            )
        }

        const tenant = result.rows[0]
        const now = new Date()

        // ----------------------------------------------------------------
        // Determine effective access status
        // ----------------------------------------------------------------
        let isActive = false
        let effectiveStatus: string = tenant.status
        let daysRemaining: number | null = null
        let showRenewalBanner = false

        if (tenant.status === 'cancelled' || tenant.status === 'suspended') {
            // Hard block – admin explicitly cancelled or suspended
            isActive = false
            effectiveStatus = tenant.status

        } else if (tenant.status === 'trial') {
            // --- Trial logic ---
            const trialEnd = tenant.trial_end_date ? new Date(tenant.trial_end_date) : null
            if (trialEnd) {
                const msLeft = trialEnd.getTime() - now.getTime()
                daysRemaining = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
                if (daysRemaining > 0) {
                    isActive = true
                    effectiveStatus = 'trial'
                    showRenewalBanner = daysRemaining <= 7
                } else {
                    isActive = false
                    effectiveStatus = 'expired'
                }
            } else {
                // No trial end date — grant access (legacy)
                isActive = true
                effectiveStatus = 'trial'
            }

        } else if (tenant.status === 'active') {
            // --- Paid subscription logic ---
            const subEnd = tenant.subscription_end_date
                ? new Date(tenant.subscription_end_date)
                : null

            if (subEnd) {
                const msLeft = subEnd.getTime() - now.getTime()
                daysRemaining = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

                if (daysRemaining > 0) {
                    isActive = true
                    effectiveStatus = 'active'
                    showRenewalBanner = daysRemaining <= 7  // Warn 7 days before expiry
                } else {
                    // Subscription end date has passed → BLOCK access
                    isActive = false
                    effectiveStatus = 'expired'

                    // Also update tenant status to reflect expiry (idempotent)
                    await query(
                        `UPDATE tenants
             SET subscription_status = 'past_due', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND subscription_status != 'past_due'`,
                        [context.tenantId]
                    )
                }
            } else {
                // Active but no end date set → legacy active, allow access
                isActive = true
                effectiveStatus = 'active'
            }
        }

        return NextResponse.json({
            success: true,
            isActive,
            status: effectiveStatus,
            plan: tenant.plan,
            billingCycle: tenant.billing_cycle,
            subscriptionEndDate: tenant.subscription_end_date,
            trialEndDate: tenant.trial_end_date,
            daysRemaining,
            showRenewalBanner,
        })

    } catch (error) {
        console.error('Error checking subscription status:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to check subscription status' },
            { status: 500 }
        )
    }
}

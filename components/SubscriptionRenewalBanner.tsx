'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X, MessageCircle } from 'lucide-react'

/**
 * SubscriptionRenewalBanner
 *
 * Shown at the top of every tenant admin page when subscription is about
 * to expire (≤ 7 days remaining). Fetches status from the server.
 */
export default function SubscriptionRenewalBanner() {
    const [banner, setBanner] = useState<{
        visible: boolean
        daysRemaining: number | null
        plan: string
        billingCycle: string
        endDate: string | null
    }>({ visible: false, daysRemaining: null, plan: '', billingCycle: '', endDate: null })

    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch('/api/auth/subscription-status')
                const data = await res.json()
                if (
                    data.success &&
                    data.isActive &&
                    data.showRenewalBanner &&
                    data.daysRemaining !== null
                ) {
                    setBanner({
                        visible: true,
                        daysRemaining: data.daysRemaining,
                        plan: data.plan || '',
                        billingCycle: data.billingCycle || 'monthly',
                        endDate: data.subscriptionEndDate || data.trialEndDate || null,
                    })
                }
            } catch {
                // Silently ignore
            }
        }
        check()
    }, [])

    if (!banner.visible || dismissed) return null

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })

    const whatsappMsg = encodeURIComponent(
        `Hi, I want to renew my subscription before it expires.\n\nPlan: ${banner.plan} (${banner.billingCycle})\nExpires on: ${banner.endDate ? formatDate(banner.endDate) : 'soon'}`
    )

    const isUrgent = (banner.daysRemaining ?? 99) <= 3

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium w-full ${isUrgent
                    ? 'bg-red-50 text-red-800 border-b border-red-200'
                    : 'bg-amber-50 text-amber-800 border-b border-amber-200'
                }`}
        >
            <AlertTriangle
                className={`w-4 h-4 flex-shrink-0 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}
            />

            <span className="flex-1">
                {banner.daysRemaining === 0
                    ? 'Your subscription expires today!'
                    : `Your subscription expires in ${banner.daysRemaining} day${banner.daysRemaining === 1 ? '' : 's'}`}
                {banner.endDate && ` (${formatDate(banner.endDate)})`}. Renew now to avoid interruption.
            </span>

            <a
                href={`https://wa.me/919353083597?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-semibold transition-colors ${isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
            >
                <MessageCircle className="w-3 h-3" />
                Renew Now
            </a>

            <button
                onClick={() => setDismissed(true)}
                className="text-gray-400 hover:text-gray-600 ml-1"
                aria-label="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

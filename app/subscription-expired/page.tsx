'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, MessageCircle, LogOut, AlertCircle, Calendar, Clock, RefreshCw } from 'lucide-react'

interface SubscriptionInfo {
    plan: string
    billingCycle: string
    subscriptionEndDate: string | null
    trialEndDate: string | null
    daysRemaining: number | null
    status: string
}

export default function SubscriptionExpiredPage() {
    const router = useRouter()
    const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [checking, setChecking] = useState(false)

    useEffect(() => {
        loadSubscriptionInfo()
    }, [])

    const loadSubscriptionInfo = async () => {
        try {
            const res = await fetch('/api/auth/subscription-status')
            const data = await res.json()
            if (data.success) {
                setSubInfo({
                    plan: data.plan,
                    billingCycle: data.billingCycle,
                    subscriptionEndDate: data.subscriptionEndDate,
                    trialEndDate: data.trialEndDate,
                    daysRemaining: data.daysRemaining,
                    status: data.status,
                })

                // If somehow active now (admin renewed), redirect to dashboard
                if (data.isActive) {
                    router.push('/admin/dashboard')
                    return
                }
            }
        } catch (error) {
            console.error('Error loading subscription info:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCheckRenewal = async () => {
        setChecking(true)
        try {
            const res = await fetch('/api/auth/subscription-status')
            const data = await res.json()
            if (data.success && data.isActive) {
                // Admin has renewed — redirect to dashboard
                router.push('/admin/dashboard')
            } else {
                alert('Your subscription is still expired. Please contact us to renew.')
            }
        } catch {
            alert('Could not check status. Please try again.')
        } finally {
            setChecking(false)
        }
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/admin/login')
        } catch {
            router.push('/admin/login')
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return null
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    const expiredDate = formatDate(subInfo?.subscriptionEndDate ?? subInfo?.trialEndDate ?? null)
    const planLabel = subInfo?.plan
        ? subInfo.plan.charAt(0).toUpperCase() + subInfo.plan.slice(1)
        : null
    const cycleLabel = subInfo?.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'
    const isTrial = subInfo?.status === 'trial' || (!subInfo?.subscriptionEndDate && subInfo?.trialEndDate)

    const whatsappMessage = encodeURIComponent(
        `Hi, I want to renew my subscription.\n\nPlan: ${planLabel || 'N/A'} (${cycleLabel})\nExpired on: ${expiredDate || 'N/A'}\n\nPlease help me renew.`
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 px-8 py-6 text-white text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">
                            {isTrial ? 'Trial Period Ended' : 'Subscription Expired'}
                        </h1>
                        <p className="text-red-100 text-sm mt-1">
                            {isTrial
                                ? 'Your 14-day free trial has ended'
                                : 'Your subscription period has ended'}
                        </p>
                    </div>

                    <div className="p-8">
                        {/* Subscription Details */}
                        {!loading && subInfo && (
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                                {planLabel && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Plan</span>
                                        <span className="font-semibold text-gray-900">
                                            {planLabel} — {cycleLabel}
                                        </span>
                                    </div>
                                )}
                                {expiredDate && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {isTrial ? 'Trial ended on' : 'Expired on'}
                                        </span>
                                        <span className="font-semibold text-red-600">{expiredDate}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Message */}
                        <div className="text-center mb-6">
                            <p className="text-gray-600 leading-relaxed">
                                {isTrial
                                    ? 'Your free trial has ended. Subscribe to a plan to continue using the software.'
                                    : `Your ${cycleLabel.toLowerCase()} subscription has expired. Please renew to continue using the platform without interruption.`}
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="space-y-3 mb-6">
                            {/* WhatsApp Renew */}
                            <a
                                href={`https://wa.me/919353083597?text=${whatsappMessage}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                <span>WhatsApp to Renew Now</span>
                            </a>

                            {/* Phone Call */}
                            <a
                                href="tel:+919353083597"
                                className="flex items-center justify-center gap-3 w-full bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold px-6 py-3.5 rounded-xl transition-colors"
                            >
                                <Phone className="w-5 h-5 text-blue-600" />
                                <span>Call Us: +91 93530 83597</span>
                            </a>

                            {/* I've Already Renewed */}
                            <button
                                onClick={handleCheckRenewal}
                                disabled={checking}
                                className="flex items-center justify-center gap-3 w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold px-6 py-3.5 rounded-xl transition-colors disabled:opacity-60"
                            >
                                {checking
                                    ? <RefreshCw className="w-5 h-5 animate-spin" />
                                    : <Clock className="w-5 h-5" />}
                                <span>{checking ? 'Checking...' : "I've already renewed — Check Access"}</span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 pt-4">
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info text */}
                <p className="text-center text-gray-400 text-xs mt-4">
                    Contact us to reactivate your account. Your data is safe and will be restored upon renewal.
                </p>
            </div>
        </div>
    )
}

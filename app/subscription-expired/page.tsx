'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, LogOut } from 'lucide-react'

export default function SubscriptionExpiredPage() {
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/admin/login')
        } catch (error) {
            console.error('Logout error:', error)
            router.push('/admin/login')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        Subscription Expired
                    </h1>

                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Your subscription has expired or been deactivated. Please renew your subscription to continue using the platform.
                    </p>

                    {/* Contact Section */}
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Contact Us to Renew
                        </h2>

                        <a
                            href="tel:9353083597"
                            className="flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-lg transition-colors shadow-sm mb-3"
                        >
                            <Phone className="w-5 h-5 text-red-600" />
                            <span className="font-semibold">+91 93530 83597</span>
                        </a>

                        <a
                            href="https://wa.me/919353083597?text=Hi, I want to renew my subscription"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            <span className="font-semibold">WhatsApp Us</span>
                        </a>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    Contact us to reactive your account today
                </p>
            </div>
        </div>
    )
}

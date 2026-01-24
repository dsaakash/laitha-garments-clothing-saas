'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useTrialCheck() {
    const router = useRouter()

    useEffect(() => {
        const checkTrial = async () => {
            try {
                const response = await fetch('/api/auth/check', { credentials: 'include' })
                const data = await response.json()

                if (data.authenticated && data.admin && data.admin.tenant_id) {
                    // Fetch tenant details
                    const tenantResponse = await fetch(`/api/tenants/${data.admin.tenant_id}`)
                    const tenantData = await tenantResponse.json()

                    if (tenantData.success && tenantData.data) {
                        const tenant = tenantData.data
                        const now = new Date()

                        // Check if trial expired
                        if (tenant.status === 'trial' && tenant.trialEndDate) {
                            const trialEnd = new Date(tenant.trialEndDate)
                            if (now > trialEnd) {
                                router.push('/trial-expired')
                                return
                            }
                        }

                        // Check if subscription expired or account inactive
                        if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
                            router.push('/subscription-expired')
                            return
                        }
                    }
                }
            } catch (error) {
                console.error('Trial check error:', error)
            }
        }

        checkTrial()
    }, [router])
}

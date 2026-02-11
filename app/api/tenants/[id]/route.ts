import { NextRequest, NextResponse } from 'next/server'
import { getTenantById, updateTenant, deleteTenant, hardDeleteTenant } from '@/lib/db-tenants'

// Transform DB result to frontend format
function transformTenant(dbTenant: any): any {
    return {
        id: dbTenant.id,
        businessName: dbTenant.business_name,
        slug: dbTenant.slug,
        ownerName: dbTenant.owner_name,
        ownerEmail: dbTenant.owner_email,
        phone: dbTenant.phone,
        whatsapp: dbTenant.whatsapp,
        address: dbTenant.address,
        gstNumber: dbTenant.gst_number,
        status: dbTenant.status,
        plan: dbTenant.plan,
        trialStartDate: dbTenant.trial_start_date,
        trialEndDate: dbTenant.trial_end_date,
        subscriptionStatus: dbTenant.subscription_status,
        billingCycle: dbTenant.billing_cycle,
        nextBillingDate: dbTenant.next_billing_date,
        monthlyRevenue: parseFloat(dbTenant.monthly_revenue || 0),
        customDomain: dbTenant.custom_domain,
        subdomain: dbTenant.subdomain,
        workflowEnabled: dbTenant.workflow_enabled,
        websiteBuilderEnabled: dbTenant.website_builder_enabled,
        modules: dbTenant.modules || [],
        createdAt: dbTenant.created_at,
        updatedAt: dbTenant.updated_at,
        createdBy: dbTenant.created_by,
    }
}

// GET /api/tenants/[id] - Get tenant details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const tenant = await getTenantById(params.id)

        if (!tenant) {
            return NextResponse.json(
                { success: false, message: 'Tenant not found' },
                { status: 404 }
            )
        }

        // Transform to camelCase
        const transformedTenant = transformTenant(tenant)

        // Note: Passwords are hashed and cannot be retrieved
        // Credentials are only available during creation or after reset
        return NextResponse.json({
            success: true,
            data: transformedTenant,
            credentials: null, // Passwords are hashed, use reset to get new password
            message: 'Use "Reset Password" to generate new login credentials'
        })
    } catch (error) {
        console.error('Error fetching tenant:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch tenant' },
            { status: 500 }
        )
    }
}

// PUT /api/tenants/[id] - Update tenant
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const {
            businessName,
            ownerName,
            phone,
            whatsapp,
            address,
            gstNumber,
            plan,
            status,
            subscriptionStatus,
            billingCycle,
            monthlyRevenue,
            subdomain,
            workflowEnabled,
            websiteBuilderEnabled,
            modules
        } = body

        // Get current tenant to check plan changes
        const currentTenant = await getTenantById(params.id)
        if (!currentTenant) {
            return NextResponse.json(
                { success: false, message: 'Tenant not found' },
                { status: 404 }
            )
        }

        // Prepare update data - convert camelCase to snake_case for database
        const updateData: any = {}

        if (businessName) updateData.business_name = businessName
        if (ownerName) updateData.owner_name = ownerName
        if (phone) updateData.phone = phone
        if (whatsapp) updateData.whatsapp = whatsapp
        if (address) updateData.address = address
        if (gstNumber !== undefined) updateData.gst_number = gstNumber
        if (plan) updateData.plan = plan
        if (status) updateData.status = status
        if (subscriptionStatus) updateData.subscription_status = subscriptionStatus
        if (billingCycle) updateData.billing_cycle = billingCycle
        if (monthlyRevenue !== undefined) updateData.monthly_revenue = monthlyRevenue
        if (subdomain) updateData.subdomain = subdomain
        if (workflowEnabled !== undefined) updateData.workflow_enabled = workflowEnabled
        if (websiteBuilderEnabled !== undefined) updateData.website_builder_enabled = websiteBuilderEnabled
        if (modules) updateData.modules = modules

        // Handle plan upgrade logic
        if (plan && plan !== currentTenant.plan) {
            // If upgrading to a paid plan from trial, set status to active
            if (plan !== 'free' && currentTenant.status === 'trial') {
                updateData.status = 'active'
                updateData.subscription_status = 'active'
            }
        }

        // Update tenant
        const tenant = await updateTenant(params.id, updateData)

        if (!tenant) {
            return NextResponse.json(
                { success: false, message: 'Tenant not found' },
                { status: 404 }
            )
        }

        // Transform to camelCase
        const transformedTenant = transformTenant(tenant)

        return NextResponse.json({
            success: true,
            data: transformedTenant
        })
    } catch (error) {
        console.error('Error updating tenant:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to update tenant' },
            { status: 500 }
        )
    }
}

// DELETE /api/tenants/[id] - Delete tenant
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url)
        const isHardDelete = searchParams.get('hard') === 'true'

        const deleted = isHardDelete
            ? await hardDeleteTenant(params.id)
            : await deleteTenant(params.id)

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: 'Tenant not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `Tenant ${isHardDelete ? 'permanently' : 'soft'} deleted successfully`
        })
    } catch (error) {
        console.error('Error deleting tenant:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete tenant' },
            { status: 500 }
        )
    }
}

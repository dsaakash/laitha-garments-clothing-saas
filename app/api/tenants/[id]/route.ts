import { NextRequest, NextResponse } from 'next/server'
import { getTenantById, updateTenant, deleteTenant } from '@/lib/db-tenants'

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
        
        if (body.plan !== undefined) {
            updateData.plan = body.plan
        }
        if (body.status !== undefined) {
            updateData.status = body.status
        }
        if (body.subscriptionStatus !== undefined) {
            updateData.subscription_status = body.subscriptionStatus
        }
        if (body.monthlyRevenue !== undefined) {
            updateData.monthly_revenue = body.monthlyRevenue
        }
        if (body.workflowEnabled !== undefined) {
            updateData.workflow_enabled = body.workflowEnabled
        }
        if (body.websiteBuilderEnabled !== undefined) {
            updateData.website_builder_enabled = body.websiteBuilderEnabled
        }

        // Handle plan upgrade logic
        if (body.plan && body.plan !== currentTenant.plan) {
            // If upgrading to a paid plan from trial, set status to active
            if (body.plan !== 'free' && currentTenant.status === 'trial') {
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

// DELETE /api/tenants/[id] - Delete tenant (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const deleted = await deleteTenant(params.id)

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: 'Tenant not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Tenant deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting tenant:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete tenant' },
            { status: 500 }
        )
    }
}

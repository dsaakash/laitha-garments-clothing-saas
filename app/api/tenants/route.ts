import { NextRequest, NextResponse } from 'next/server'
import {
    createTenant,
    getAllTenants,
    getTenantsByStatus,
    getPlatformStats,
    getTenantBySlug
} from '@/lib/db-tenants'
import { generateSlug, calculateTrialEndDate, getPlanPricing } from '@/lib/tenantStorage'

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
        adminLimit: dbTenant.admin_limit || 5,
        createdAt: dbTenant.created_at,
        updatedAt: dbTenant.updated_at,
        createdBy: dbTenant.created_by,
    }
}

// GET /api/tenants - List all tenants
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        let tenants

        if (status) {
            tenants = await getTenantsByStatus(status as any)
        } else {
            tenants = await getAllTenants()
        }

        // Transform to camelCase
        const transformedTenants = tenants.map(transformTenant)

        const stats = await getPlatformStats()

        return NextResponse.json({
            success: true,
            data: transformedTenants,
            stats
        })
    } catch (error) {
        console.error('Error fetching tenants:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch tenants' },
            { status: 500 }
        )
    }
}

// POST /api/tenants - Create new tenant
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate required fields
        if (!body.businessName || !body.ownerName || !body.ownerEmail || !body.password) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Validate password
        if (body.password.length < 8) {
            return NextResponse.json(
                { success: false, message: 'Password must be at least 8 characters' },
                { status: 400 }
            )
        }

        // Generate slug and subdomain
        const slug = body.slug || generateSlug(body.businessName)

        // Check if slug already exists
        const existing = await getTenantBySlug(slug)
        if (existing) {
            return NextResponse.json(
                { success: false, message: 'Business name already exists' },
                { status: 400 }
            )
        }

        // Calculate trial period
        const trialStartDate = new Date().toISOString()
        const trialEndDate = calculateTrialEndDate()

        // Create tenant
        const tenant = await createTenant({
            id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            businessName: body.businessName,
            slug,
            ownerName: body.ownerName,
            email: body.ownerEmail,
            password: body.password,  // Will be hashed in createTenant
            phone: body.phone || '',
            whatsapp: body.whatsapp || body.phone || '',
            address: body.address || '',
            gstNumber: body.gstNumber,
            status: 'trial',
            plan: body.plan || 'free',
            trialStartDate,
            trialEndDate,
            subdomain: `${slug}.yoursaas.com`,
            workflowEnabled: body.workflowEnabled !== false,
            modules: body.modules || [],
            adminLimit: body.adminLimit || 2, // Default to 2 for trial as requested
            createdBy: body.createdBy || 'system'
        })

        // Transform to camelCase
        const transformedTenant = transformTenant(tenant)

        return NextResponse.json({
            success: true,
            data: transformedTenant,
            message: 'Tenant created successfully'
        })
    } catch (error) {
        console.error('Error creating tenant:', error)
        return NextResponse.json(
            { success: false, message: `Failed to create tenant: ${error}` },
            { status: 500 }
        )
    }
}

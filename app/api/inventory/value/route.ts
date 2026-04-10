export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
    try {
        // Get tenant context
        const context = getTenantContext(request)
        const tenantFilter = buildTenantFilter(context)

        // 1. Calculate Total Retail Value (current_stock * selling_price)
        let retailQuery = `
      SELECT SUM(current_stock * selling_price) as total_retail_value 
      FROM inventory
    `
        // Add WHERE clause for tenant isolation
        if (tenantFilter.where) {
            retailQuery += ` ${tenantFilter.where}`
        }

        const retailResult = await query(retailQuery, tenantFilter.params)
        const totalRetailValue = retailResult.rows[0]?.total_retail_value || 0

        // 2. Calculate Supplier Stock Value (current_stock * wholesale_price)
        let supplierQuery = `
      SELECT 
        supplier_name, 
        SUM(current_stock * wholesale_price) as total_wholesale_value,
        SUM(current_stock) as total_items
      FROM inventory 
      WHERE supplier_name IS NOT NULL AND supplier_name != ''
    `
        // Add additional conditions for tenant isolation
        if (tenantFilter.where) {
            // logic to strip 'WHERE' since we already have WHERE
            const condition = tenantFilter.where.replace('WHERE', 'AND')
            supplierQuery += ` ${condition}`
        }

        supplierQuery += `
      GROUP BY supplier_name
      ORDER BY total_wholesale_value DESC
    `

        const supplierResult = await query(supplierQuery, tenantFilter.params)

        // Calculate total wholesale value across all suppliers
        const totalWholesaleValue = supplierResult.rows.reduce(
            (sum: number, row: any) => sum + parseFloat(row.total_wholesale_value || 0), 0
        )

        return NextResponse.json({
            success: true,
            data: {
                totalRetailValue: parseFloat(totalRetailValue),
                totalWholesaleValue: totalWholesaleValue,
                supplierBreakdown: supplierResult.rows.map((row: any) => ({
                    supplierName: row.supplier_name,
                    totalWholesaleValue: parseFloat(row.total_wholesale_value),
                    totalItems: parseInt(row.total_items)
                }))
            }
        })
    } catch (error) {
        console.error('Stock value fetch error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch stock values' },
            { status: 500 }
        )
    }
}

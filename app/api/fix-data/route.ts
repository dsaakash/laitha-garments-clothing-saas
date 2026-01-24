import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * One-time fix endpoint to set Lalitha Garments data to tenant_id NULL
 * Only run this ONCE to fix existing data
 */
export async function POST() {
    try {
        console.log('🔧 Starting data fix: Setting Lalitha Garments tenant_id to NULL...')

        // Fix all tables
        const tables = [
            'inventory',
            'sales',
            'suppliers',
            'categories',
            'purchase_orders',
            'customers',
            'catalogues',
            'business_profile'
        ]

        const results = []

        for (const table of tables) {
            try {
                // Update all records that don't belong to a tenant
                // (created before tenants existed or belong to Lalitha Garments)
                const result = await query(
                    `UPDATE ${table} SET tenant_id = NULL WHERE tenant_id IS NOT NULL`
                )

                results.push({
                    table,
                    success: true,
                    rowsUpdated: result.rowCount || 0
                })

                console.log(`✅ ${table}: ${result.rowCount} rows updated`)
            } catch (err) {
                console.error(`❌ Error updating ${table}:`, err)
                results.push({
                    table,
                    success: false,
                    error: String(err)
                })
            }
        }

        console.log('🎉 Data fix complete!')

        return NextResponse.json({
            success: true,
            message: 'Lalitha Garments data fixed successfully',
            results
        })
    } catch (error) {
        console.error('Fix data error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fix data', error: String(error) },
            { status: 500 }
        )
    }
}

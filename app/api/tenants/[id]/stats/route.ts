import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const tenantId = params.id

    try {
        // Parallelize queries for performance
        const [
            inventoryRes,
            poRes,
            salesRes,
            customerRes,
            supplierRes
        ] = await Promise.all([
            // Inventory Stats: Total Items and Total Stock Value (excluding null stock/price)
            query(
                `SELECT 
                    COUNT(*) as total_items, 
                    SUM(COALESCE(current_stock, 0) * COALESCE(selling_price, 0)) as total_value 
                 FROM inventory 
                 WHERE tenant_id = $1`,
                [tenantId]
            ),
            // Purchase Orders: Count and Pending Value
            query(
                `SELECT 
                    COUNT(*) as total_pos, 
                    SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as pending_value,
                    SUM(total_amount) as total_spent
                 FROM purchase_orders 
                 WHERE tenant_id = $1`,
                [tenantId]
            ),
            // Sales: Total Count and Revenue
            query(
                `SELECT 
                    COUNT(*) as total_sales, 
                    SUM(total_amount) as total_revenue 
                 FROM sales 
                 WHERE tenant_id = $1`,
                [tenantId]
            ),
            // Customers: Total Count
            query(
                `SELECT COUNT(*) as total_customers FROM customers WHERE tenant_id = $1`,
                [tenantId]
            ),
            // Suppliers: Total Count
            query(
                `SELECT COUNT(*) as total_suppliers FROM suppliers WHERE tenant_id = $1`,
                [tenantId]
            )
        ])

        const stats = {
            inventory: {
                count: parseInt(inventoryRes.rows[0]?.total_items || '0'),
                value: parseFloat(inventoryRes.rows[0]?.total_value || '0')
            },
            purchases: {
                count: parseInt(poRes.rows[0]?.total_pos || '0'),
                pendingValue: parseFloat(poRes.rows[0]?.pending_value || '0'),
                totalSpent: parseFloat(poRes.rows[0]?.total_spent || '0')
            },
            sales: {
                count: parseInt(salesRes.rows[0]?.total_sales || '0'),
                revenue: parseFloat(salesRes.rows[0]?.total_revenue || '0')
            },
            customers: {
                count: parseInt(customerRes.rows[0]?.total_customers || '0')
            },
            suppliers: {
                count: parseInt(supplierRes.rows[0]?.total_suppliers || '0')
            }
        }

        return NextResponse.json({
            success: true,
            stats
        })

    } catch (error) {
        console.error('Error fetching tenant stats:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch statistics' },
            { status: 500 }
        )
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partyName = searchParams.get('partyName')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    let queryText = `
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(AVG(s.total_amount), 0) as average_sale,
        MIN(s.date) as first_sale_date,
        MAX(s.date) as last_sale_date
      FROM sales s
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramCount = 1
    
    if (partyName) {
      queryText += ` AND LOWER(s.party_name) = LOWER($${paramCount})`
      params.push(partyName)
      paramCount++
    }
    
    if (startDate) {
      queryText += ` AND s.date >= $${paramCount}`
      params.push(startDate)
      paramCount++
    }
    
    if (endDate) {
      queryText += ` AND s.date <= $${paramCount}`
      params.push(endDate)
      paramCount++
    }
    
    const result = await query(queryText, params)
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalSales: 0,
          totalRevenue: 0,
          averageSale: 0,
          dateRange: null
        }
      })
    }
    
    const row = result.rows[0]
    const totalSales = parseInt(row.total_sales) || 0
    const totalRevenue = parseFloat(row.total_revenue) || 0
    const averageSale = parseFloat(row.average_sale) || 0
    const firstSaleDate = row.first_sale_date ? new Date(row.first_sale_date).toISOString() : null
    const lastSaleDate = row.last_sale_date ? new Date(row.last_sale_date).toISOString() : null
    
    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        totalRevenue,
        averageSale,
        dateRange: firstSaleDate && lastSaleDate ? {
          from: firstSaleDate,
          to: lastSaleDate
        } : null
      }
    })
  } catch (error) {
    console.error('Sales summary fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sales summary' },
      { status: 500 }
    )
  }
}


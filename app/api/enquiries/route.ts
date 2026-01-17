import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let queryText = `
      SELECT 
        e.*,
        i.dress_name as product_dress_name,
        i.dress_code as product_dress_code,
        i.image_url as product_image_url
      FROM customer_enquiries e
      LEFT JOIN inventory i ON e.product_id = i.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (status) {
      queryText += ` AND e.status = $1`
      params.push(status)
    }
    
    queryText += ` ORDER BY e.created_at DESC`

    const result = await query(queryText, params.length > 0 ? params : undefined)

    return NextResponse.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching enquiries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enquiries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      customerName, 
      customerPhone, 
      productId, 
      productName, 
      productCode, 
      fabricType, 
      enquiryMethod = 'form',
      bookingType,
      meetingLink,
      appointmentDate,
      appointmentTime,
      calendarEventId
    } = body

    // Validate required fields - allow calendar bookings without phone
    if (!customerName || !productName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: customerName, productName' },
        { status: 400 }
      )
    }

    // For calendar bookings, phone might be empty initially
    const customerPhoneValue = customerPhone || ''

    // Convert productId to integer if it's a string
    let productIdInt = null
    if (productId) {
      productIdInt = typeof productId === 'string' ? parseInt(productId, 10) : productId
      if (isNaN(productIdInt)) {
        productIdInt = null
      }
    }

    // Check if booking fields exist in table (for migration compatibility)
    const checkColumns = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customer_enquiries' 
      AND column_name IN ('booking_type', 'meeting_link', 'appointment_date', 'appointment_time', 'calendar_event_id')
    `)
    
    const hasBookingFields = checkColumns.rows.length > 0

    let result
    if (hasBookingFields) {
      // Insert with booking fields
      result = await query(
        `INSERT INTO customer_enquiries 
         (customer_name, customer_phone, product_id, product_name, product_code, fabric_type, 
          enquiry_method, status, booking_type, meeting_link, appointment_date, appointment_time, calendar_event_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          customerName, 
          customerPhoneValue, 
          productIdInt, 
          productName, 
          productCode || null, 
          fabricType || null, 
          enquiryMethod,
          bookingType || null,
          meetingLink || null,
          appointmentDate || null,
          appointmentTime || null,
          calendarEventId || null
        ]
      )
    } else {
      // Insert without booking fields (backward compatibility)
      result = await query(
      `INSERT INTO customer_enquiries 
       (customer_name, customer_phone, product_id, product_name, product_code, fabric_type, enquiry_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
        [customerName, customerPhoneValue, productIdInt, productName, productCode || null, fabricType || null, enquiryMethod]
    )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error: any) {
    console.error('Error creating enquiry:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', JSON.stringify(error, null, 2))
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create enquiry'
    let errorDetails = error.message || 'Unknown error'
    
    if (error.message) {
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table')) {
        errorMessage = 'Database table does not exist. Please run the migration script: scripts/migrate-customer-enquiries.sql'
        errorDetails = `Table error: ${error.message}`
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: errorDetails,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

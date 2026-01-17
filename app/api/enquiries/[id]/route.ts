import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { 
      status, 
      notes,
      bookingType,
      meetingLink,
      appointmentDate,
      appointmentTime,
      calendarEventId,
      customerName,
      customerPhone
    } = body
    const id = params.id

    // Check if booking fields exist in table
    const checkColumns = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customer_enquiries' 
      AND column_name IN ('booking_type', 'meeting_link', 'appointment_date', 'appointment_time', 'calendar_event_id')
    `)
    
    const hasBookingFields = checkColumns.rows.length > 0

    // Build update query dynamically
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (status) {
    const validStatuses = ['pending', 'contacted', 'resolved', 'closed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }
      updateFields.push(`status = $${paramIndex}`)
      updateValues.push(status)
      paramIndex++
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`)
      updateValues.push(notes || null)
      paramIndex++
    }

    if (hasBookingFields) {
      if (bookingType !== undefined) {
        updateFields.push(`booking_type = $${paramIndex}`)
        updateValues.push(bookingType || null)
        paramIndex++
      }
      if (meetingLink !== undefined) {
        updateFields.push(`meeting_link = $${paramIndex}`)
        updateValues.push(meetingLink || null)
        paramIndex++
      }
      if (appointmentDate !== undefined) {
        updateFields.push(`appointment_date = $${paramIndex}`)
        updateValues.push(appointmentDate || null)
        paramIndex++
      }
      if (appointmentTime !== undefined) {
        updateFields.push(`appointment_time = $${paramIndex}`)
        updateValues.push(appointmentTime || null)
        paramIndex++
      }
      if (calendarEventId !== undefined) {
        updateFields.push(`calendar_event_id = $${paramIndex}`)
        updateValues.push(calendarEventId || null)
        paramIndex++
      }
    }

    if (customerName !== undefined) {
      updateFields.push(`customer_name = $${paramIndex}`)
      updateValues.push(customerName)
      paramIndex++
    }

    if (customerPhone !== undefined) {
      updateFields.push(`customer_phone = $${paramIndex}`)
      updateValues.push(customerPhone)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    updateValues.push(id)

    const queryText = `
      UPDATE customer_enquiries 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await query(queryText, updateValues)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enquiry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error updating enquiry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update enquiry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const result = await query(
      `DELETE FROM customer_enquiries WHERE id = $1 RETURNING *`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enquiry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Enquiry deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting enquiry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete enquiry' },
      { status: 500 }
    )
  }
}

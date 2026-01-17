import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const { paymentStatus } = body

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid sale ID' },
        { status: 400 }
      )
    }

    if (!paymentStatus || !['paid', 'pending', 'failed'].includes(paymentStatus)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment status. Must be: paid, pending, or failed' },
        { status: 400 }
      )
    }

    // Update payment status
    const result = await query(
      `UPDATE sales 
       SET payment_status = $1
       WHERE id = $2
       RETURNING id, payment_status`,
      [paymentStatus, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Sale not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.rows[0].id.toString(),
        paymentStatus: result.rows[0].payment_status,
      }
    })
  } catch (error: any) {
    console.error('Payment status update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update payment status', error: error?.message || String(error) },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { customFieldsStorage } from '@/lib/customFieldsStorage'

// PUT /api/custom-fields/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { id } = params

        const updatedField = customFieldsStorage.updateCustomField(id, body)

        if (!updatedField) {
            return NextResponse.json(
                { success: false, message: 'Custom field not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: updatedField
        })
    } catch (error) {
        console.error('Error updating custom field:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to update custom field' },
            { status: 500 }
        )
    }
}

// DELETE /api/custom-fields/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const deleted = customFieldsStorage.deleteCustomField(id)

        if (!deleted) {
            return NextResponse.json(
                { success: false, message: 'Custom field not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Custom field deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting custom field:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete custom field' },
            { status: 500 }
        )
    }
}

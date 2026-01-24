import { NextRequest, NextResponse } from 'next/server'
import { customFieldsStorage, CustomField, EntityType } from '@/lib/customFieldsStorage'

// GET /api/custom-fields?entityType=inventory
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const entityType = searchParams.get('entityType') as EntityType | null

        const fields = customFieldsStorage.getCustomFields(entityType || undefined)

        return NextResponse.json({
            success: true,
            data: fields.sort((a, b) => a.displayOrder - b.displayOrder)
        })
    } catch (error) {
        console.error('Error fetching custom fields:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch custom fields' },
            { status: 500 }
        )
    }
}

// POST /api/custom-fields
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate required fields
        if (!body.entityType || !body.fieldName || !body.fieldType) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields: entityType, fieldName, fieldType' },
                { status: 400 }
            )
        }

        // Get existing fields for this entity to determine display order
        const existingFields = customFieldsStorage.getCustomFields(body.entityType)
        const maxOrder = existingFields.reduce((max, field) => Math.max(max, field.displayOrder), -1)

        const newField = customFieldsStorage.addCustomField({
            entityType: body.entityType,
            fieldName: body.fieldName,
            fieldKey: body.fieldKey || '', // Will be auto-generated
            fieldType: body.fieldType,
            options: body.options,
            required: body.required || false,
            defaultValue: body.defaultValue,
            placeholder: body.placeholder,
            helpText: body.helpText,
            displayOrder: maxOrder + 1
        })

        return NextResponse.json({
            success: true,
            data: newField
        })
    } catch (error) {
        console.error('Error creating custom field:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to create custom field' },
            { status: 500 }
        )
    }
}

// Custom Fields System - Type Definitions and Storage
// Allows admins to add custom fields to entities without code changes

export type EntityType = 'inventory' | 'customer' | 'supplier' | 'sale'

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea' | 'checkbox'

export interface CustomField {
    id: string
    entityType: EntityType
    fieldName: string          // Display name (e.g., "Thread Count")
    fieldKey: string           // System key (e.g., "thread_count")
    fieldType: FieldType
    options?: string[]         // For select/multiselect types
    required: boolean
    defaultValue?: string
    placeholder?: string
    helpText?: string
    displayOrder: number
    createdAt: string
    updatedAt: string
}

export interface CustomFieldValue {
    [fieldKey: string]: any
}

// Storage implementation using localStorage
const CUSTOM_FIELDS_KEY = 'lalitha_custom_fields'

export const customFieldsStorage = {
    // Get all custom fields, optionally filtered by entity type
    getCustomFields: (entityType?: EntityType): CustomField[] => {
        if (typeof window === 'undefined') return []

        const stored = localStorage.getItem(CUSTOM_FIELDS_KEY)
        const allFields: CustomField[] = stored ? JSON.parse(stored) : []

        if (entityType) {
            return allFields.filter(field => field.entityType === entityType)
        }
        return allFields
    },

    // Get a single custom field by ID
    getCustomField: (id: string): CustomField | null => {
        const fields = customFieldsStorage.getCustomFields()
        return fields.find(field => field.id === id) || null
    },

    // Add a new custom field
    addCustomField: (field: Omit<CustomField, 'id' | 'createdAt' | 'updatedAt'>): CustomField => {
        const fields = customFieldsStorage.getCustomFields()

        // Generate field key from field name (e.g., "Thread Count" -> "thread_count")
        const fieldKey = field.fieldName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')

        const newField: CustomField = {
            ...field,
            fieldKey,
            id: `cf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        fields.push(newField)

        if (typeof window !== 'undefined') {
            localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(fields))
        }

        return newField
    },

    // Update an existing custom field
    updateCustomField: (id: string, updates: Partial<Omit<CustomField, 'id' | 'createdAt'>>): CustomField | null => {
        const fields = customFieldsStorage.getCustomFields()
        const index = fields.findIndex(field => field.id === id)

        if (index === -1) return null

        // Regenerate field key if field name changed
        if (updates.fieldName && updates.fieldName !== fields[index].fieldName) {
            updates.fieldKey = updates.fieldName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')
        }

        fields[index] = {
            ...fields[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        }

        if (typeof window !== 'undefined') {
            localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(fields))
        }

        return fields[index]
    },

    // Delete a custom field
    deleteCustomField: (id: string): boolean => {
        const fields = customFieldsStorage.getCustomFields()
        const filtered = fields.filter(field => field.id !== id)

        if (filtered.length === fields.length) return false

        if (typeof window !== 'undefined') {
            localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(filtered))
        }

        return true
    },

    // Reorder custom fields (update displayOrder)
    reorderCustomFields: (entityType: EntityType, orderedIds: string[]): boolean => {
        const fields = customFieldsStorage.getCustomFields()

        orderedIds.forEach((id, index) => {
            const field = fields.find(f => f.id === id && f.entityType === entityType)
            if (field) {
                field.displayOrder = index
                field.updatedAt = new Date().toISOString()
            }
        })

        if (typeof window !== 'undefined') {
            localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(fields))
        }

        return true
    },

    // Validate custom field value against field definition
    validateFieldValue: (field: CustomField, value: any): { valid: boolean; error?: string } => {
        // Required field check
        if (field.required && (value === null || value === undefined || value === '')) {
            return { valid: false, error: `${field.fieldName} is required` }
        }

        // Type-specific validation
        switch (field.fieldType) {
            case 'number':
                if (value !== null && value !== undefined && value !== '' && isNaN(Number(value))) {
                    return { valid: false, error: `${field.fieldName} must be a number` }
                }
                break

            case 'date':
                if (value && isNaN(Date.parse(value))) {
                    return { valid: false, error: `${field.fieldName} must be a valid date` }
                }
                break

            case 'select':
                if (value && field.options && !field.options.includes(value)) {
                    return { valid: false, error: `${field.fieldName} must be one of: ${field.options.join(', ')}` }
                }
                break

            case 'multiselect':
                if (value && Array.isArray(value) && field.options) {
                    const invalidValues = value.filter(v => !field.options!.includes(v))
                    if (invalidValues.length > 0) {
                        return { valid: false, error: `${field.fieldName} contains invalid options: ${invalidValues.join(', ')}` }
                    }
                }
                break
        }

        return { valid: true }
    },

    // Validate all custom field values for an entity
    validateCustomFields: (entityType: EntityType, customFieldValues: CustomFieldValue): { valid: boolean; errors: Record<string, string> } => {
        const fields = customFieldsStorage.getCustomFields(entityType)
        const errors: Record<string, string> = {}

        fields.forEach(field => {
            const value = customFieldValues[field.fieldKey]
            const validation = customFieldsStorage.validateFieldValue(field, value)

            if (!validation.valid && validation.error) {
                errors[field.fieldKey] = validation.error
            }
        })

        return {
            valid: Object.keys(errors).length === 0,
            errors
        }
    }
}

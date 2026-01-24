'use client'

import { useState } from 'react'
import { CustomField, EntityType, FieldType } from '@/lib/customFieldsStorage'
import { X, Plus, AlertCircle } from 'lucide-react'
import ActionButton from '@/components/ActionButton'
import { FieldTypeIcon } from './DynamicFieldRenderer'

interface FieldEditorProps {
    isOpen: boolean
    onClose: () => void
    onSave: (field: Partial<CustomField>) => void
    entityType: EntityType
    editingField?: CustomField | null
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown (Select One)' },
    { value: 'multiselect', label: 'Multi-Select' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'checkbox', label: 'Checkbox' },
]

export default function FieldEditor({ isOpen, onClose, onSave, entityType, editingField }: FieldEditorProps) {
    const [formData, setFormData] = useState({
        fieldName: editingField?.fieldName || '',
        fieldType: editingField?.fieldType || 'text' as FieldType,
        required: editingField?.required || false,
        placeholder: editingField?.placeholder || '',
        helpText: editingField?.helpText || '',
        options: editingField?.options?.join('\n') || '',
        defaultValue: editingField?.defaultValue || '',
    })

    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.fieldName.trim()) {
            setError('Field name is required')
            return
        }

        if ((formData.fieldType === 'select' || formData.fieldType === 'multiselect') && !formData.options.trim()) {
            setError('Options are required for dropdown fields')
            return
        }

        const fieldData: Partial<CustomField> = {
            entityType,
            fieldName: formData.fieldName.trim(),
            fieldType: formData.fieldType,
            required: formData.required,
            placeholder: formData.placeholder.trim() || undefined,
            helpText: formData.helpText.trim() || undefined,
            defaultValue: formData.defaultValue.trim() || undefined,
        }

        if (formData.fieldType === 'select' || formData.fieldType === 'multiselect') {
            fieldData.options = formData.options
                .split('\n')
                .map(opt => opt.trim())
                .filter(Boolean)
        }

        onSave(fieldData)
        handleClose()
    }

    const handleClose = () => {
        setFormData({
            fieldName: '',
            fieldType: 'text',
            required: false,
            placeholder: '',
            helpText: '',
            options: '',
            defaultValue: '',
        })
        setError('')
        onClose()
    }

    const showOptionsField = formData.fieldType === 'select' || formData.fieldType === 'multiselect'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {editingField ? 'Edit Custom Field' : 'Add Custom Field'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            For {entityType.charAt(0).toUpperCase() + entityType.slice(1)} entities
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Field Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Field Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.fieldName}
                            onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                            placeholder="e.g., Thread Count, Designer Name"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            required
                        />
                    </div>

                    {/* Field Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Field Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.fieldType}
                            onChange={(e) => setFormData({ ...formData, fieldType: e.target.value as FieldType })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        >
                            {FIELD_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Options (for select/multiselect) */}
                    {showOptionsField && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Options <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.options}
                                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                                placeholder="Enter each option on a new line&#10;Example:&#10;Option 1&#10;Option 2&#10;Option 3"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all min-h-[120px] resize-y font-mono text-sm"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter each option on a new line</p>
                        </div>
                    )}

                    {/* Placeholder */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Placeholder Text
                        </label>
                        <input
                            type="text"
                            value={formData.placeholder}
                            onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                            placeholder="e.g., Enter thread count (e.g., 200)"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                    </div>

                    {/* Help Text */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Help Text
                        </label>
                        <input
                            type="text"
                            value={formData.helpText}
                            onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
                            placeholder="e.g., Higher thread count means better quality"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                    </div>

                    {/* Required Checkbox */}
                    <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.required}
                                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm font-semibold text-gray-700">Required field</span>
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <ActionButton
                            type="button"
                            variant="secondary"
                            onClick={handleClose}
                        >
                            Cancel
                        </ActionButton>
                        <ActionButton
                            type="submit"
                            variant="primary"
                            icon={editingField ? undefined : Plus}
                        >
                            {editingField ? 'Save Changes' : 'Add Field'}
                        </ActionButton>
                    </div>
                </form>
            </div>
        </div>
    )
}

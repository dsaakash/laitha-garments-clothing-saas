'use client'

import { CustomField, FieldType } from '@/lib/customFieldsStorage'
import { Calendar, CheckSquare, List, Hash, Type, AlignLeft } from 'lucide-react'

interface DynamicFieldRendererProps {
    field: CustomField
    value: any
    onChange: (value: any) => void
    error?: string
}

export default function DynamicFieldRenderer({ field, value, onChange, error }: DynamicFieldRendererProps) {
    const renderField = () => {
        const baseClasses = `w-full px-4 py-3 bg-gray-50 border ${error ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400`

        switch (field.fieldType) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.fieldName.toLowerCase()}`}
                        className={baseClasses}
                        required={field.required}
                    />
                )

            case 'number':
                return (
                    <input
                        type="number"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.fieldName.toLowerCase()}`}
                        className={baseClasses}
                        required={field.required}
                    />
                )

            case 'date':
                return (
                    <input
                        type="date"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={baseClasses}
                        required={field.required}
                    />
                )

            case 'select':
                return (
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={baseClasses}
                        required={field.required}
                    >
                        <option value="">Select {field.fieldName.toLowerCase()}</option>
                        {field.options?.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                )

            case 'multiselect':
                return (
                    <select
                        multiple
                        value={value || []}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value)
                            onChange(selected)
                        }}
                        className={`${baseClasses} min-h-[120px]`}
                        required={field.required}
                    >
                        {field.options?.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                )

            case 'textarea':
                return (
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.fieldName.toLowerCase()}`}
                        className={`${baseClasses} min-h-[100px] resize-y`}
                        required={field.required}
                        rows={4}
                    />
                )

            case 'checkbox':
                return (
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={value || false}
                            onChange={(e) => onChange(e.target.checked)}
                            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-gray-700">{field.placeholder || field.fieldName}</span>
                    </label>
                )

            default:
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        className={baseClasses}
                    />
                )
        }
    }

    return (
        <div className="space-y-2">
            {field.fieldType !== 'checkbox' && (
                <label className="block text-sm font-semibold text-gray-700">
                    {field.fieldName}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {renderField()}

            {field.helpText && !error && (
                <p className="text-xs text-gray-500">{field.helpText}</p>
            )}

            {error && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {error}
                </p>
            )}
        </div>
    )
}

// Helper component to show field type icon
export function FieldTypeIcon({ type }: { type: FieldType }) {
    const iconClass = "w-4 h-4"

    switch (type) {
        case 'text':
            return <Type className={iconClass} />
        case 'number':
            return <Hash className={iconClass} />
        case 'date':
            return <Calendar className={iconClass} />
        case 'select':
            return <List className={iconClass} />
        case 'multiselect':
            return <List className={iconClass} />
        case 'textarea':
            return <AlignLeft className={iconClass} />
        case 'checkbox':
            return <CheckSquare className={iconClass} />
        default:
            return <Type className={iconClass} />
    }
}

'use client'

/**
 * Selective Edit Form Component
 * 
 * Allows editing only selected products from a purchase order
 * Features:
 * - Edit wholesale price, product name, category, sizes, fabric type, quantity
 * - Image upload/removal
 * - Real-time validation
 * - Submission to approval workflow
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Trash2, Save, Image as ImageIcon } from 'lucide-react'
import { PurchaseOrderItem } from '@/lib/storage'
import Image from 'next/image'

interface SelectiveEditFormProps {
    purchaseOrderId: string
    selectedProducts: PurchaseOrderItem[]
    onSubmit: () => void
    onCancel: () => void
}

export default function SelectiveEditForm({
    purchaseOrderId,
    selectedProducts,
    onSubmit,
    onCancel
}: SelectiveEditFormProps) {
    const [changes, setChanges] = useState<Record<string, Partial<PurchaseOrderItem>>>({})
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFieldChange = (productId: string, field: keyof PurchaseOrderItem, value: any) => {
        setChanges(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: value
            }
        }))
    }

    const handleImageUpload = async (productId: string, file: File) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()
            if (data.success) {
                const product = selectedProducts.find(p => p.id === productId)
                const currentImages = changes[productId]?.productImages || product?.productImages || []

                handleFieldChange(productId, 'productImages', [...currentImages, data.url])
            } else {
                alert('Failed to upload image')
            }
        } catch (err) {
            console.error('Image upload error:', err)
            alert('Failed to upload image')
        }
    }

    const handleImageRemove = (productId: string, imageIndex: number) => {
        const product = selectedProducts.find(p => p.id === productId)
        const currentImages = changes[productId]?.productImages || product?.productImages || []
        const newImages = currentImages.filter((_, i) => i !== imageIndex)

        handleFieldChange(productId, 'productImages', newImages)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const productIds = selectedProducts.map(p => p.id).filter(Boolean) as string[]

            const response = await fetch(`/api/purchases/${purchaseOrderId}/selective-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productIds,
                    changes
                })
            })

            const data = await response.json()

            if (data.success) {
                alert(`Changes submitted for approval! Approval Request #${data.approvalRequestId}`)
                onSubmit()
            } else {
                if (data.error === 'PRODUCTS_LOCKED') {
                    setError(`Some products are locked: ${data.lockedProducts.join(', ')}`)
                } else {
                    setError(data.message || data.error || 'Failed to submit changes')
                }
            }
        } catch (err) {
            console.error('Submit error:', err)
            setError('Failed to submit changes. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const getFieldValue = (productId: string, field: keyof PurchaseOrderItem) => {
        const product = selectedProducts.find(p => p.id === productId)
        return changes[productId]?.[field] ?? product?.[field]
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full my-8 border border-slate-800"
            >
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-800">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Edit Selected Products</h2>
                            <p className="text-slate-400 text-sm mt-1">
                                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Products */}
                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                        {selectedProducts.map((product, index) => {
                            const productId = product.id!
                            const currentImages = getFieldValue(productId, 'productImages') as string[] || []

                            return (
                                <div key={productId} className="p-6 bg-slate-800/30 rounded-xl border border-slate-700">
                                    <h3 className="text-lg font-bold text-white mb-4">
                                        Product {index + 1}: {product.productName}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Product Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Product Name
                                            </label>
                                            <input
                                                type="text"
                                                value={getFieldValue(productId, 'productName') as string || ''}
                                                onChange={(e) => handleFieldChange(productId, 'productName', e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Category */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Category
                                            </label>
                                            <input
                                                type="text"
                                                value={getFieldValue(productId, 'category') as string || ''}
                                                onChange={(e) => handleFieldChange(productId, 'category', e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Fabric Type */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Fabric Type
                                            </label>
                                            <input
                                                type="text"
                                                value={getFieldValue(productId, 'fabricType') as string || ''}
                                                onChange={(e) => handleFieldChange(productId, 'fabricType', e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Sizes */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Sizes (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                value={Array.isArray(getFieldValue(productId, 'sizes'))
                                                    ? (getFieldValue(productId, 'sizes') as string[]).join(', ')
                                                    : ''
                                                }
                                                onChange={(e) => handleFieldChange(
                                                    productId,
                                                    'sizes',
                                                    e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                                )}
                                                placeholder="S, M, L, XL"
                                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Quantity */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={getFieldValue(productId, 'quantity') as number || 0}
                                                onChange={(e) => {
                                                    const quantity = parseInt(e.target.value) || 0
                                                    const pricePerPiece = getFieldValue(productId, 'pricePerPiece') as number || 0
                                                    handleFieldChange(productId, 'quantity', quantity)
                                                    handleFieldChange(productId, 'totalAmount', quantity * pricePerPiece)
                                                }}
                                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Price Per Piece */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Price Per Piece (₹)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={getFieldValue(productId, 'pricePerPiece') as number || 0}
                                                onChange={(e) => {
                                                    const pricePerPiece = parseFloat(e.target.value) || 0
                                                    const quantity = getFieldValue(productId, 'quantity') as number || 0
                                                    handleFieldChange(productId, 'pricePerPiece', pricePerPiece)
                                                    handleFieldChange(productId, 'totalAmount', quantity * pricePerPiece)
                                                }}
                                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Total Amount (Read-only) */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Total Amount
                                        </label>
                                        <div className="px-4 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg font-bold">
                                            ₹{(getFieldValue(productId, 'totalAmount') as number || 0).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Product Images */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Product Images
                                        </label>
                                        <div className="flex flex-wrap gap-3">
                                            {currentImages.map((imageUrl, imgIndex) => (
                                                <div key={imgIndex} className="relative group">
                                                    <Image
                                                        src={imageUrl}
                                                        alt={`Product ${index + 1} Image ${imgIndex + 1}`}
                                                        width={100}
                                                        height={100}
                                                        className="w-24 h-24 object-cover rounded-lg border-2 border-slate-700"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImageRemove(productId, imgIndex)}
                                                        className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-white" />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Upload Button */}
                                            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 hover:border-emerald-500 rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-6 h-6 text-slate-500" />
                                                <span className="text-xs text-slate-500 mt-1">Upload</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleImageUpload(productId, file)
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={submitting}
                            className="px-6 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || Object.keys(changes).length === 0}
                            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Submit for Approval
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

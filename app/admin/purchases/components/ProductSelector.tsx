'use client'

/**
 * Product Selector Component
 * 
 * Allows searching and selecting specific products from a purchase order
 * Features:
 * - Real-time search with debouncing
 * - Multi-select with checkboxes
 * - Select all functionality
 * - Locked product indication
 * - Selection count display
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, CheckSquare, Square, Lock, Image as ImageIcon } from 'lucide-react'
import { PurchaseOrderItem } from '@/lib/storage'
import Image from 'next/image'

interface ProductSelectorProps {
    purchaseOrderId: string
    onComplete: (selectedProducts: PurchaseOrderItem[]) => void
    onCancel: () => void
}

export default function ProductSelector({
    purchaseOrderId,
    onComplete,
    onCancel
}: ProductSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<PurchaseOrderItem[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [lockedProductIds, setLockedProductIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchLockedProducts = useCallback(async () => {
        try {
            const response = await fetch(`/api/purchases/${purchaseOrderId}/locks`)
            const data = await response.json()
            if (data.success) {
                setLockedProductIds(new Set(data.lockedProductIds))
            }
        } catch (err) {
            console.error('Failed to fetch locked products:', err)
        }
    }, [purchaseOrderId])

    const performSearch = useCallback(async (query: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(
                `/api/purchases/${purchaseOrderId}/products/search?q=${encodeURIComponent(query)}`
            )
            const data = await response.json()

            if (response.ok && data.success) {
                setSearchResults(data.products)
                if (data.limited) {
                    setError(`Showing first ${data.products.length} of ${data.total} results. Refine your search for more specific results.`)
                }
            } else {
                const errorMsg = data.message || data.error || 'Search failed'
                setError(errorMsg)
                console.error('Search API error:', data)
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to search products'
            setError(errorMsg)
            console.error('Search error:', err)
        } finally {
            setLoading(false)
        }
    }, [purchaseOrderId])

    // Fetch locked products and all products on mount
    useEffect(() => {
        fetchLockedProducts()
        performSearch('') // Load all products initially
    }, [fetchLockedProducts, performSearch])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchQuery)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery, performSearch])

    const handleSelectAll = () => {
        const selectableIds = searchResults
            .filter(p => p.id && !lockedProductIds.has(p.id))
            .map(p => p.id!)
        setSelectedIds(new Set(selectableIds))
    }

    const handleDeselectAll = () => {
        setSelectedIds(new Set())
    }

    const handleToggleProduct = (productId: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(productId)) {
            newSelected.delete(productId)
        } else {
            newSelected.add(productId)
        }
        setSelectedIds(newSelected)
    }

    const handleComplete = () => {
        const selected = searchResults.filter(p => p.id && selectedIds.has(p.id))
        onComplete(selected)
    }

    const selectableCount = searchResults.filter(p => p.id && !lockedProductIds.has(p.id)).length

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-800"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Select Products</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Search and select products to update
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-6 border-b border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by product name, code, category, or fabric... (or leave empty to see all)"
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-500"
                        />
                    </div>
                    {!searchQuery && searchResults.length > 0 && (
                        <p className="mt-2 text-sm text-slate-400">
                            Showing all {searchResults.length} products. Use search to filter.
                        </p>
                    )}
                    {error && (
                        <p className="mt-2 text-sm text-yellow-400">{error}</p>
                    )}
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-400 mt-4">Searching...</p>
                        </div>
                    )}

                    {!loading && searchQuery && searchResults.length === 0 && (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No products found matching &quot;{searchQuery}&quot;</p>
                        </div>
                    )}

                    {!loading && !searchQuery && searchResults.length === 0 && (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">Loading products...</p>
                        </div>
                    )}

                    {!loading && searchResults.length > 0 && (
                        <div className="space-y-3">
                            {searchResults.map((product) => {
                                const isLocked = product.id && lockedProductIds.has(product.id)
                                const isSelected = product.id && selectedIds.has(product.id)

                                return (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl border-2 transition-all ${isLocked
                                            ? 'bg-slate-800/50 border-slate-700 opacity-60 cursor-not-allowed'
                                            : isSelected
                                                ? 'bg-emerald-500/10 border-emerald-500/50'
                                                : 'bg-slate-800/30 border-slate-700 hover:border-slate-600 cursor-pointer'
                                            }`}
                                        onClick={() => !isLocked && product.id && handleToggleProduct(product.id)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Checkbox */}
                                            <div className="pt-1">
                                                {isLocked ? (
                                                    <Lock className="w-5 h-5 text-slate-500" />
                                                ) : isSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-500" />
                                                )}
                                            </div>

                                            {/* Product Image */}
                                            <div className="w-16 h-16 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                                                {product.productImages && product.productImages.length > 0 ? (
                                                    <Image
                                                        src={product.productImages[0]}
                                                        alt={product.productName}
                                                        width={64}
                                                        height={64}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon className="w-6 h-6 text-slate-500" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-white truncate">{product.productName}</h3>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {product.category && (
                                                        <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
                                                            {product.category}
                                                        </span>
                                                    )}
                                                    {product.fabricType && (
                                                        <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
                                                            {product.fabricType}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-sm">
                                                    <span className="text-slate-400">
                                                        Qty: <span className="text-white font-medium">{product.quantity}</span>
                                                    </span>
                                                    <span className="text-slate-400">
                                                        Price: <span className="text-white font-medium">₹{product.pricePerPiece}</span>
                                                    </span>
                                                    <span className="text-slate-400">
                                                        Total: <span className="text-white font-medium">₹{product.totalAmount}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {isLocked && (
                                                <div className="flex-shrink-0">
                                                    <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded border border-orange-500/30">
                                                        Pending Changes
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        {searchResults.length > 0 && (
                            <>
                                <button
                                    onClick={handleSelectAll}
                                    disabled={selectableCount === 0}
                                    className="text-sm text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 disabled:cursor-not-allowed"
                                >
                                    Select All ({selectableCount})
                                </button>
                                {selectedIds.size > 0 && (
                                    <button
                                        onClick={handleDeselectAll}
                                        className="text-sm text-slate-400 hover:text-slate-300"
                                    >
                                        Deselect All
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">
                            {selectedIds.size} product{selectedIds.size !== 1 ? 's' : ''} selected
                        </span>
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleComplete}
                            disabled={selectedIds.size === 0}
                            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            Edit Selected
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

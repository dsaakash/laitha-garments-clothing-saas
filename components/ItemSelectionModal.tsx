'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { InventoryItem } from '@/lib/storage'

interface ItemSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: InventoryItem) => void
  inventory: InventoryItem[]
  multiSelect?: boolean // Allow selecting multiple items without closing
  selectedItems?: string[] // Array of selected item IDs for multi-select mode
}

type SortOption = 'name' | 'code' | 'price' | 'stock'
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'

export default function ItemSelectionModal({
  isOpen,
  onClose,
  onSelect,
  inventory,
  multiSelect = false,
  selectedItems = [],
}: ItemSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name')

  // Get unique categories from inventory
  const categories = useMemo(() => {
    const cats = new Set<string>()
    inventory.forEach(item => {
      const category = (item as any).category || item.dressType || 'Other'
      cats.add(category)
    })
    return ['All', ...Array.from(cats).sort()]
  }, [inventory])

  // Filter and sort inventory
  const filteredInventory = useMemo(() => {
    let filtered = [...inventory]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(item => {
        return (
          item.dressName.toLowerCase().includes(query) ||
          item.dressCode.toLowerCase().includes(query) ||
          item.dressType.toLowerCase().includes(query) ||
          ((item as any).category || '').toLowerCase().includes(query) ||
          (item.fabricType || '').toLowerCase().includes(query)
        )
      })
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => {
        const category = (item as any).category || item.dressType
        return category === selectedCategory
      })
    }

    // Stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(item => {
        const stock = item.currentStock || 0
        if (stockFilter === 'in_stock') return stock > 5
        if (stockFilter === 'low_stock') return stock > 0 && stock <= 5
        if (stockFilter === 'out_of_stock') return stock === 0
        return true
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.dressName.localeCompare(b.dressName)
        case 'code':
          return a.dressCode.localeCompare(b.dressCode)
        case 'price':
          return b.sellingPrice - a.sellingPrice
        case 'stock':
          return (b.currentStock || 0) - (a.currentStock || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [inventory, searchQuery, selectedCategory, stockFilter, sortBy])

  const getStockStatus = (stock: number | undefined): 'in_stock' | 'low_stock' | 'out_of_stock' => {
    if (!stock || stock === 0) return 'out_of_stock'
    if (stock <= 5) return 'low_stock'
    return 'in_stock'
  }

  const getStockStatusColor = (status: 'in_stock' | 'low_stock' | 'out_of_stock'): string => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800 border-green-300'
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-300'
    }
  }

  const getStockStatusText = (status: 'in_stock' | 'low_stock' | 'out_of_stock', stock: number): string => {
    switch (status) {
      case 'in_stock': return `In Stock (${stock})`
      case 'low_stock': return `Low Stock (${stock})`
      case 'out_of_stock': return 'Out of Stock'
    }
  }

  const handleItemSelect = (item: InventoryItem) => {
    const stock = item.currentStock || 0
    const status = getStockStatus(stock)
    
    if (status === 'out_of_stock') {
      alert(`This item is out of stock. Current stock: 0`)
      return
    }
    
    onSelect(item)
    
    // Only close modal if not in multi-select mode
    if (!multiSelect) {
      onClose()
      // Reset filters
      setSearchQuery('')
      setSelectedCategory('All')
      setStockFilter('all')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Select Product</h2>
            {multiSelect && (
              <p className="text-purple-100 text-sm mt-1">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {multiSelect && (
              <button
                onClick={onClose}
                className="bg-white text-purple-600 px-4 py-2 rounded-md hover:bg-purple-50 font-medium transition-colors"
              >
                Done ({selectedItems.length})
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b bg-gray-50">
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, code, type, or category..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3">
            {/* Category Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Stock Status</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as StockFilter)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="name">Name</option>
                <option value="code">Code</option>
                <option value="price">Price (High to Low)</option>
                <option value="stock">Stock (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredInventory.length} of {inventory.length} products
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredInventory.map((item) => {
                const stock = item.currentStock || 0
                const status = getStockStatus(stock)
                const isOutOfStock = status === 'out_of_stock'
                // Get first valid image URL
                let productImage = ''
                if (item.productImages && Array.isArray(item.productImages) && item.productImages.length > 0) {
                  productImage = item.productImages[0] || ''
                } else if (item.imageUrl) {
                  productImage = item.imageUrl
                }
                // Ensure it's a valid URL (starts with http or https)
                if (productImage && !productImage.startsWith('http') && !productImage.startsWith('//')) {
                  productImage = ''
                }
                // Debug: Log image URLs (remove in production)
                if (productImage && process.env.NODE_ENV === 'development') {
                  console.log(`[ItemSelectionModal] Item ${item.dressName}: Image URL = ${productImage}`)
                }
                const category = (item as any).category || item.dressType

                const isSelected = multiSelect && selectedItems.includes(item.id)
                
                return (
                  <div
                    key={item.id}
                    data-item-id={item.id}
                    onClick={() => !isOutOfStock && handleItemSelect(item)}
                    className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 relative ${
                      isOutOfStock
                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-purple-500 bg-purple-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-purple-400 hover:shadow-lg'
                    }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2 left-2 bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center z-10">
                        ✓
                      </div>
                    )}
                    {/* Product Image */}
                    <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                      {productImage && productImage.trim() !== '' && (productImage.startsWith('http') || productImage.startsWith('//')) ? (
                        <>
                          <Image
                            src={productImage}
                            alt={item.dressName}
                            fill
                            className="object-cover"
                            unoptimized
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            onLoad={() => {
                              // Hide placeholder when image loads
                              const parent = document.querySelector(`[data-item-id="${item.id}"]`)
                              if (parent) {
                                const placeholder = parent.querySelector('.placeholder-icon')
                                if (placeholder) {
                                  (placeholder as HTMLElement).style.display = 'none'
                                }
                              }
                            }}
                            onError={(e) => {
                              console.error(`[ItemSelectionModal] Failed to load image for ${item.dressName}:`, productImage)
                              const target = e.target as HTMLImageElement
                              const parent = target.closest('.relative')
                              if (parent) {
                                const img = parent.querySelector('img')
                                const placeholder = parent.querySelector('.placeholder-icon')
                                if (img) img.style.display = 'none'
                                if (placeholder) {
                                  (placeholder as HTMLElement).style.display = 'flex'
                                }
                              }
                            }}
                          />
                          {/* Fallback placeholder (hidden by default, shown on error) */}
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-200 placeholder-icon hidden">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-200">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Stock Badge */}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium border ${getStockStatusColor(status)} z-10`}>
                        {getStockStatusText(status, stock)}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                        {item.dressName}
                      </h3>
                      <p className="text-xs text-gray-500 mb-1">
                        {item.dressCode}
                      </p>
                      <p className="text-xs text-gray-400 mb-2">
                        {category} • {item.dressType}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-purple-600">
                          ₹{item.sellingPrice.toLocaleString()}
                        </span>
                        {item.pricePerMeter && (
                          <span className="text-xs text-gray-500">
                            ₹{item.pricePerMeter}/m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


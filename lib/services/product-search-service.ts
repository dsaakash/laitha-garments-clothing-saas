/**
 * Product Search Service
 * 
 * Provides search functionality for products within purchase orders.
 * Supports:
 * - Case-insensitive partial name matching
 * - Exact SKU/product code matching
 * - Result limiting for performance
 */

import { PurchaseOrderItem } from '../storage'

export interface ProductSearchResult {
    products: PurchaseOrderItem[]
    total: number
    limited: boolean
}

export interface ProductSearchOptions {
    query: string
    limit?: number
}

/**
 * Search products within a purchase order's items
 * 
 * @param items - Array of purchase order items to search
 * @param options - Search options (query, limit)
 * @returns Search results with products, total count, and limited flag
 */
export function searchProducts(
    items: PurchaseOrderItem[],
    options: ProductSearchOptions
): ProductSearchResult {
    const { query, limit = 100 } = options

    // If no query, return all items (up to limit)
    if (!query || query.trim() === '') {
        const total = items.length
        const limited = total > limit
        const products = items.slice(0, limit)

        return {
            products,
            total,
            limited
        }
    }

    const searchTerm = query.trim().toLowerCase()

    // Filter items based on search criteria
    const filtered = items.filter(item => {
        // Case-insensitive partial name match
        const nameMatch = item.productName.toLowerCase().includes(searchTerm)

        // Exact SKU match (if item has an id/code field)
        const skuMatch = item.id === query.trim()

        // Match on category (case-insensitive partial)
        const categoryMatch = item.category?.toLowerCase().includes(searchTerm) || false

        // Match on fabric type (case-insensitive partial)
        const fabricMatch = item.fabricType?.toLowerCase().includes(searchTerm) || false

        return nameMatch || skuMatch || categoryMatch || fabricMatch
    })

    const total = filtered.length
    const limited = total > limit
    const products = filtered.slice(0, limit)

    return {
        products,
        total,
        limited
    }
}

/**
 * Search products by name only (case-insensitive partial match)
 * 
 * @param items - Array of purchase order items
 * @param name - Product name to search for
 * @param limit - Maximum results to return
 * @returns Matching products
 */
export function searchByName(
    items: PurchaseOrderItem[],
    name: string,
    limit: number = 100
): PurchaseOrderItem[] {
    if (!name || name.trim() === '') {
        return []
    }

    const searchTerm = name.trim().toLowerCase()

    return items
        .filter(item => item.productName.toLowerCase().includes(searchTerm))
        .slice(0, limit)
}

/**
 * Search products by exact SKU/product code
 * 
 * @param items - Array of purchase order items
 * @param sku - Product SKU/code to search for
 * @returns Matching products (should be 0 or 1)
 */
export function searchBySKU(
    items: PurchaseOrderItem[],
    sku: string
): PurchaseOrderItem[] {
    if (!sku || sku.trim() === '') {
        return []
    }

    const searchTerm = sku.trim()

    return items.filter(item => item.id === searchTerm)
}

/**
 * Validate search results contain all required fields
 * 
 * @param products - Products to validate
 * @returns True if all products have required fields
 */
export function validateSearchResults(products: PurchaseOrderItem[]): boolean {
    return products.every(product => {
        return (
            product.productName !== undefined &&
            product.category !== undefined &&
            product.pricePerPiece !== undefined &&
            product.quantity !== undefined
        )
    })
}

/**
 * Get product details for display in search results
 * 
 * @param product - Product to format
 * @returns Formatted product details
 */
export function formatProductForDisplay(product: PurchaseOrderItem) {
    return {
        id: product.id || '',
        productName: product.productName,
        category: product.category || 'Uncategorized',
        sizes: product.sizes || [],
        fabricType: product.fabricType || '',
        quantity: product.quantity,
        pricePerPiece: product.pricePerPiece,
        totalAmount: product.totalAmount,
        productImages: product.productImages || []
    }
}

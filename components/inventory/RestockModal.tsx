import { useState, useEffect } from 'react'
import { X, Calendar, Truck, FileText, IndianRupee, Store, AlertCircle } from 'lucide-react'
import { InventoryItem } from '@/lib/storage'
import { format } from 'date-fns'

interface RestockModalProps {
    isOpen: boolean
    onClose: () => void
    item: InventoryItem | null
    onSuccess: () => void
}

export default function RestockModal({ isOpen, onClose, item, onSuccess }: RestockModalProps) {
    const [type, setType] = useState<'in' | 'out' | 'remove-out'>('in')
    const [quantity, setQuantity] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    // PO Creation State
    const [source, setSource] = useState<'purchase' | 'correction'>('purchase')
    const [poData, setPoData] = useState({
        supplierName: '',
        wholesalePrice: '',
        sellingPrice: '',
        billDate: new Date().toISOString().split('T')[0],
        invoiceNumber: ''
    })
    const [showPriceWarning, setShowPriceWarning] = useState(false)
    const [history, setHistory] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    useEffect(() => {
        if (isOpen && item) {
            // Reset form when opening
            setType('in')
            setQuantity('')
            setNotes('')
            setSource('purchase') // Default to purchase
            setPoData({
                supplierName: item.supplierName || '',
                wholesalePrice: item.wholesalePrice.toString(),
                sellingPrice: item.sellingPrice.toString(),
                billDate: new Date().toISOString().split('T')[0],
                invoiceNumber: ''
            })
            setShowPriceWarning(false)

            // Fetch history
            setLoadingHistory(true)
            fetch(`/api/inventory/${item.id}/history`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setHistory(data.data)
                    }
                })
                .catch(err => console.error('Failed to fetch history:', err))
                .finally(() => setLoadingHistory(false))
        }
    }, [isOpen, item])

    // Effect to check for price increase
    useEffect(() => {
        if (source === 'purchase' && type === 'in' && item && poData.wholesalePrice) {
            const newCost = parseFloat(poData.wholesalePrice)
            const oldCost = item.wholesalePrice
            if (!isNaN(newCost) && newCost > oldCost) {
                setShowPriceWarning(true)
            } else {
                setShowPriceWarning(false)
            }
        } else {
            setShowPriceWarning(false)
        }
    }, [poData.wholesalePrice, item, source, type])


    if (!isOpen || !item) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const qty = parseInt(quantity)
        if (isNaN(qty) || qty <= 0) {
            alert('Please enter a valid quantity')
            return
        }

        setLoading(true)
        try {
            if (source === 'purchase' && type === 'in') {
                // Create Purchase Order
                const pricePerPiece = parseFloat(poData.wholesalePrice) || 0
                const sellingPricePerPiece = parseFloat(poData.sellingPrice) || 0
                const totalAmount = qty * pricePerPiece

                const payload = {
                    date: poData.billDate,
                    supplierName: poData.supplierName,
                    customPoNumber: poData.invoiceNumber,
                    notes: notes || `Restock from Inventory: ${item.dressName}`,
                    items: [{
                        productName: item.dressName,
                        category: item.dressType,
                        quantity: qty,
                        pricePerPiece: pricePerPiece,
                        sellingPrice: sellingPricePerPiece,
                        totalAmount: totalAmount,
                        sizes: item.sizes,
                        fabricType: item.fabricType,
                        productImages: item.productImages && item.productImages.length > 0 ? item.productImages : (item.imageUrl ? [item.imageUrl] : [])
                    }],
                }

                const response = await fetch('/api/purchases', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                const result = await response.json()
                if (!result.success) {
                    throw new Error(result.message || 'Failed to create Purchase Order')
                }

                // Check if approval is required
                if (result.approval && result.approval.required) {
                    alert('✅ Purchase Order created successfully!\n\n⚠️ This PO requires approval before stock is updated.\nPlease check the Approvals page for pending requests.')
                } else {
                    alert('✅ Stock added and Purchase Order created successfully!')
                }
            } else {
                // Standard Stock Update (including 'correction' type for 'in')
                const response = await fetch(`/api/inventory/${item.id}/stock`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type,
                        quantity: qty,
                        notes: notes || undefined,
                    }),
                })

                const result = await response.json()
                if (!result.success) {
                    throw new Error(result.message || 'Failed to update stock')
                }

                const successMessages = {
                    'in': 'Stock added successfully!',
                    'out': 'Stock removed/sold successfully!',
                    'remove-out': 'Sale reversed successfully!'
                }
                alert(successMessages[type] || 'Stock updated successfully!')
            }

            onSuccess()
            onClose()
        } catch (error: any) {
            console.error('Operation failed:', error)
            alert(error.message || 'Operation failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Update Stock</h2>
                        <p className="text-sm text-gray-500 truncate max-w-[280px]">{item.dressName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Action Type Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => { setType('in'); setSource('purchase'); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'in' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Add Stock
                        </button>
                        <button
                            type="button"
                            onClick={() => { setType('out'); setSource('purchase'); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'out' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Record Sale
                        </button>
                        <button
                            type="button"
                            onClick={() => { setType('remove-out'); setSource('purchase'); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'remove-out' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Reverse Sale
                        </button>
                    </div>

                    {/* Source Selection for Stock In */}
                    {type === 'in' && (
                        <div className="bg-gray-50 p-3 rounded-md">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                            <div className="flex gap-4">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="source"
                                        value="purchase"
                                        checked={source === 'purchase'}
                                        onChange={() => setSource('purchase')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">New Purchase (Create PO)</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="source"
                                        value="correction"
                                        checked={source === 'correction'}
                                        onChange={() => setSource('correction')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Stock Correction</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Purchase History Verification */}
                    {type === 'in' && source === 'purchase' && (
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                                    Recent Purchase History
                                </h4>
                                {loadingHistory && <span className="text-xs text-blue-500">Loading...</span>}
                            </div>

                            {history.length > 0 ? (
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {history.map((h: any) => (
                                        <div key={h.id} className="text-xs bg-white p-2 rounded border border-blue-100 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-900">{h.supplierName || 'Unknown Supplier'}</p>
                                                <p className="text-gray-500">{h.date} • {h.quantity} units</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">₹{h.pricePerPiece}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setPoData({
                                                        ...poData,
                                                        supplierName: h.supplierName || '',
                                                        wholesalePrice: h.pricePerPiece.toString()
                                                    })}
                                                    className="text-blue-600 hover:text-blue-800 underline mt-1"
                                                >
                                                    Use
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic">No recent purchase history found.</p>
                            )}
                            <p className="text-[10px] text-blue-600 mt-2">
                                * Verify price and supplier from history before creating new PO.
                            </p>
                        </div>
                    )}

                    {/* Quantity Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity {type === 'in' ? 'to Add' : type === 'out' ? 'Sold' : 'to Reverse'} *
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="0"
                            />
                            <div className="absolute right-3 top-2 text-sm text-gray-400">
                                Current: {type === 'remove-out' ? item.quantityOut : item.currentStock}
                            </div>
                        </div>
                    </div>

                    {/* PO Fields - Only show if Source is Purchase and Type is In */}
                    {type === 'in' && source === 'purchase' && (
                        <div className="space-y-4 border-t pt-4 mt-2">
                            <h4 className="font-medium text-gray-900">Purchase Details</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={poData.supplierName}
                                        onChange={(e) => setPoData({ ...poData, supplierName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Supplier Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={poData.billDate}
                                        onChange={(e) => setPoData({ ...poData, billDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Buy Price (Per Unit)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        value={poData.wholesalePrice}
                                        onChange={(e) => setPoData({ ...poData, wholesalePrice: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Cost Price"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No. (Optional)</label>
                                    <input
                                        type="text"
                                        value={poData.invoiceNumber}
                                        onChange={(e) => setPoData({ ...poData, invoiceNumber: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Invoice #"
                                    />
                                </div>
                            </div>

                            {/* Selling Price Update Section */}
                            <div className={`p-3 rounded-md ${showPriceWarning ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Selling Price</label>
                                    {showPriceWarning && (
                                        <span className="text-xs text-yellow-700 font-medium px-2 py-0.5 bg-yellow-100 rounded">
                                            Price Increased! Update?
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        value={poData.sellingPrice}
                                        onChange={(e) => setPoData({ ...poData, sellingPrice: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    {showPriceWarning && (
                                        <div className="text-xs text-gray-500">
                                            Old: ₹{item.sellingPrice}
                                        </div>
                                    )}
                                </div>
                                {showPriceWarning && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Cost price has increased from ₹{item.wholesalePrice} to ₹{poData.wholesalePrice}.
                                        Consider updating selling price.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Add any remarks..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium shadow-sm transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' :
                                type === 'in' ? 'bg-green-600 hover:bg-green-700' :
                                    type === 'out' ? 'bg-orange-600 hover:bg-orange-700' :
                                        'bg-purple-600 hover:bg-purple-700'
                                }`}
                        >
                            {loading ? 'Processing...' :
                                type === 'in' && source === 'purchase' ? 'Create Order & Stock' :
                                    type === 'in' ? 'Add Stock' :
                                        type === 'out' ? 'Remove Stock' :
                                            type === 'remove-out' ? 'Reverse Out' : 'Update Stock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import AdminLayout from '@/components/AdminLayout'
import ImageLightbox from '@/components/ImageLightbox'
import PageHeader from '@/components/PageHeader'
import ActionButton from '@/components/ActionButton'
import StatusBadge from '@/components/StatusBadge'
import { InventoryItem } from '@/lib/storage'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { Plus, Minus, Download, Package2, Edit, Trash2, Eye, Search, Filter, TrendingUp, AlertTriangle, Layers, Activity, ChevronRight, LayoutGrid, LayoutList, CameraOff, Building2, ExternalLink, ArrowLeft, BarChart3, MapPin, Settings2, QrCode, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import RestockModal from '@/components/inventory/RestockModal'
import BarcodeModal from '@/components/inventory/BarcodeModal'

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    dressName: '',
    dressType: '',
    dressCode: '',
    rackNumber: '',
    sizes: '',
    fabricType: '',
    wholesalePrice: '',
    sellingPrice: '',
    pricingUnit: '' as '' | 'piece' | 'meter',
    pricePerPiece: '',
    pricePerMeter: '',
    imageUrl: '',
    productImages: [] as string[],
    supplierName: '',
    supplierAddress: '',
    supplierPhone: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    isDeadstock: false,
  })
  const [uploading, setUploading] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('All')
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [groupBySupplier, setGroupBySupplier] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showBulkStockModal, setShowBulkStockModal] = useState(false)
  // stockFormData replaced by RestockModal internal state
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null)
  const [bulkStockData, setBulkStockData] = useState<{
    itemId: string
    quantity: string
    type: 'in' | 'out' | 'set'
  }[]>([])
  const [showImageLightbox, setShowImageLightbox] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const [showRackModal, setShowRackModal] = useState(false)
  const [rackModalItem, setRackModalItem] = useState<InventoryItem | null>(null)
  const [rackModalInput, setRackModalInput] = useState('')
  const [rackModalLoading, setRackModalLoading] = useState(false)
  const [rackModalSuccess, setRackModalSuccess] = useState(false)

  const [showBarcodeModal, setShowBarcodeModal] = useState(false)
  const [barcodeItem, setBarcodeItem] = useState<InventoryItem | null>(null)

  const [apiSuppliers, setApiSuppliers] = useState<any[]>([])
  const [rackModuleEnabled, setRackModuleEnabled] = useState(false)

  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        if (data.admin && data.admin.tenant_id) {
          fetch(`/api/tenants/${data.admin.tenant_id}`)
            .then(res => res.json())
            .then(tenantData => {
              if (tenantData.success && tenantData.data?.modules?.includes('rack_number')) {
                setRackModuleEnabled(true)
              }
            })
            .catch(console.error)
        } else if (data.admin && data.admin.role === 'superadmin') {
          setRackModuleEnabled(true)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    loadItems()
    loadApiSuppliers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, supplierFilter])

  // Sync selectedItem with the updated items array to avoid stale modal data
  useEffect(() => {
    if (selectedItem) {
      const latestItem = items.find(i => String(i.id) === String(selectedItem.id))
      if (latestItem && JSON.stringify(latestItem) !== JSON.stringify(selectedItem)) {
        setSelectedItem(latestItem)
      }
    }
  }, [items, selectedItem])

  const loadApiSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      const result = await response.json()
      if (result.success) {
        setApiSuppliers(result.data)
      }
    } catch (error) {
      console.error('Failed to load API suppliers:', error)
    }
  }

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showDetailModal) {
          setShowDetailModal(false)
          setSelectedItem(null)
        } else if (showStockModal) {
          setShowStockModal(false)
          setStockItem(null)
        } else if (showBulkStockModal) {
          setShowBulkStockModal(false)
          setBulkStockData([])
        } else if (showModal) {
          setShowModal(false)
          setEditingItem(null)
          setFormData({
            dressName: '',
            dressType: '',
            dressCode: '',
            rackNumber: '',
            sizes: '',
            fabricType: '',
            wholesalePrice: '',
            sellingPrice: '',
            pricingUnit: '',
            pricePerPiece: '',
            pricePerMeter: '',
            imageUrl: '',
            productImages: [],
            supplierName: '',
            supplierAddress: '',
            supplierPhone: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            isDeadstock: false,
          })
        }
      }
    }

    if (showModal || showDetailModal || showStockModal || showBulkStockModal) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [showModal, showDetailModal, showStockModal, showBulkStockModal])



  const loadItems = async () => {
    try {
      const url = supplierFilter && supplierFilter !== 'All'
        ? `/api/inventory?supplier=${encodeURIComponent(supplierFilter)}`
        : '/api/inventory'
      const response = await fetch(url)
      const result = await response.json()
      if (result.success) {
        let filteredItems = result.data

        // Store suppliers list
        if (result.suppliers) {
          setSuppliers(result.suppliers)
        }

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          filteredItems = filteredItems.filter((item: InventoryItem) =>
            item.dressCode.toLowerCase().includes(query) ||
            item.dressName.toLowerCase().includes(query) ||
            (item.supplierName && item.supplierName.toLowerCase().includes(query))
          )
        }

        setItems(filteredItems)
      }
    } catch (error) {
      console.error('Failed to load inventory:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const sizesArray = formData.sizes.split(',').map(s => s.trim()).filter(Boolean)

    try {
      if (editingItem) {
        const response = await fetch(`/api/inventory/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dressName: formData.dressName,
            dressType: formData.dressType,
            dressCode: formData.dressCode,
            rackNumber: formData.rackNumber || undefined,
            sizes: sizesArray,
            fabricType: formData.fabricType || undefined,
            wholesalePrice: parseFloat(formData.wholesalePrice),
            sellingPrice: parseFloat(formData.sellingPrice),
            pricingUnit: formData.pricingUnit || undefined,
            pricePerPiece: formData.pricePerPiece ? parseFloat(formData.pricePerPiece) : undefined,
            pricePerMeter: formData.pricePerMeter ? parseFloat(formData.pricePerMeter) : undefined,
            imageUrl: formData.imageUrl || undefined,
            productImages: formData.productImages.length > 0 ? formData.productImages : undefined,
            supplierName: formData.supplierName || undefined,
            supplierAddress: formData.supplierAddress || undefined,
            supplierPhone: formData.supplierPhone || undefined,
            date: formData.date,
            isDeadstock: formData.isDeadstock,
          }),
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to update item')
          return
        }
      } else {
        const response = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dressName: formData.dressName,
            dressType: formData.dressType,
            dressCode: formData.dressCode,
            rackNumber: formData.rackNumber || undefined,
            sizes: sizesArray,
            fabricType: formData.fabricType || undefined,
            wholesalePrice: parseFloat(formData.wholesalePrice),
            sellingPrice: parseFloat(formData.sellingPrice),
            pricingUnit: formData.pricingUnit || undefined,
            pricePerPiece: formData.pricePerPiece ? parseFloat(formData.pricePerPiece) : undefined,
            pricePerMeter: formData.pricePerMeter ? parseFloat(formData.pricePerMeter) : undefined,
            imageUrl: formData.imageUrl || undefined,
            productImages: formData.productImages.length > 0 ? formData.productImages : undefined,
            supplierName: formData.supplierName || undefined,
            supplierAddress: formData.supplierAddress || undefined,
            supplierPhone: formData.supplierPhone || undefined,
            date: formData.date,
            isDeadstock: formData.isDeadstock,
          }),
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to add item')
          return
        }
      }

      resetForm()
      await loadItems()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save item:', error)
      alert('Failed to save item')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, replaceIndex?: number) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Handle multiple files or single file
    const filesToUpload = Array.from(files)

    // Validate all files
    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        alert('Please select image files only')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
    }

    // If replacing at specific index, only process first file
    if (replaceIndex !== undefined) {
      setUploadingIndex(replaceIndex)
      const file = filesToUpload[0]
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()
        if (data.success) {
          const newImages = [...previewImages]
          newImages[replaceIndex] = data.url
          setPreviewImages(newImages)
          setFormData(prev => ({
            ...prev,
            productImages: newImages
          }))
        } else {
          alert(data.message || 'Failed to upload image')
        }
      } catch (error) {
        alert('Failed to upload image. Please try again.')
      } finally {
        setUploadingIndex(null)
      }
    } else {
      // Adding new images
      setUploading(true)
      try {
        const uploadPromises = filesToUpload.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })
          const data = await response.json()
          if (!data.success) {
            throw new Error(data.message || 'Upload failed')
          }
          return data.url
        })

        const uploadedUrls = await Promise.all(uploadPromises)
        const newImages = [...previewImages, ...uploadedUrls]
        setPreviewImages(newImages)
        setFormData(prev => ({
          ...prev,
          productImages: newImages
        }))
      } catch (error) {
        alert('Failed to upload image. Please try again.')
      } finally {
        setUploading(false)
      }
    }

    // Reset input
    e.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...previewImages]
    newImages.splice(index, 1)
    setPreviewImages(newImages)
    setFormData(prev => ({
      ...prev,
      productImages: newImages
    }))
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    const images = item.productImages && item.productImages.length > 0
      ? item.productImages
      : (item.imageUrl ? [item.imageUrl] : [])
    setFormData({
      dressName: item.dressName,
      dressType: item.dressType,
      dressCode: item.dressCode,
      rackNumber: item.rackNumber || '',
      sizes: item.sizes.join(', '),
      fabricType: item.fabricType || '',
      wholesalePrice: item.wholesalePrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      pricingUnit: item.pricingUnit || '',
      pricePerPiece: item.pricePerPiece?.toString() || '',
      pricePerMeter: item.pricePerMeter?.toString() || '',
      imageUrl: item.imageUrl || '',
      productImages: images,
      supplierName: item.supplierName || '',
      supplierAddress: item.supplierAddress || '',
      supplierPhone: item.supplierPhone || '',
      date: item.createdAt ? item.createdAt.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
      isDeadstock: (item as any).isDeadstock || false,
    })
    setPreviewImages(images)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`/api/inventory/${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to delete item')
          return
        }
        await loadItems()
      } catch (error) {
        console.error('Failed to delete item:', error)
        alert('Failed to delete item')
      }
    }
  }

  const handleSetRack = (item: InventoryItem) => {
    setRackModalItem(item)
    setRackModalInput(item.rackNumber || '')
    setShowRackModal(true)
    setRackModalSuccess(false)
  }

  const submitRackNumber = async () => {
    if (!rackModalItem) return
    const newRack = rackModalInput.trim()
    if (newRack === (rackModalItem.rackNumber || '')) {
      setShowRackModal(false)
      return
    }

    setRackModalLoading(true)
    try {
      const payload = {
        dressName: rackModalItem.dressName,
        dressType: rackModalItem.dressType,
        dressCode: rackModalItem.dressCode,
        rackNumber: newRack,
        sizes: rackModalItem.sizes,
        wholesalePrice: rackModalItem.wholesalePrice,
        sellingPrice: rackModalItem.sellingPrice,
        pricingUnit: rackModalItem.pricingUnit,
        pricePerPiece: rackModalItem.pricePerPiece,
        pricePerMeter: rackModalItem.pricePerMeter,
        imageUrl: rackModalItem.imageUrl,
        productImages: rackModalItem.productImages,
        fabricType: rackModalItem.fabricType,
        supplierName: rackModalItem.supplierName,
        supplierAddress: rackModalItem.supplierAddress,
        supplierPhone: rackModalItem.supplierPhone,
        date: rackModalItem.createdAt ? rackModalItem.createdAt.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
        isDeadstock: (rackModalItem as any).isDeadstock || false,
      }
      
      const response = await fetch(`/api/inventory/${rackModalItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (result.success && result.data) {
        const updatedItem = result.data as InventoryItem
        setRackModalSuccess(true)
        
        // Update the main items list immediately
        setItems(prevItems => 
          prevItems.map(listItem => String(listItem.id) === String(rackModalItem.id) ? updatedItem : listItem)
        )

        // Force selectedItem update immediately with the server's record
        setSelectedItem(updatedItem)
        
        // Refresh anyway to be safe, but the UI is already updated
        await loadItems()
        
        setTimeout(() => {
          setShowRackModal(false)
          setRackModalSuccess(false)
        }, 2000)
      } else {
        alert(result.message || 'Failed to update rack number')
      }
    } catch (error) {
      console.error('Failed to update rack number:', error)
      alert('Error updating rack number')
    } finally {
      if (!rackModalSuccess) {
        setRackModalLoading(false)
      }
    }
  }

  const handleClearRack = async (item: InventoryItem) => {
    if (!confirm('Are you sure you want to completely remove the rack number for this item?')) return

    try {
      const payload = {
        ...item,
        rackNumber: '',
        date: item.createdAt ? item.createdAt.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
      }
      
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (result.success && result.data) {
        const updatedItem = result.data as InventoryItem
        
        // Update the main items list immediately
        setItems(prevItems => 
          prevItems.map(listItem => String(listItem.id) === String(item.id) ? updatedItem : listItem)
        )

        // Update selection if open
        if (selectedItem && String(selectedItem.id) === String(item.id)) {
          setSelectedItem(updatedItem)
        }
        await loadItems()
      } else {
        alert(result.message || 'Failed to clear rack number')
      }
    } catch (error) {
      console.error(error)
      alert('Error clearing rack number')
    }
  }

  const resetForm = () => {
    setFormData({
      dressName: '',
      dressType: '',
      dressCode: '',
      rackNumber: '',
      sizes: '',
      fabricType: '',
      wholesalePrice: '',
      sellingPrice: '',
      pricingUnit: '' as '' | 'piece' | 'meter',
      pricePerPiece: '',
      pricePerMeter: '',
      imageUrl: '',
      productImages: [],
      supplierName: '',
      supplierAddress: '',
      supplierPhone: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      isDeadstock: false,
    })
    setEditingItem(null)
    setPreviewImages([])
  }

  const openStockModal = (item: InventoryItem, initialType?: 'in' | 'out' | 'remove-out') => {
    setStockItem(item)
    // We can pass initialType to modal if needed, but for now modal defaults to 'in' or we can add prop
    setShowStockModal(true)
  }

  const quickStockUpdate = async (itemId: string, type: string, quantity: number) => {
    try {
      const response = await fetch(`/api/inventory/${itemId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          quantity,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        alert(result.message || 'Failed to update stock')
        return
      }

      // Immediately update the item in the state using the API response
      if (result.data) {
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? {
                ...item,
                quantityIn: result.data.quantityIn,
                quantityOut: result.data.quantityOut,
                currentStock: result.data.currentStock
              }
              : item
          )
        )

        // Update selectedItem if detail modal is open and showing this item
        if (showDetailModal && selectedItem && selectedItem.id === itemId) {
          setSelectedItem(prev => prev ? {
            ...prev,
            quantityIn: result.data.quantityIn,
            quantityOut: result.data.quantityOut,
            currentStock: result.data.currentStock
          } : null)
        }
      }

      // Also refresh from server to ensure consistency
      await loadItems()
    } catch (error) {
      console.error('Failed to update stock:', error)
      alert('Failed to update stock')
    }
  }

  const openBulkStockModal = () => {
    // Initialize bulk stock data with all items
    setBulkStockData(
      items.map(item => ({
        itemId: item.id,
        quantity: (item.currentStock || 0).toString(),
        type: 'set' as 'in' | 'out' | 'set',
      }))
    )
    setShowBulkStockModal(true)
  }

  const handleBulkStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let successCount = 0
      let errorCount = 0

      for (const itemData of bulkStockData) {
        const quantity = parseInt(itemData.quantity)
        if (isNaN(quantity) || quantity < 0) {
          continue
        }

        try {
          const item = items.find(i => i.id === itemData.itemId)
          if (!item) continue

          if (itemData.type === 'set') {
            // Set absolute stock value - calculate difference
            const currentStock = item.currentStock || 0
            const stockDifference = quantity - currentStock

            if (stockDifference === 0) continue

            const response = await fetch(`/api/inventory/${itemData.itemId}/stock`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: stockDifference > 0 ? 'in' : 'out',
                quantity: Math.abs(stockDifference),
                notes: 'Bulk stock update - set value',
              }),
            })

            if (response.ok) {
              successCount++
            } else {
              errorCount++
            }
          } else {
            // Add or remove stock
            const response = await fetch(`/api/inventory/${itemData.itemId}/stock`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: itemData.type,
                quantity: quantity,
                notes: 'Bulk stock update',
              }),
            })

            if (response.ok) {
              successCount++
            } else {
              errorCount++
            }
          }
        } catch (error) {
          console.error(`Error updating stock for item ${itemData.itemId}:`, error)
          errorCount++
        }
      }

      alert(`Bulk update completed! Success: ${successCount}, Errors: ${errorCount}`)
      setShowBulkStockModal(false)
      setBulkStockData([])
      await loadItems()
    } catch (error) {
      console.error('Bulk stock update error:', error)
      alert('Failed to update stock')
    }
  }

  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = items.map(item => ({
        'Dress Name': item.dressName,
        'Dress Type': item.dressType,
        'Dress Code': item.dressCode,
        'Sizes': item.sizes.join(', '),
        'Fabric Type': item.fabricType || '',
        'Wholesale Price (₹)': item.wholesalePrice,
        'Selling Price (₹)': item.sellingPrice,
        'Pricing Unit': item.pricingUnit || '',
        'Price Per Piece (₹)': item.pricePerPiece || '',
        'Price Per Meter (₹)': item.pricePerMeter || '',
        'Supplier Name': item.supplierName || '',
        'Supplier Address': item.supplierAddress || '',
        'Supplier Phone': item.supplierPhone || '',
        'Quantity In': item.quantityIn || 0,
        'Quantity Out': item.quantityOut || 0,
        'Current Stock': item.currentStock || 0,
        'Created At': new Date(item.createdAt).toLocaleDateString(),
        'Updated At': new Date(item.updatedAt).toLocaleDateString(),
      }))

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory')

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Dress Name
        { wch: 15 }, // Dress Type
        { wch: 15 }, // Dress Code
        { wch: 20 }, // Sizes
        { wch: 15 }, // Fabric Type
        { wch: 18 }, // Wholesale Price
        { wch: 18 }, // Selling Price
        { wch: 15 }, // Pricing Unit
        { wch: 20 }, // Price Per Piece
        { wch: 20 }, // Price Per Meter
        { wch: 20 }, // Supplier Name
        { wch: 30 }, // Supplier Address
        { wch: 15 }, // Supplier Phone
        { wch: 12 }, // Quantity In
        { wch: 12 }, // Quantity Out
        { wch: 12 }, // Current Stock
        { wch: 12 }, // Created At
        { wch: 12 }, // Updated At
      ]
      ws['!cols'] = colWidths

      // Generate filename with current date
      const filename = `Inventory_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`

      // Save file
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const calculateStockValue = (items: InventoryItem[]) => {
    return items.reduce((total, item) => {
      const stock = Math.max(0, item.currentStock || 0)
      const price = item.sellingPrice || 0
      return total + (stock * price)
    }, 0)
  }

  // Premium Table Action Button Component
  const ActionButton = ({ onClick, icon: Icon, label, variant = 'slate', disabled = false }: { 
    onClick: () => void, 
    icon: any, 
    label: string, 
    variant?: 'slate' | 'emerald' | 'rose' | 'amber' | 'blue' | 'indigo',
    disabled?: boolean
  }) => {
    const variants = {
      slate: 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200',
      emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200',
      rose: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200',
      amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200',
      blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
      indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200',
    }
    
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${variants[variant]}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </button>
    )
  }

  // Premium Inventory Table Renderer
  const renderInventoryTable = (tableItems: InventoryItem[], showSupplier = true) => (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <th className="px-6 py-4 text-left">Asset</th>
            <th className="px-6 py-4 text-left">Details</th>
            <th className="px-6 py-4 text-left">Classification</th>
            <th className="px-6 py-4 text-left">Identity</th>
            {rackModuleEnabled && <th className="px-6 py-4 text-left">Location</th>}
            {showSupplier && <th className="px-6 py-4 text-left">Entity</th>}
            <th className="px-6 py-4 text-left">Valuation</th>
            <th className="px-6 py-4 text-left">Stock Intelligence</th>
            <th className="px-6 py-4 text-right">Operations</th>
          </tr>
        </thead>
        <tbody>
          {tableItems.map((item, idx) => {
             const profit = (item.sellingPrice || 0) - (item.wholesalePrice || 0)
             const images = (item.productImages && item.productImages.length > 0) ? item.productImages : (item.imageUrl ? [item.imageUrl] : [])
             const stockStatus = (item.currentStock || 0) > 10 ? 'healthy' : (item.currentStock || 0) > 0 ? 'warning' : 'critical'
             
             return (
               <motion.tr
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.03 }}
                 key={item.id}
                 className="group/row cursor-pointer"
                 onClick={() => {
                   setSelectedItem(item)
                   setShowDetailModal(true)
                 }}
               >
                 {/* Asset Image */}
                 <td className="bg-white group-hover/row:bg-slate-50 transition-colors rounded-l-[1.5rem] px-6 py-4 border-y border-l border-slate-100">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-100 group-hover/row:border-[var(--accent)]/30 transition-all shadow-sm">
                       {images[0] ? (
                         <Image 
                           src={images[0]} 
                           alt={item.dressName} 
                           fill 
                           className="object-cover transition-transform group-hover/row:scale-110" 
                         />
                       ) : (
                         <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                            <CameraOff className="w-6 h-6" />
                         </div>
                       )}
                       {images.length > 1 && (
                         <div className="absolute bottom-1 right-1 bg-slate-900/80 backdrop-blur-md px-1.5 py-0.5 rounded-lg text-[8px] font-black text-white">
                            +{images.length - 1}
                         </div>
                       )}
                    </div>
                 </td>

                 {/* Details */}
                 <td className="bg-white group-hover/row:bg-slate-50 transition-colors px-6 py-4 border-y border-slate-100">
                    <div className="flex flex-col">
                       <span className="text-slate-900 font-black uppercase tracking-tight text-sm">
                          {item.dressName}
                       </span>
                       <span className="text-slate-400 text-[10px] font-bold flex items-center gap-1.5">
                          {item.isDeadstock && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                          {item.isDeadstock ? 'DEADSTOCK FLAG' : 'SYSTEM ACTIVE'}
                       </span>
                    </div>
                 </td>

                 {/* Classification */}
                 <td className="bg-white group-hover/row:bg-slate-50 transition-colors px-6 py-4 border-y border-slate-100">
                    <div className="flex flex-col">
                       <span className="text-slate-600 font-bold text-xs">{item.dressType}</span>
                       <div className="flex gap-1 mt-1">
                          {item.sizes.slice(0, 2).map((s) => (
                             <span key={s} className="px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-black text-slate-500">{s}</span>
                          ))}
                          {item.sizes.length > 2 && <span className="text-[8px] font-black text-slate-300">+{item.sizes.length - 2}</span>}
                       </div>
                    </div>
                 </td>

                 {/* Identity */}
                 <td className="bg-white group-hover/row:bg-slate-50 transition-colors px-6 py-4 border-y border-slate-100">
                    <code className="px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg text-[10px] font-black border border-[var(--accent)]/20">
                       {item.dressCode}
                    </code>
                 </td>

                 {/* Location */}
                 {rackModuleEnabled && (
                   <td className="bg-white group-hover/row:bg-slate-50 transition-colors px-6 py-4 border-y border-slate-100">
                      {item.rackNumber ? (
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]" />
                           <span className="text-slate-900 font-black text-xs uppercase tracking-widest">{item.rackNumber}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-black text-[10px] uppercase italic">Unmapped</span>
                      )}
                   </td>
                 )}

                 {/* Entity (Supplier) */}
                 {showSupplier && (
                   <td className="bg-white group-hover/row:bg-slate-50 transition-colors px-6 py-4 border-y border-slate-100">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <Building2 className="w-4 h-4 text-slate-400" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-slate-900 font-black text-[10px] uppercase truncate max-w-[120px]">
                               {item.supplierName || 'General'}
                            </span>
                            <span className="text-slate-400 text-[8px] font-bold">{item.supplierPhone || 'INTERNAL'}</span>
                         </div>
                      </div>
                   </td>
                 )}

                 {/* Valuation */}
                 <td className="bg-white group-hover/row:bg-slate-50 transition-colors px-6 py-4 border-y border-slate-100">
                    <div className="flex flex-col">
                       <div className="flex items-baseline gap-1">
                          <span className="text-[10px] font-black text-slate-400">CP</span>
                          <span className="text-slate-900 font-black text-xs tracking-tighter">₹{item.wholesalePrice}</span>
                       </div>
                       <div className="flex items-baseline gap-1">
                          <span className="text-[10px] font-black text-emerald-400">SP</span>
                          <span className="text-slate-900 font-black text-xs tracking-tighter">₹{item.sellingPrice}</span>
                       </div>
                       <span className="text-emerald-500 font-black text-[9px] uppercase tracking-tighter">Margin: ₹{profit}</span>
                    </div>
                 </td>

                 {/* Stock Intelligence */}
                 <td className="bg-white group-hover/row:bg-slate-50 transition-colors px-6 py-4 border-y border-slate-100">
                    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                       <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center justify-center px-3 py-1 bg-slate-900 rounded-xl min-w-[70px]">
                             <span className={`text-[12px] font-black ${
                                stockStatus === 'healthy' ? 'text-emerald-400' : stockStatus === 'warning' ? 'text-amber-400' : 'text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                             }`}>
                                {item.currentStock || 0}
                             </span>
                             <span className="text-[7px] text-slate-500 font-black tracking-widest uppercase">Available</span>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                             <div className="flex gap-1">
                                <button
                                  onClick={() => quickStockUpdate(item.id, 'add-stock', 1)}
                                  className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center"
                                >
                                   <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => quickStockUpdate(item.id, 'remove-stock', 1)}
                                  disabled={(item.currentStock || 0) <= 0}
                                  className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                   <Minus className="w-3.5 h-3.5" />
                                </button>
                             </div>
                             <div className="flex gap-1">
                                <button
                                  onClick={() => quickStockUpdate(item.id, 'out', 1)}
                                  className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center"
                                >
                                   <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => quickStockUpdate(item.id, 'remove-out', 1)}
                                  disabled={(item.quantityOut || 0) <= 0}
                                  className="w-6 h-6 rounded-lg bg-slate-500/10 text-slate-500 border border-slate-500/20 hover:bg-slate-500 hover:text-white transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                   <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          </div>
                          <div className="flex flex-col ml-1">
                             <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Sold Asset: <span className="text-slate-900">{item.quantityOut || 0}</span></span>
                             <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Dead Load: <span className="text-slate-900">{item.isDeadstock ? (item.currentStock || 0) : 0}</span></span>
                          </div>
                       </div>
                    </div>
                 </td>

                 {/* Operations */}
                 <td className="bg-white group-hover/row:bg-slate-50 transition-colors rounded-r-[1.5rem] px-6 py-4 border-y border-r border-slate-100 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                       <ActionButton 
                          onClick={() => openStockModal(item)} 
                          icon={BarChart3} 
                          label="Supply" 
                          variant="emerald" 
                       />
                       {rackModuleEnabled && (
                         <ActionButton 
                            onClick={() => handleSetRack(item)} 
                            icon={MapPin} 
                            label="Locate" 
                            variant="indigo" 
                         />
                       )}
                       <ActionButton 
                          onClick={() => { setBarcodeItem(item); setShowBarcodeModal(true) }} 
                          icon={QrCode} 
                          label="Barcode" 
                          variant="amber" 
                       />
                       <ActionButton 
                          onClick={() => handleEdit(item)} 
                          icon={Settings2} 
                          label="Config" 
                          variant="blue" 
                       />
                       <ActionButton 
                          onClick={() => handleDelete(item.id)} 
                          icon={Trash2} 
                          label="Erase" 
                          variant="rose" 
                       />
                    </div>
                 </td>
               </motion.tr>
             )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <AdminLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header Section - Glassmorphic */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 shadow-2xl">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[var(--accent)]/20 rounded-xl border border-[var(--accent)]/30">
                  <Package2 className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">Inventory Command</h1>
              </div>
              <p className="text-slate-400 font-medium flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                System Live • Real-time Stock Monitoring
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportToExcel}
                className="group relative px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all border border-slate-700 flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Export</span>
              </button>
              <button
                onClick={openBulkStockModal}
                className="group relative px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all border border-slate-700 flex items-center gap-2 shadow-lg"
              >
                <Layers className="w-4 h-4 text-[var(--accent)] group-hover:scale-110 transition-transform" />
                <span>Bulk Stock</span>
              </button>
              <button
                onClick={() => {
                  resetForm()
                  setShowModal(true)
                }}
                className="group relative px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)] flex items-center gap-2 ring-1 ring-white/20"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* StatsRow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Total Products', value: items.length, icon: Package2, color: 'purple' },
              { label: 'Low Stock Items', value: items.filter(i => (i.currentStock || 0) < 10).length, icon: AlertTriangle, color: 'orange' },
              { label: 'Total Inventory Value', value: `₹${calculateStockValue(items).toLocaleString()}`, icon: TrendingUp, color: 'emerald' },
              { label: 'Avg Margin', value: `${items.length > 0 ? Math.round(items.reduce((acc, i) => acc + (i.sellingPrice - i.wholesalePrice), 0) / items.length) : 0}%`, icon: Activity, color: 'blue' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-slate-800/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-all group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-${stat.color}-500/10 rounded-lg group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xl font-black text-white">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[var(--accent)] transition-colors" />
            <input 
              type="text"
              placeholder="Search command center..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] outline-none transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 pr-4"
              >
                <option value="All">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
            
            <label className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-all select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={groupBySupplier}
                  onChange={(e) => setGroupBySupplier(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-[var(--accent)] transition-all" />
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4 shadow-sm" />
              </div>
              <span className="text-sm font-bold text-slate-700">Group by Supplier</span>
            </label>
          </div>
        </div>

        {/* Supplier Summary Card */}
        {supplierFilter !== 'All' && !groupBySupplier && items.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-purple-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{supplierFilter} - Stock Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p className="text-purple-600 text-sm font-medium mb-1">Total Items</p>
                <p className="text-2xl font-bold text-purple-900">{items.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-green-600 text-sm font-medium mb-1">Total Stock Quantity</p>
                <p className="text-2xl font-bold text-green-900">
                  {items.reduce((sum, item) => sum + Math.max(0, item.currentStock || 0), 0)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-blue-600 text-sm font-medium mb-1">Total Stock Value</p>
                <p className="text-2xl font-bold text-blue-900">
                  ₹{calculateStockValue(items).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-20 text-center shadow-xl">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package2 className="w-10 h-10 text-slate-300" />
             </div>
             <p className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Deployment Ready</p>
             <p className="text-slate-500 font-medium">Your inventory database is currently empty. Add your first item to begin tracking.</p>
          </div>
        ) : groupBySupplier ? (
          // Grouped by Supplier View - Premium Cards
          (() => {
            const groupedItems = items.reduce((acc, item) => {
              const supplier = item.supplierName || 'System General'
              if (!acc[supplier]) acc[supplier] = []
              acc[supplier].push(item)
              return acc
            }, {} as Record<string, InventoryItem[]>)

            return (
              <div className="space-y-10">
                {Object.entries(groupedItems).map(([supplier, supplierItems]) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    key={supplier} 
                    className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden group/card"
                  >
                    <div className="bg-slate-900 px-8 py-5 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30">
                            <Layers className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                                {supplier}
                            </h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                {supplierItems.length} Products Active
                            </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="px-4 py-2 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col items-end">
                            <span className="text-[10px] text-slate-500 font-black uppercase">Batch Value</span>
                            <span className="text-emerald-400 font-black tracking-tighter">₹{calculateStockValue(supplierItems).toLocaleString()}</span>
                         </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                        {renderInventoryTable(supplierItems, false)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          })()
        ) : (
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] p-2 shadow-2xl overflow-hidden">
             {renderInventoryTable(items, true)}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dress Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.dressName}
                    onChange={(e) => setFormData({ ...formData, dressName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dress Type *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 2-PC, 3-PC, Kurta"
                    value={formData.dressType}
                    onChange={(e) => setFormData({ ...formData, dressType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dress Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., RJ-1/12"
                    value={formData.dressCode}
                    onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                {rackModuleEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rack Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., A1, Rack-B"
                      value={formData.rackNumber}
                      onChange={(e) => setFormData({ ...formData, rackNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-purple-50/30"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Type (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Cotton, Silk, Polyester, Linen"
                    value={formData.fabricType}
                    onChange={(e) => setFormData({ ...formData, fabricType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sizes * (comma-separated)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., M-38, L-40, XL-42"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price (₹) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.wholesalePrice}
                      onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                </div>

                {/* Pricing Unit Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Unit (Optional)</label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="piece"
                        checked={formData.pricingUnit === 'piece'}
                        onChange={(e) => setFormData({ ...formData, pricingUnit: 'piece' as const, pricePerMeter: '' })}
                        className="mr-2"
                      />
                      <span className="text-sm">By Piece</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="meter"
                        checked={formData.pricingUnit === 'meter'}
                        onChange={(e) => setFormData({ ...formData, pricingUnit: 'meter' as const, pricePerPiece: '' })}
                        className="mr-2"
                      />
                      <span className="text-sm">By Meter</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value=""
                        checked={formData.pricingUnit === ''}
                        onChange={(e) => setFormData({ ...formData, pricingUnit: '' as const, pricePerPiece: '', pricePerMeter: '' })}
                        className="mr-2"
                      />
                      <span className="text-sm">None</span>
                    </label>
                  </div>

                  {formData.pricingUnit === 'piece' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Piece (₹) (optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pricePerPiece}
                        onChange={(e) => setFormData({ ...formData, pricePerPiece: e.target.value })}
                        placeholder="e.g., 500 for ₹500 per piece"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                      <p className="text-xs text-gray-500 mt-1">Set price per piece if selling by individual pieces</p>
                    </div>
                  )}

                  {formData.pricingUnit === 'meter' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Meter (₹) (optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pricePerMeter}
                        onChange={(e) => setFormData({ ...formData, pricePerMeter: e.target.value })}
                        placeholder="e.g., 150 for ₹150 per meter"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                      <p className="text-xs text-gray-500 mt-1">Set price per meter if selling by meter length</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Images (optional)</label>
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center w-full min-h-[8rem] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center py-4 px-2 text-center">
                        <svg className="w-8 h-8 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">Click to attach an image</span> or multiple images</p>
                        <p className="text-xs text-gray-400">PNG, JPG, JPEG (MAX. 5MB per file)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e)}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    {uploading && (
                      <p className="text-sm text-[var(--accent)] font-medium animate-pulse text-center">Uploading images...</p>
                    )}
                    {previewImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                        {previewImages.map((imageUrl, index) => (
                          <div key={index} className="relative group w-full h-24">
                            <Image
                              src={imageUrl}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover rounded border"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(index);
                              }}
                              className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg border border-white/20 hover:bg-rose-600 active:scale-90"
                              title="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute inset-0 z-10 cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, index)}
                                disabled={uploadingIndex === index}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                title="Click to replace image"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">You can upload multiple images. Click on an image to replace it.</p>
                  </div>
                </div>

                {/* Supplier Information Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Supplier Information (Optional)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier/Party Name</label>
                      <input
                        type="text"
                        list="suppliers-list"
                        value={formData.supplierName}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => {
                            const newData = { ...prev, supplierName: value };
                            // Auto-fill phone and address if they select an existing supplier from the API
                            if (apiSuppliers && apiSuppliers.length > 0) {
                              const existingSupplier = apiSuppliers.find(s => s.name === value);
                              if (existingSupplier) {
                                if (!prev.supplierPhone && existingSupplier.phone) {
                                  newData.supplierPhone = existingSupplier.phone;
                                }
                                if (!prev.supplierAddress && existingSupplier.address) {
                                  newData.supplierAddress = existingSupplier.address;
                                }
                              }
                            }
                            return newData;
                          });
                        }}
                        placeholder="Select or enter supplier name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                      <datalist id="suppliers-list">
                        {apiSuppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Phone Number</label>
                      <input
                        type="tel"
                        value={formData.supplierPhone}
                        onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })}
                        placeholder="Enter supplier phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Address</label>
                      <textarea
                        rows={3}
                        value={formData.supplierAddress}
                        onChange={(e) => setFormData({ ...formData, supplierAddress: e.target.value })}
                        placeholder="Enter supplier address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Other Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Added / Restocked</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                    <div className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        id="isDeadstock"
                        checked={formData.isDeadstock}
                        onChange={(e) => setFormData({ ...formData, isDeadstock: e.target.checked })}
                        className="h-4 w-4 text-[var(--accent)] focus:ring-[var(--accent)] border-gray-300 rounded"
                      />
                      <label htmlFor="isDeadstock" className="ml-2 block text-sm text-gray-700">
                        Mark as Deadstock
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                    <button
                    type="submit"
                    className="px-6 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)]"
                  >
                    {editingItem ? 'Update' : 'Add'} Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Inventory Item Details</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedItem(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Images Section */}
                <div>
                  {(() => {
                    const images = (selectedItem.productImages && selectedItem.productImages.length > 0)
                      ? selectedItem.productImages
                      : (selectedItem.imageUrl ? [selectedItem.imageUrl] : [])

                    if (images.length === 0) {
                      return (
                        <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                          No Image Available
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-4">
                        {/* Main Large Image */}
                        <div
                          className="relative w-full h-96 sm:h-[500px] cursor-pointer hover:opacity-90 transition-opacity rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-100"
                          onClick={() => {
                            setLightboxImages(images)
                            setLightboxIndex(0)
                            setShowImageLightbox(true)
                          }}
                        >
                          <Image
                            src={images[0] || ''}
                            alt={`${selectedItem.dressName} - Main Image`}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                            <div className="opacity-0 hover:opacity-100 transition-opacity text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg text-sm font-medium">
                              Click to view full size {images.length > 1 && `(${images.length} images)`}
                            </div>
                          </div>
                        </div>

                        {/* Thumbnail Grid for Multiple Images */}
                        {images.length > 1 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Additional Images ({images.length} total):</p>
                            <div className="grid grid-cols-4 gap-2">
                              {images.map((imageUrl, index) => (
                                <div
                                  key={index}
                                  className="relative w-full h-24 sm:h-32 cursor-pointer hover:opacity-80 transition-opacity rounded-lg border-2 border-gray-200 overflow-hidden hover:border-purple-500"
                                  onClick={() => {
                                    setLightboxImages(images)
                                    setLightboxIndex(index)
                                    setShowImageLightbox(true)
                                  }}
                                >
                                  <Image
                                    src={imageUrl || ''}
                                    alt={`${selectedItem.dressName} - Image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 25vw, 12.5vw"
                                  />
                                  {index === 0 && (
                                    <div className="absolute top-1 left-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded">
                                      Main
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                              Click any image to view full size with navigation
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dress Name</label>
                    <p className="text-lg font-bold text-gray-900">{selectedItem.dressName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Dress Type</label>
                    <p className="text-lg text-gray-900">{selectedItem.dressType}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Dress Code</label>
                    <p className="text-lg text-gray-900 font-mono">{selectedItem.dressCode}</p>
                  </div>

                  {rackModuleEnabled && (
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center justify-between shadow-sm">
                      <div>
                        <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">Rack / Shelf Selection</label>
                        <p className="text-xl font-bold text-gray-900">
                          {selectedItem.rackNumber ? (
                            <span className="bg-white border border-purple-200 px-3 py-1 rounded inline-block">{selectedItem.rackNumber}</span>
                          ) : (
                            <span className="text-gray-400 italic font-medium">Not assigned yet</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {selectedItem.rackNumber && (
                           <button
                             onClick={() => handleClearRack(selectedItem)}
                             className="p-2.5 text-red-600 bg-white hover:bg-red-50 rounded-lg transition-colors border border-red-200 shadow-sm"
                             title="Remove Rack Number"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        )}
                        <button
                          onClick={() => {
                            // Don't close the modal, just open the Rack modal over it
                            handleSetRack(selectedItem)
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 bg-white shadow-sm font-medium"
                          title="Edit Rack Location"
                        >
                          <Edit className="w-4 h-4" />
                          <span>{selectedItem.rackNumber ? 'Edit' : 'Set Rack'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedItem.fabricType && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Fabric Type</label>
                      <p className="text-lg text-gray-900">{selectedItem.fabricType}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Available Sizes</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedItem.sizes.map((size, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Wholesale Price</label>
                      <p className="text-xl font-bold text-gray-900">₹{selectedItem.wholesalePrice}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Selling Price</label>
                      <p className="text-xl font-bold text-green-600">₹{selectedItem.sellingPrice}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-500">Profit per Unit</label>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{selectedItem.sellingPrice - selectedItem.wholesalePrice}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Stock Information</label>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-gray-400">Available Stock</label>
                        <p className={`text-xl font-bold ${(selectedItem.currentStock || 0) > 10 ? 'text-green-600' :
                          (selectedItem.currentStock || 0) > 0 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {selectedItem.currentStock || 0}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400">Quantity Sold</label>
                        <p className="text-xl font-bold text-orange-600">
                          {selectedItem.quantityOut || 0}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 space-y-3">
                      {/* Available Stock Quick Actions */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 min-w-[100px]">Stock:</span>
                        <button
                          onClick={() => quickStockUpdate(selectedItem.id, 'add-stock', 1)}
                          className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded text-sm font-bold border border-green-200"
                          title="Add Available Stock"
                        >
                          +
                        </button>
                        <span className="text-sm font-bold min-w-[50px] text-center text-gray-900">{(selectedItem.currentStock || 0)}</span>
                        <button
                          onClick={() => quickStockUpdate(selectedItem.id, 'remove-stock', 1)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded text-sm font-bold border border-red-200"
                          title="Remove Available Stock"
                          disabled={(selectedItem.currentStock || 0) <= 0}
                        >
                          -
                        </button>
                      </div>

                      {/* Quantity Sold (Out) Quick Actions */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 min-w-[100px]">Sold:</span>
                        <button
                          onClick={() => quickStockUpdate(selectedItem.id, 'out', 1)}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded text-sm font-bold border border-orange-200"
                          title="Record Sale (Increase Sold Quantity)"
                        >
                          +
                        </button>
                        <span className="text-sm font-bold min-w-[50px] text-center text-gray-900">{(selectedItem.quantityOut || 0)}</span>
                        <button
                          onClick={() => quickStockUpdate(selectedItem.id, 'remove-out', 1)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-sm font-bold border border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reverse Sale (Decrease Sold Quantity)"
                        >
                          -
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedItem.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {(selectedItem.supplierName || selectedItem.supplierPhone || selectedItem.supplierAddress) && (
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Supplier Information</label>
                      {selectedItem.supplierName && (
                        <p className="text-sm text-gray-900 mb-1">
                          <span className="font-medium">Name:</span> {selectedItem.supplierName}
                        </p>
                      )}
                      {selectedItem.supplierPhone && (
                        <p className="text-sm text-gray-900 mb-1">
                          <span className="font-medium">Phone:</span> {selectedItem.supplierPhone}
                        </p>
                      )}
                      {selectedItem.supplierAddress && (
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Address:</span> {selectedItem.supplierAddress}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        handleEdit(selectedItem)
                      }}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      ✏️ Edit Item
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        setSelectedItem(null)
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Update Modal */}
        <RestockModal
          isOpen={showStockModal}
          onClose={() => {
            setShowStockModal(false)
            setStockItem(null)
          }}
          item={stockItem}
          onSuccess={loadItems}
        />

        {/* Barcode Modal */}
        <BarcodeModal
          isOpen={showBarcodeModal}
          onClose={() => { setShowBarcodeModal(false); setBarcodeItem(null) }}
          item={barcodeItem}
        />

        {/* Bulk Stock Update Modal */}
        {showBulkStockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Bulk Stock Update</h2>
              <form onSubmit={handleBulkStockUpdate} className="space-y-4">
                <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bulkStockData.map((itemData, idx) => {
                        const item = items.find(i => i.id === itemData.itemId)
                        if (!item) return null
                        return (
                          <tr key={itemData.itemId}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.dressName}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.currentStock || 0}</td>
                            <td className="px-4 py-3">
                              <select
                                value={itemData.type}
                                onChange={(e) => {
                                  const newData = [...bulkStockData]
                                  newData[idx].type = e.target.value as 'in' | 'out' | 'set'
                                  setBulkStockData(newData)
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="set">Set Stock</option>
                                <option value="in">Add Stock</option>
                                <option value="out">Remove Stock</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={itemData.quantity}
                                onChange={(e) => {
                                  const newData = [...bulkStockData]
                                  newData[idx].quantity = e.target.value
                                  setBulkStockData(newData)
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm w-24"
                                placeholder="Qty"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkStockModal(false)
                      setBulkStockData([])
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Update All Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Set Rack Modal */}
        {showRackModal && rackModalItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl transform transition-all">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Set Rack Number</h3>
                <button
                  onClick={() => !rackModalLoading && setShowRackModal(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={rackModalLoading}
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Update rack placement for <span className="font-semibold">{rackModalItem.dressName}</span>
              </p>
              
              {rackModalSuccess ? (
                <div className="bg-green-50 text-green-700 py-6 px-4 rounded-lg flex flex-col items-center justify-center border border-green-200">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-medium text-center">Rack successfully updated to <br/><span className="font-bold text-lg mt-1 block px-3 py-1 bg-green-200/50 rounded inline-block">{rackModalInput || '(Empty)'}</span></p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rack / Shelf Identifier</label>
                    <input
                      type="text"
                      placeholder="e.g. A1, Shelf-2"
                      value={rackModalInput}
                      onChange={(e) => setRackModalInput(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/10 placeholder-gray-400 font-medium"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !rackModalLoading) {
                          e.preventDefault()
                          submitRackNumber()
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-3 border-t mt-5">
                    <button
                      onClick={() => setShowRackModal(false)}
                      disabled={rackModalLoading}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitRackNumber}
                      disabled={rackModalLoading}
                      className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 min-w-[100px] justify-center shadow-md"
                    >
                      {rackModalLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Lightbox */}
        {showImageLightbox && (
          <ImageLightbox
            images={lightboxImages}
            currentIndex={lightboxIndex}
            onClose={() => setShowImageLightbox(false)}
          />
        )}
      </motion.div>
    </AdminLayout>
  )
}


'use client'

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import AdminLayout from '@/components/AdminLayout'
import ItemSelectionModal from '@/components/ItemSelectionModal'
import { Sale, InventoryItem, Customer } from '@/lib/storage'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Filter, Calendar, TrendingUp, DollarSign, 
  Users, ShoppingBag, Edit, Trash2, CreditCard, ChevronDown, CheckCircle, XCircle, Link, ScanBarcode
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import ActionButton from '@/components/ActionButton'

function SalesPageContent() {
  const searchParams = useSearchParams()
  const [sales, setSales] = useState<Sale[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [useCustomer, setUseCustomer] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  })
  const [showItemModal, setShowItemModal] = useState(false)
  const [itemModalIndex, setItemModalIndex] = useState<number | null>(null)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [searchPartyName, setSearchPartyName] = useState<string>('')
  const [selectedParty, setSelectedParty] = useState<string>('All')
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [salesSummary, setSalesSummary] = useState<{
    totalSales: number
    totalRevenue: number
    averageSale: number
    dateRange: { from: string; to: string } | null
  } | null>(null)
  const [uniqueParties, setUniqueParties] = useState<string[]>([])
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    partyName: '',
    customerId: '',
    billNumber: '',
    paymentMode: 'Cash',
    upiTransactionId: '',
    upiId: '',
    paymentStatus: 'paid' as 'paid' | 'pending' | 'due' | 'failed',
    saleImage: '',
    items: [] as Array<{
      inventoryId: string
      size: string
      quantity: number
      usePerMeter: boolean
      meters?: number
    }>,
    discountType: '' as '' | 'percentage' | 'rupees',
    discountPercentage: 0,
    discountAmount: 0,
    gstType: '' as '' | 'percentage' | 'rupees',
    gstPercentage: 0,
    gstAmount: 0,
  })
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null)
  const [stickerPosition, setStickerPosition] = useState({ x: 50, y: 50 })
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [rackModuleEnabled, setRackModuleEnabled] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [barcodeError, setBarcodeError] = useState('')
  const barcodeInputRef = React.useRef<HTMLInputElement>(null)

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

  const stopCamera = useCallback(() => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    } catch (error) {
      console.error('Error stopping camera:', error)
    }
    setShowCamera(false)
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      partyName: '',
      customerId: '',
      billNumber: '',
      paymentMode: 'Cash',
      upiTransactionId: '',
      upiId: '',
      paymentStatus: 'paid' as 'paid' | 'pending' | 'due' | 'failed',
      saleImage: '',
      items: [] as Array<{
        inventoryId: string
        size: string
        quantity: number
        usePerMeter: boolean
        meters?: number
      }>,
      discountType: '' as '' | 'percentage' | 'rupees',
      discountPercentage: 0,
      discountAmount: 0,
      gstType: '' as '' | 'percentage' | 'rupees',
      gstPercentage: 0,
      gstAmount: 0,
    })
    setEditingSale(null)
    setUseCustomer(false)
    setCapturedImage(null)
    setShowCamera(false)
    setSelectedSticker(null)
    stopCamera()
  }, [stopCamera])

  useEffect(() => {
    loadData()
    
    // Check for action=new in URL
    if (searchParams.get('action') === 'new') {
      setShowModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchNextBillNumber = useCallback(async () => {
    try {
      const response = await fetch(`/api/sales/next-bill-number?date=${formData.date}`, { credentials: 'include' })
      const result = await response.json()
      if (result.success && result.billNumber) {
        setFormData(prev => ({ ...prev, billNumber: result.billNumber }))
      }
    } catch (error) {
      console.error('Failed to fetch next bill number:', error)
    }
  }, [formData.date])

  // Fetch next bill number when modal opens or date changes
  useEffect(() => {
    if (showModal && !editingSale) {
      fetchNextBillNumber()
    }
  }, [showModal, formData.date, editingSale, fetchNextBillNumber])

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCamera) {
          setShowCamera(false)
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }
        } else if (showModal) {
          setShowModal(false)
          resetForm()
        }
      }
    }

    if (showModal || showCamera) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [showModal, showCamera, resetForm])

  useEffect(() => {
    loadSales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterYear, filterDate, selectedParty, filterStatus])

  useEffect(() => {
    // Extract unique party names from sales
    const parties = Array.from(new Set(sales.map(sale => sale.partyName))).sort()
    setUniqueParties(parties)
  }, [sales])

  const loadSalesSummary = useCallback(async (partyName: string | null) => {
    try {
      const params = new URLSearchParams()
      if (partyName) {
        params.append('partyName', partyName)
      }
      if (filterDate) {
        params.append('startDate', filterDate)
        params.append('endDate', filterDate)
      } else if (filterYear) {
        const startDate = `${filterYear}-01-01`
        const endDate = `${filterYear}-12-31`
        params.append('startDate', startDate)
        params.append('endDate', endDate)
      } else if (filterMonth && filterYear) {
        // If month is selected, use that month's date range
        const daysInMonth = new Date(parseInt(filterYear), parseInt(filterMonth), 0).getDate()
        const startDate = `${filterYear}-${filterMonth}-01`
        const endDate = `${filterYear}-${filterMonth}-${String(daysInMonth).padStart(2, '0')}`
        params.append('startDate', startDate)
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/sales/summary?${params.toString()}`, { credentials: 'include' })
      const result = await response.json()
      if (result.success) {
        setSalesSummary(result.data)
      }
    } catch (error) {
      console.error('Failed to load sales summary:', error)
    }
  }, [filterMonth, filterYear, filterDate])

  useEffect(() => {
    // Load sales summary for selected party or all parties
    if (selectedParty !== 'All') {
      loadSalesSummary(selectedParty)
    } else {
      // Load summary for all parties
      loadSalesSummary(null)
    }
  }, [selectedParty, filterMonth, filterYear, filterDate, loadSalesSummary])

  const loadData = async () => {
    try {
      const [inventoryRes, customersRes] = await Promise.all([
        fetch('/api/inventory', { credentials: 'include' }),
        fetch('/api/customers', { credentials: 'include' }),
      ])
      const inventoryResult = await inventoryRes.json()
      const customersResult = await customersRes.json()
      if (inventoryResult.success) {
        setInventory(inventoryResult.data)
      }
      if (customersResult.success) {
        setCustomers(customersResult.data)
      }
      await loadSales()
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const loadSales = async () => {
    try {
      const params = new URLSearchParams()
      if (filterDate) params.append('date', filterDate)
      if (filterYear) params.append('year', filterYear)
      if (filterMonth) params.append('month', filterMonth)
      if (selectedParty && selectedParty !== 'All') {
        params.append('partyName', selectedParty)
      }
      if (filterStatus && filterStatus !== 'All') {
        params.append('paymentStatus', filterStatus)
      }

      const response = await fetch(`/api/sales?${params.toString()}`, { credentials: 'include' })
      const result = await response.json()
      if (result.success) {
        setSales(result.data)
      }
    } catch (error) {
      console.error('Failed to load sales:', error)
    }
  }


  const handleBarcodeScan = (code: string) => {
    const trimmedCode = code.trim()
    if (!trimmedCode) return

    // Find inventory item by dressCode
    const found = inventory.find(
      inv => inv.dressCode && inv.dressCode.toLowerCase() === trimmedCode.toLowerCase()
    )

    if (!found) {
      setBarcodeError(`No product found for code: "${trimmedCode}"`)
      setTimeout(() => setBarcodeError(''), 3000)
      setBarcodeInput('')
      return
    }

    const stock = found.currentStock || 0
    if (stock <= 0) {
      setBarcodeError(`"${found.dressName}" is out of stock`)
      setTimeout(() => setBarcodeError(''), 3000)
      setBarcodeInput('')
      return
    }

    // Auto-select first size if only one, otherwise leave blank for user to pick
    const autoSize = found.sizes && found.sizes.length === 1 ? found.sizes[0] : ''

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        inventoryId: found.id,
        size: autoSize,
        quantity: 1,
        usePerMeter: false,
      }]
    }))
    setBarcodeError('')
    setBarcodeInput('')
  }

  const handleAddItem = () => {
    const newIndex = formData.items.length
    setFormData({
      ...formData,
      items: [...formData.items, { inventoryId: '', size: '', quantity: 1, usePerMeter: false }],
    })
    setItemModalIndex(newIndex)
    setShowItemModal(true)
  }

  const handleItemSelect = (item: InventoryItem, index: number) => {
    const stock = item.currentStock || 0
    const status = getStockStatus(stock)

    if (status === 'out_of_stock') {
      alert(`This item is out of stock. Current stock: 0`)
      return
    }

    handleItemChange(index, 'inventoryId', item.id)
    setShowItemModal(false)
    setItemModalIndex(null)
  }

  const handleOpenItemModal = (index: number) => {
    setItemModalIndex(index)
    setShowItemModal(true)
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  // Webcam functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setShowCamera(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        // Add sticker if selected
        if (selectedSticker) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.9)'
          ctx.font = `${Math.min(canvas.width, canvas.height) * 0.1}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(
            selectedSticker,
            (stickerPosition.x / 100) * canvas.width,
            (stickerPosition.y / 100) * canvas.height
          )
        }

        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImage(imageData)
        setFormData({ ...formData, saleImage: imageData })
        stopCamera()
      }
    }
  }

  const stickers = [
    '✅', '✓', '✓✓', 'SOLD', 'PAID', '✓ SOLD', 'DELIVERED', '✓✓✓'
  ]

  const addStickerToImage = (sticker: string) => {
    if (capturedImage) {
      const img = new window.Image()
      img.onload = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (ctx) {
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)

            // Add text sticker
            ctx.fillStyle = 'rgba(34, 197, 94, 0.9)'
            ctx.font = `${Math.min(canvas.width, canvas.height) * 0.1}px Arial`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(
              sticker,
              (stickerPosition.x / 100) * canvas.width,
              (stickerPosition.y / 100) * canvas.height
            )

            const imageData = canvas.toDataURL('image/jpeg', 0.9)
            setCapturedImage(imageData)
            setFormData({ ...formData, saleImage: imageData })
          }
        }
      }
      img.src = capturedImage
    } else {
      setSelectedSticker(sticker)
    }
  }


  const handlePaymentModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPaymentMode = e.target.value
    // Set default payment status based on payment mode
    let defaultStatus: 'paid' | 'pending' | 'due' | 'failed' = 'paid'
    if (newPaymentMode.startsWith('UPI') || newPaymentMode === 'Bank Transfer') {
      defaultStatus = 'pending'
    }
    setFormData({
      ...formData,
      paymentMode: newPaymentMode,
      paymentStatus: defaultStatus
    })
  }

  const getPaymentStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-300'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'due': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'failed': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return '✅'
      case 'pending': return '⏳'
      case 'due': return '📅'
      case 'failed': return '❌'
      default: return '❓'
    }
  }


  const handleUpdatePaymentStatus = async (saleId: string, newStatus: 'paid' | 'pending' | 'due' | 'failed') => {
    try {
      const response = await fetch(`/api/sales/${saleId}/payment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      })

      const result = await response.json()
      if (result.success) {
        // Update the sale in the local state immediately for better UX
        setSales(prevSales =>
          prevSales.map(sale =>
            sale.id === saleId
              ? { ...sale, paymentStatus: newStatus }
              : sale
          )
        )
        // Reload sales to ensure consistency
        await loadSales()
      } else {
        console.error('Payment status update failed:', result)
        alert(`Failed to update payment status: ${result.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to update payment status:', error)
      alert(`Failed to update payment status: ${error instanceof Error ? error.message : 'Network error'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const saleItems = formData.items.map(itemForm => {
        const invItem = inventory.find(i => i.id === itemForm.inventoryId)
        if (!invItem) throw new Error('Inventory item not found')

        // Ensure dressCode is always present - this is critical for invoices
        const dressCode = invItem.dressCode || ''
        if (!dressCode || dressCode.trim() === '') {
          console.warn(`⚠️ Warning: Inventory item "${invItem.dressName}" (ID: ${invItem.id}) has no dressCode`)
          alert(`Warning: Item "${invItem.dressName}" has no dress code. Please update the inventory item first.`)
        }

        const purchasePrice = invItem.wholesalePrice
        let sellingPrice = invItem.sellingPrice
        let quantity = itemForm.quantity
        let usePerMeter = itemForm.usePerMeter || false
        let meters = itemForm.meters || 0

        // If using per meter pricing
        if (usePerMeter && invItem.pricePerMeter && meters > 0) {
          sellingPrice = invItem.pricePerMeter
          quantity = meters
        }

        const profit = (sellingPrice - purchasePrice) * quantity

        return {
          inventoryId: itemForm.inventoryId,
          dressName: invItem.dressName,
          dressType: invItem.dressType,
          dressCode: dressCode, // Always include dressCode - API will fetch from inventory if missing
          size: itemForm.size,
          quantity,
          usePerMeter,
          meters: usePerMeter ? meters : undefined,
          pricePerMeter: usePerMeter ? invItem.pricePerMeter : undefined,
          purchasePrice,
          sellingPrice,
          profit,
        }
      })

      // Calculate subtotal
      const subtotal = saleItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0)

      // Calculate discount
      let discountAmount = 0
      if (formData.discountType === 'percentage' && formData.discountPercentage > 0) {
        discountAmount = (subtotal * formData.discountPercentage) / 100
      } else if (formData.discountType === 'rupees' && formData.discountAmount > 0) {
        discountAmount = formData.discountAmount
      }

      // Calculate amount after discount
      const amountAfterDiscount = subtotal - discountAmount

      // Calculate GST
      let gstAmount = 0
      if (formData.gstType === 'percentage' && formData.gstPercentage > 0) {
        gstAmount = (amountAfterDiscount * formData.gstPercentage) / 100
      } else if (formData.gstType === 'rupees' && formData.gstAmount > 0) {
        gstAmount = formData.gstAmount
      }

      // Calculate final total
      const finalTotal = amountAfterDiscount + gstAmount

      const url = editingSale ? `/api/sales/${editingSale.id}` : '/api/sales'
      const method = editingSale ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          partyName: formData.partyName,
          customerId: useCustomer && formData.customerId ? formData.customerId : undefined,
          billNumber: formData.billNumber,
          items: saleItems,
          subtotal,
          discountType: formData.discountType || undefined,
          discountPercentage: formData.discountPercentage || undefined,
          discountAmount: discountAmount || undefined,
          gstType: formData.gstType || undefined,
          gstPercentage: formData.gstPercentage || undefined,
          gstAmount: gstAmount || undefined,
          totalAmount: finalTotal,
          finalTotal,
          paymentMode: formData.paymentMode,
          upiTransactionId: formData.upiTransactionId || undefined,
          upiId: formData.upiId || undefined,
          paymentStatus: formData.paymentStatus || 'paid',
          saleImage: formData.saleImage || undefined,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        const errorMsg = result.error || result.message || 'Unknown error'
        console.error('Sale update error:', result)
        alert(`Failed to ${editingSale ? 'update' : 'add'} sale: ${errorMsg}`)
        return
      }

      resetForm()
      await loadSales()
      setShowModal(false)
      setEditingSale(null)
    } catch (error) {
      console.error('Failed to save sale:', error)
      alert('Failed to save sale')
    }
  }

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale)
    setFormData({
      date: sale.date,
      partyName: sale.partyName,
      customerId: sale.customerId || '',
      billNumber: sale.billNumber,
      paymentMode: sale.paymentMode,
      upiTransactionId: sale.upiTransactionId || '',
      upiId: sale.upiId || '',
      paymentStatus: sale.paymentStatus || 'paid',
      saleImage: sale.saleImage || '',
      items: sale.items.map(item => ({
        inventoryId: item.inventoryId || '',
        size: item.size,
        quantity: item.quantity,
        usePerMeter: item.usePerMeter || false,
        meters: item.meters,
      })),
      discountType: sale.discountType || '',
      discountPercentage: sale.discountPercentage || 0,
      discountAmount: sale.discountAmount || 0,
      gstType: sale.gstType || '',
      gstPercentage: sale.gstPercentage || 0,
      gstAmount: sale.gstAmount || 0,
    })
    setUseCustomer(!!sale.customerId)
    setCapturedImage(sale.saleImage || null)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sale? This will restore inventory stock.')) {
      return
    }

    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (!result.success) {
        alert('Failed to delete sale')
        return
      }
      await loadSales()
    } catch (error) {
      console.error('Failed to delete sale:', error)
      alert('Failed to delete sale')
    }
  }

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        partyName: customer.name,
      }))
    }
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/customers', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerFormData),
      })
      const result = await response.json()

      if (!result.success) {
        alert('Failed to create customer')
        return
      }

      // Reload customers list
      await loadData()

      // Auto-select the newly created customer
      if (result.data && result.data.id) {
        setFormData(prev => ({
          ...prev,
          customerId: result.data.id,
          partyName: result.data.name,
        }))
        setUseCustomer(true)
      }

      // Close customer modal and reset form
      setCustomerFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
      })
      setShowCustomerModal(false)
    } catch (error) {
      console.error('Failed to create customer:', error)
      alert('Failed to create customer')
    }
  }

  const getSelectedInventoryItem = (inventoryId: string) => {
    return inventory.find(item => item.id === inventoryId)
  }

  const getStockStatus = (stock: number | undefined): 'in_stock' | 'low_stock' | 'out_of_stock' => {
    if (!stock || stock === 0) return 'out_of_stock'
    if (stock <= 5) return 'low_stock'
    return 'in_stock'
  }

  const getStockStatusColor = (status: 'in_stock' | 'low_stock' | 'out_of_stock'): string => {
    switch (status) {
      case 'in_stock': return 'text-green-600 bg-green-50 border-green-200'
      case 'low_stock': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'out_of_stock': return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  const getStockStatusText = (status: 'in_stock' | 'low_stock' | 'out_of_stock', stock: number): string => {
    switch (status) {
      case 'in_stock': return `In Stock (${stock} available)`
      case 'low_stock': return `Low Stock (${stock} available)`
      case 'out_of_stock': return 'Out of Stock'
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans selection:bg-purple-500/30">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-700/50 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                <ShoppingBag className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Sales Command Center
                </h1>
                <p className="text-slate-400 mt-1">Real-time revenue & transaction tracking</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-white transition-all duration-300 bg-[var(--accent)] rounded-full hover:brightness-110 hover:shadow-[0_0_40px_8px_rgba(var(--accent-rgb),0.3)] hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 rounded-full bg-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Record New Sale</span>
            </button>
          </div>

          {/* Stats Row */}
          {salesSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700/50 hover:bg-slate-800/80 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Sales</p>
                    <p className="text-2xl font-bold text-white">{salesSummary.totalSales}</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700/50 hover:bg-slate-800/80 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">₹{salesSummary.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700/50 hover:bg-slate-800/80 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--accent)] bg-opacity-20 rounded-2xl group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-[var(--accent)]" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Average Sale</p>
                    <p className="text-2xl font-bold text-white">₹{Math.round(salesSummary.averageSale).toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700/50 hover:bg-slate-800/80 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Date Range</p>
                    {salesSummary.dateRange ? (
                      <p className="text-sm font-bold text-white mt-1">
                        {format(new Date(salesSummary.dateRange.from), 'dd MMM yyyy')} - {format(new Date(salesSummary.dateRange.to), 'dd MMM yyyy')}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-white mt-1">N/A</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700/50 backdrop-blur-xl">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Quick Search by Party Name..."
                  value={searchPartyName}
                  onChange={(e) => {
                    setSearchPartyName(e.target.value)
                    if (e.target.value) setSelectedParty('All')
                  }}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all placeholder:text-slate-500"
                  style={{ '--tw-ring-color': 'rgba(var(--accent-rgb), 0.5)', borderColor: 'rgba(var(--accent-rgb), 0.2)' } as any}
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="relative min-w-[160px]">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={selectedParty}
                    onChange={(e) => {
                      setSelectedParty(e.target.value)
                      setSearchPartyName('')
                    }}
                    className="w-full appearance-none bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-11 pr-10 py-3 focus:outline-none focus:ring-2 transition-all font-medium"
                    style={{ '--tw-ring-color': 'rgba(var(--accent-rgb), 0.3)' } as any}
                  >
                    <option value="All">All Parties</option>
                    {uniqueParties.map(party => (
                      <option key={party} value={party}>{party}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value)
                      if (e.target.value) {
                        setFilterMonth('')
                        setFilterYear('')
                      }
                    }}
                    className="bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': 'rgba(var(--accent-rgb), 0.3)' } as any}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={filterMonth}
                    onChange={(e) => {
                      setFilterMonth(e.target.value)
                      if (e.target.value) setFilterDate('')
                    }}
                    className="appearance-none bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': 'rgba(var(--accent-rgb), 0.3)' } as any}
                  >
                    <option value="">All Months</option>
                    <option value="01">Jan</option>
                    <option value="02">Feb</option>
                    <option value="03">Mar</option>
                    <option value="04">Apr</option>
                    <option value="05">May</option>
                    <option value="06">Jun</option>
                    <option value="07">Jul</option>
                    <option value="08">Aug</option>
                    <option value="09">Sep</option>
                    <option value="10">Oct</option>
                    <option value="11">Nov</option>
                    <option value="12">Dec</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterYear}
                    onChange={(e) => {
                      setFilterYear(e.target.value)
                      if (e.target.value) setFilterDate('')
                    }}
                    className="appearance-none bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': 'rgba(var(--accent-rgb), 0.3)' } as any}
                  >
                    <option value="">All Years</option>
                    {years.map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-700">
                {[
                  { id: 'All', label: 'All' },
                  { id: 'paid', label: 'Paid' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'due', label: 'Not Paid' }
                ].map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setFilterStatus(status.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      filterStatus === status.id
                        ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              {(filterMonth || filterYear || searchPartyName || selectedParty !== 'All' || filterStatus !== 'All') && (
                <button
                  onClick={() => {
                    setFilterDate('')
                    setFilterMonth('')
                    setFilterYear('')
                    setSearchPartyName('')
                    setSelectedParty('All')
                    setFilterStatus('All')
                  }}
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-700/50"
                >
                  <XCircle className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        {(() => {
          // Filter sales based on search and date filters
          let filteredSales = sales.filter(sale => {
            // Party Filter
            if (selectedParty !== 'All' && sale.partyName !== selectedParty) return false
            
            // Search Filter
            if (searchPartyName && !sale.partyName.toLowerCase().includes(searchPartyName.toLowerCase())) return false
            
            // Status Filter
            if (filterStatus !== 'All') {
              if (sale.paymentStatus !== filterStatus) return false
            }
            
            // Date Filters
            const saleDate = new Date(sale.date)
            if (filterDate) {
              const d = new Date(filterDate)
              if (saleDate.toDateString() !== d.toDateString()) return false
            }
            if (filterMonth) {
              if (format(saleDate, 'MM') !== filterMonth) return false
            }
            if (filterYear) {
              if (saleDate.getFullYear().toString() !== filterYear) return false
            }
            
            return true
          })

          if (filteredSales.length === 0) {
            return (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="bg-slate-800/50 rounded-[2rem] border border-slate-700/50 p-12 text-center backdrop-blur-xl"
              >
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
                  <ShoppingBag className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Sales Found</h3>
                <p className="text-slate-400">
                  {searchPartyName || filterMonth || filterYear || filterStatus !== 'All'
                    ? `No sales found matching your filters.`
                    : 'No sales recorded yet. Record your first sale!'}
                </p>
              </motion.div>
            )
          }

          return (
            <div className="bg-slate-800/50 rounded-[2.5rem] border border-slate-700/50 shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="p-4 sm:p-6 text-sm font-semibold text-slate-300">Party / Details</th>
                      <th className="p-4 sm:p-6 text-sm font-semibold text-slate-300">Items (Qty)</th>
                      <th className="p-4 sm:p-6 text-sm font-semibold text-slate-300">Total / Profit</th>
                      <th className="p-4 sm:p-6 text-sm font-semibold text-slate-300">Payment</th>
                      <th className="p-4 sm:p-6 text-sm font-semibold text-slate-300">Status</th>
                      <th className="p-4 sm:p-6 text-sm font-semibold text-slate-300 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    <AnimatePresence>
                      {filteredSales.map((sale) => {
                        const totalProfit = sale.items.reduce((sum, item) => sum + item.profit, 0)
                        return (
                          <motion.tr
                            key={sale.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="group hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="p-4 sm:p-6 align-top">
                              <div className="flex flex-col gap-1.5">
                                <span className="font-bold text-white text-lg">{sale.partyName}</span>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                  <Calendar className="w-4 h-4 text-slate-500" />
                                  <span>{format(new Date(sale.date), 'dd MMM yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono">
                                    {sale.billNumber}
                                  </span>
                                </div>
                              </div>
                            </td>
                            
                            <td className="p-4 sm:p-6 align-top min-w-[250px]">
                              <div className="space-y-2">
                                {sale.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm p-2 rounded-lg bg-slate-800/30 border border-slate-700/30">
                                    <div>
                                      <p className="font-medium text-slate-200">{item.dressName}</p>
                                      <p className="text-xs text-slate-500">{item.dressCode} • {item.size}</p>
                                    </div>
                                    <div className="text-right">
                                      <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-xs font-mono">x{item.quantity}</span>
                                      <p className="text-xs text-slate-400 mt-1">₹{item.sellingPrice}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>

                            <td className="p-4 sm:p-6 align-top">
                              <div className="flex flex-col gap-1">
                                <span className="text-lg font-bold text-emerald-400">
                                  ₹{sale.totalAmount.toLocaleString()}
                                </span>
                                <span className="text-sm font-medium text-blue-400 opacity-80">
                                  Profit: ₹{totalProfit.toLocaleString()}
                                </span>
                              </div>
                            </td>

                            <td className="p-4 sm:p-6 align-top">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 w-max">
                                  <CreditCard className="w-4 h-4 text-indigo-400" />
                                  <span className="text-sm font-medium text-indigo-300">{sale.paymentMode}</span>
                                </div>
                                {(sale.upiId || sale.upiTransactionId) && (
                                  <div className="text-xs text-slate-500 space-y-1 mt-1">
                                    {sale.upiId && <p>ID: {sale.upiId}</p>}
                                    {sale.upiTransactionId && <p>TXN: {sale.upiTransactionId}</p>}
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="p-4 sm:p-6 align-top">
                              <div className="flex items-center gap-2">
                                <StatusBadge 
                                  status={(sale.paymentStatus || 'paid').charAt(0).toUpperCase() + (sale.paymentStatus || 'paid').slice(1)}
                                  variant={sale.paymentStatus === 'paid' ? 'success' : sale.paymentStatus === 'failed' ? 'danger' : sale.paymentStatus === 'due' ? 'warning' : 'info'}
                                />
                                <div className="relative group cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                  <select
                                    value={sale.paymentStatus || 'paid'}
                                    onChange={(e) => handleUpdatePaymentStatus(sale.id, e.target.value as any)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                  >
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                    <option value="due">Due</option>
                                    <option value="failed">Failed</option>
                                  </select>
                                  <div className="p-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-slate-400">
                                    <Edit className="w-3 h-3" />
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-4 sm:p-6 align-top">
                              <div className="flex flex-wrap gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                                <ActionButton 
                                  icon={Edit} 
                                  onClick={(e) => { e?.stopPropagation(); handleEdit(sale); }}
                                  variant="ghost" 
                                >
                                  Edit
                                </ActionButton>
                                <ActionButton 
                                  icon={Trash2} 
                                  onClick={(e) => { e?.stopPropagation(); handleDelete(sale.id); }}
                                  variant="danger" 
                                >
                                  Delete
                                </ActionButton>
                                {sale.saleImage && (
                                  <ActionButton 
                                    icon={Link} 
                                    onClick={(e) => { e?.stopPropagation(); window.open(sale.saleImage, '_blank'); }}
                                    variant="secondary" 
                                  >
                                    Proof
                                  </ActionButton>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {editingSale ? 'Edit Sale' : 'Record New Sale'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto flex-1 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill Number *
                        <span className="ml-2 text-xs text-gray-500 font-normal">
                          (Auto-generated, click to edit)
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.billNumber}
                        onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                        placeholder="Will be auto-generated..."
                        title="Bill number is auto-generated. You can edit it if needed for special cases."
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id="useCustomer"
                        checked={useCustomer}
                        onChange={(e) => {
                          setUseCustomer(e.target.checked)
                          if (!e.target.checked) {
                            setFormData(prev => ({ ...prev, customerId: '', partyName: '' }))
                          }
                        }}
                        className="w-4 h-4 text-[var(--accent)] rounded focus:ring-[var(--accent)]"
                      />
                      <label htmlFor="useCustomer" className="text-sm font-medium text-gray-700">
                        Select from existing customers
                      </label>
                    </div>
                    {useCustomer ? (
                      <div className="flex gap-2">
                        <select
                          required
                          value={formData.customerId}
                          onChange={(e) => handleCustomerSelect(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select Customer</option>
                          {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name} - {customer.phone}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowCustomerModal(true)}
                          className="px-3 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] flex items-center justify-center"
                          title="Add New Customer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.partyName}
                        onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                        placeholder="Enter party/customer name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    )}
                    {customers.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No customers yet. <a href="/admin/customers" className="text-purple-600 hover:underline">Add customers</a> to use this feature.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                      <select
                        required
                        value={formData.paymentMode}
                        onChange={handlePaymentModeChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="UPI - GPay">UPI - GPay</option>
                        <option value="UPI - PhonePe">UPI - PhonePe</option>
                        <option value="UPI - Paytm">UPI - Paytm</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status *</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['paid', 'pending', 'due', 'failed'] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setFormData({ ...formData, paymentStatus: status })}
                            className={`px-2 py-2 rounded-lg text-xs font-bold border-2 transition-all text-center ${formData.paymentStatus === status
                                ? status === 'paid' ? 'bg-green-100 text-green-800 border-green-400 shadow-sm ring-2 ring-green-300'
                                  : status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-400 shadow-sm ring-2 ring-yellow-300'
                                    : status === 'due' ? 'bg-orange-100 text-orange-800 border-orange-400 shadow-sm ring-2 ring-orange-300'
                                      : 'bg-red-100 text-red-800 border-red-400 shadow-sm ring-2 ring-red-300'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                              }`}
                          >
                            {getPaymentStatusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* UPI-specific fields */}
                  {(formData.paymentMode.startsWith('UPI') || formData.paymentMode === 'Bank Transfer') && (
                    <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">Transaction ID</label>
                        <input
                          type="text"
                          value={formData.upiTransactionId}
                          onChange={(e) => setFormData({ ...formData, upiTransactionId: e.target.value })}
                          placeholder="TXN123456"
                          className="w-full px-3 py-2 border border-blue-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">UPI ID (Optional)</label>
                        <input
                          type="text"
                          value={formData.upiId}
                          onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                          placeholder="user@upi"
                          className="w-full px-3 py-2 border border-blue-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Items</h3>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="text-[var(--accent)] hover:text-[var(--accent-hover)] text-sm font-medium"
                      >
                        ➕ Add Item
                      </button>
                    </div>

                    {/* Barcode Quick Scan */}
                    <div className="mb-4 p-3 rounded-xl border border-indigo-200 bg-indigo-50 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h1v1h-1z" /><path d="M17 14h1v3h-3v-1h2z" /><path d="M14 18h3v1h-3z" /><path d="M20 17h1v4h-1z" /></svg>
                        Quick Scan / Type Code
                      </div>
                      <div className="flex gap-2">
                        <input
                          ref={barcodeInputRef}
                          type="text"
                          value={barcodeInput}
                          onChange={(e) => { setBarcodeInput(e.target.value); setBarcodeError('') }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleBarcodeScan(barcodeInput)
                            }
                          }}
                          placeholder="Scan barcode or type dress code + Enter..."
                          className="flex-1 px-3 py-2 text-sm border border-indigo-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={() => handleBarcodeScan(barcodeInput)}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      {barcodeError && (
                        <p className="text-red-600 text-xs font-medium">{barcodeError}</p>
                      )}
                      <p className="text-indigo-500 text-[10px]">
                        Connect a USB barcode scanner and scan — it auto-adds the product to the invoice.
                      </p>
                    </div>


                    {formData.items.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <p className="text-gray-600 font-medium mb-2">No items added yet</p>
                          <p className="text-gray-500 text-sm">Click &quot;Add Item&quot; to start adding products</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.items.map((item, index) => {
                          const selectedItem = getSelectedInventoryItem(item.inventoryId)
                          return (
                            <div key={index} className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-200">
                              <div className="grid grid-cols-3 gap-4 mb-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Dress *</label>
                                  {selectedItem ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenItemModal(index)}
                                          className="flex-1 px-3 py-2 border-2 border-purple-300 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-left flex items-center justify-between"
                                        >
                                          <span className="font-medium">{selectedItem.dressName}</span>
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                          </svg>
                                        </button>
                                      </div>
                                      <div className={`px-2 py-1 rounded text-xs font-medium border ${getStockStatusColor(getStockStatus(selectedItem.currentStock))}`}>
                                        {getStockStatusText(getStockStatus(selectedItem.currentStock), selectedItem.currentStock || 0)}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Code: {selectedItem.dressCode} • {selectedItem.dressType}
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenItemModal(index)}
                                      className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md hover:border-purple-400 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-600 flex items-center justify-center gap-2"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                      </svg>
                                      <span>Search & Select Product</span>
                                    </button>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
                                  <select
                                    required
                                    value={item.size}
                                    onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                                    disabled={!selectedItem}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                  >
                                    <option value="">Select Size</option>
                                    {selectedItem?.sizes.map(size => (
                                      <option key={size} value={size}>{size}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    max={selectedItem?.currentStock || undefined}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const quantity = parseInt(e.target.value) || 0
                                      // Special handling for edit mode: stock check should ignore the items already in this sale
                                      let availableStock = selectedItem?.currentStock || 0
                                      if (editingSale) {
                                        const originalItem = editingSale.items.find(i => i.inventoryId === item.inventoryId)
                                        if (originalItem) {
                                          availableStock += originalItem.quantity
                                        }
                                      }

                                      if (quantity > availableStock) {
                                        alert(`Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`)
                                        return
                                      }

                                      handleItemChange(index, 'quantity', quantity)
                                    }}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${selectedItem && item.quantity > (selectedItem.currentStock || 0)
                                      ? 'border-red-300 bg-red-50'
                                      : 'border-gray-300'
                                      }`}
                                  />
                                  {selectedItem && item.quantity > (selectedItem.currentStock || 0) && (
                                    <p className="mt-1 text-xs text-red-600">
                                      Only {selectedItem.currentStock || 0} units available
                                    </p>
                                  )}
                                </div>
                              </div>
                              {/* Per Meter Pricing Option */}
                              {selectedItem && selectedItem.pricePerMeter && (
                                <div className="mb-3 pt-3 border-t border-gray-200">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.usePerMeter || false}
                                      onChange={(e) => {
                                        const newItems = [...formData.items]
                                        newItems[index] = {
                                          ...newItems[index],
                                          usePerMeter: e.target.checked,
                                          meters: e.target.checked ? (newItems[index].meters || 0) : undefined
                                        }
                                        setFormData({ ...formData, items: newItems })
                                      }}
                                      className="rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Use Per Meter Pricing (₹{selectedItem.pricePerMeter}/meter)</span>
                                  </label>
                                  {item.usePerMeter && (
                                    <div className="mt-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Meters *</label>
                                      <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="0.01"
                                        value={item.meters || ''}
                                        onChange={(e) => handleItemChange(index, 'meters', parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="e.g., 2.5"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {selectedItem && (
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Price:</span>
                                    <span className="text-sm font-semibold text-gray-800">
                                      ₹{item.usePerMeter && selectedItem.pricePerMeter
                                        ? selectedItem.pricePerMeter
                                        : selectedItem.sellingPrice}
                                      {item.usePerMeter && '/meter'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Profit:</span>
                                    <span className="text-sm font-semibold text-green-600">
                                      ₹{((item.usePerMeter && selectedItem.pricePerMeter ? selectedItem.pricePerMeter : selectedItem.sellingPrice) - selectedItem.wholesalePrice).toFixed(2)}
                                      {item.usePerMeter ? '/meter' : '/unit'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 ml-auto">
                                    <span className="text-xs font-medium text-gray-500">Total:</span>
                                    <span className="text-sm font-bold text-blue-600">
                                      ₹{(
                                        (item.usePerMeter && selectedItem.pricePerMeter && item.meters
                                          ? selectedItem.pricePerMeter * item.meters
                                          : selectedItem.sellingPrice * item.quantity)
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div className="flex justify-end mt-3">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 hover:bg-red-50 px-3 py-1.5 rounded-md transition-all duration-200"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Remove
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Discount Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Discount (Optional)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              value="percentage"
                              checked={formData.discountType === 'percentage'}
                              onChange={(e) => setFormData({ ...formData, discountType: 'percentage' as const, discountAmount: 0 })}
                              className="mr-2"
                            />
                            <span className="text-sm">Percentage (%)</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              value="rupees"
                              checked={formData.discountType === 'rupees'}
                              onChange={(e) => setFormData({ ...formData, discountType: 'rupees' as const, discountPercentage: 0 })}
                              className="mr-2"
                            />
                            <span className="text-sm">Fixed Amount (₹)</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              value=""
                              checked={formData.discountType === ''}
                              onChange={(e) => setFormData({ ...formData, discountType: '' as const, discountPercentage: 0, discountAmount: 0 })}
                              className="mr-2"
                            />
                            <span className="text-sm">No Discount</span>
                          </label>
                        </div>
                      </div>
                      {formData.discountType === 'percentage' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.discountPercentage}
                            onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., 10 for 10%"
                          />
                        </div>
                      )}
                      {formData.discountType === 'rupees' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.discountAmount}
                            onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., 500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* GST Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">GST (Optional)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GST Type</label>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              value="percentage"
                              checked={formData.gstType === 'percentage'}
                              onChange={(e) => setFormData({ ...formData, gstType: 'percentage' as const, gstAmount: 0 })}
                              className="mr-2"
                            />
                            <span className="text-sm">Percentage (%)</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              value="rupees"
                              checked={formData.gstType === 'rupees'}
                              onChange={(e) => setFormData({ ...formData, gstType: 'rupees' as const, gstPercentage: 0 })}
                              className="mr-2"
                            />
                            <span className="text-sm">Fixed Amount (₹)</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              value=""
                              checked={formData.gstType === ''}
                              onChange={(e) => setFormData({ ...formData, gstType: '' as const, gstPercentage: 0, gstAmount: 0 })}
                              className="mr-2"
                            />
                            <span className="text-sm">No GST</span>
                          </label>
                        </div>
                      </div>
                      {formData.gstType === 'percentage' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">GST Percentage</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.gstPercentage}
                            onChange={(e) => setFormData({ ...formData, gstPercentage: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., 18 for 18%"
                          />
                        </div>
                      )}
                      {formData.gstType === 'rupees' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">GST Amount (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.gstAmount}
                            onChange={(e) => setFormData({ ...formData, gstAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., 500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total Summary */}
                  {formData.items.length > 0 && (() => {
                    const subtotal = formData.items.reduce((sum, item) => {
                      const invItem = inventory.find(i => i.id === item.inventoryId)
                      if (!invItem) return sum
                      const price = item.usePerMeter && invItem.pricePerMeter && item.meters
                        ? invItem.pricePerMeter * item.meters
                        : invItem.sellingPrice * item.quantity
                      return sum + price
                    }, 0)

                    const discount = formData.discountType === 'percentage' && formData.discountPercentage > 0
                      ? (subtotal * formData.discountPercentage) / 100
                      : formData.discountType === 'rupees' && formData.discountAmount > 0
                        ? formData.discountAmount
                        : 0

                    const amountAfterDiscount = subtotal - discount

                    const gst = formData.gstType === 'percentage' && formData.gstPercentage > 0
                      ? (amountAfterDiscount * formData.gstPercentage) / 100
                      : formData.gstType === 'rupees' && formData.gstAmount > 0
                        ? formData.gstAmount
                        : 0

                    const finalTotal = amountAfterDiscount + gst

                    return (
                      <div className="border-t pt-6">
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-5 border-2 border-green-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Summary</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                            </div>
                            {discount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Discount {formData.discountType === 'percentage' ? `(${formData.discountPercentage}%)` : ''}:</span>
                                <span className="font-medium text-red-600">-₹{discount.toLocaleString()}</span>
                              </div>
                            )}
                            {gst > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">GST {formData.gstType === 'percentage' ? `(${formData.gstPercentage}%)` : ''}:</span>
                                <span className="font-medium text-blue-600">+₹{gst.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xl font-bold border-t pt-3 mt-3">
                              <span>Total Amount:</span>
                              <span className="text-green-600">₹{finalTotal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Sale Image Capture Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Sale Proof Image</label>
                        <p className="text-xs text-gray-500">Capture an image as proof of sale (Optional)</p>
                      </div>
                      {capturedImage && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Image Captured
                        </span>
                      )}
                    </div>
                    <div className="space-y-4">
                      {capturedImage ? (
                        <div className="relative group">
                          <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 shadow-lg w-full aspect-auto max-h-96 bg-gray-50">
                            <Image
                              src={capturedImage}
                              alt="Captured sale proof"
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setCapturedImage(null)
                                  setFormData({ ...formData, saleImage: '' })
                                }}
                                className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg transform hover:scale-105"
                              >
                                🗑️ Remove Image
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCapturedImage(null)
                              setFormData({ ...formData, saleImage: '' })
                            }}
                            className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 md:hidden"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 hover:border-blue-400 transition-all duration-200">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <p className="text-gray-600 font-medium mb-2">No image captured yet</p>
                            <p className="text-gray-500 text-sm mb-4">Capture a photo as proof of sale</p>
                            <button
                              type="button"
                              onClick={startCamera}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Capture Image
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Sticker Selection */}
                      {capturedImage && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-lg">🎨</span>
                            Add Verification Sticker
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {stickers.map((sticker) => (
                              <button
                                key={sticker}
                                type="button"
                                onClick={() => addStickerToImage(sticker)}
                                className="px-4 py-2.5 bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg text-xl font-medium transition-all duration-200 transform hover:scale-110 shadow-sm hover:shadow-md"
                              >
                                {sticker}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-3">Click a sticker to add it to your image</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Camera Modal */}
                  {showCamera && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Capture Sale Proof Image</h3>
                          </div>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Camera View */}
                        <div className="p-6">
                          <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl mb-4">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full h-auto max-h-[60vh] object-cover"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            {selectedSticker && (
                              <div
                                className="absolute text-7xl font-bold text-green-400 opacity-90 pointer-events-none drop-shadow-2xl"
                                style={{
                                  left: `${stickerPosition.x}%`,
                                  top: `${stickerPosition.y}%`,
                                  transform: 'translate(-50%, -50%)',
                                  textShadow: '0 0 20px rgba(0,0,0,0.8)',
                                }}
                              >
                                {selectedSticker}
                              </div>
                            )}
                            {/* Capture Frame Overlay */}
                            <div className="absolute inset-0 pointer-events-none">
                              <div className="absolute inset-4 border-4 border-white border-dashed rounded-lg opacity-50"></div>
                            </div>
                          </div>

                          {/* Sticker Selection for Live Preview */}
                          {!selectedSticker && (
                            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                              <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="text-lg">🎨</span>
                                Add Sticker (Optional)
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {stickers.map((sticker) => (
                                  <button
                                    key={sticker}
                                    type="button"
                                    onClick={() => setSelectedSticker(sticker)}
                                    className="px-5 py-3 bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg text-2xl font-medium transition-all duration-200 transform hover:scale-110 shadow-sm hover:shadow-md"
                                  >
                                    {sticker}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 mt-2">Select a sticker to overlay on the image</p>
                            </div>
                          )}

                          {selectedSticker && (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{selectedSticker}</span>
                                  <span className="text-sm font-medium text-blue-800">Sticker Selected</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedSticker(null)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200 hover:border-gray-400"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={captureImage}
                              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Capture Photo
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        resetForm()
                      }}
                      className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200 hover:border-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formData.items.length === 0}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {editingSale ? 'Update Sale' : 'Record Sale'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Item Selection Modal */}
        {showItemModal && itemModalIndex !== null && (
          <ItemSelectionModal
            isOpen={showItemModal}
            onClose={() => {
              setShowItemModal(false)
              setItemModalIndex(null)
            }}
            onSelect={(item) => handleItemSelect(item, itemModalIndex)}
            inventory={inventory}
            showRackNumber={rackModuleEnabled}
          />
        )}


        {/* Customer Creation Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Customer</h2>
                <button
                  onClick={() => {
                    setShowCustomerModal(false)
                    setCustomerFormData({
                      name: '',
                      phone: '',
                      email: '',
                      address: '',
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerFormData.name}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerFormData.phone}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={customerFormData.email}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address (Optional)
                  </label>
                  <textarea
                    value={customerFormData.address}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter address"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Create Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomerModal(false)
                      setCustomerFormData({
                        name: '',
                        phone: '',
                        email: '',
                        address: '',
                      })
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default function SalesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <SalesPageContent />
    </Suspense>
  )
}


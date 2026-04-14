'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import AdminLayout from '@/components/AdminLayout'
import ImageLightbox from '@/components/ImageLightbox'
import { PurchaseOrder, PurchaseOrderItem, Supplier } from '@/lib/storage'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Download, PackageOpen, DownloadCloud, Activity, MapPin, Building2, Link, IndianRupee, Clock, CheckCircle2, XCircle, Search, Filter, ShoppingCart, Layers, AlertCircle, FileText, Sparkles } from 'lucide-react'
import ActionButton from '@/components/ActionButton'
import StatusBadge from '@/components/StatusBadge'
export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string, name: string, parentId: string | null }>>([])
  const [showModal, setShowModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryParentId, setNewCategoryParentId] = useState('')
  const [categoryModalItemIndex, setCategoryModalItemIndex] = useState<number | null>(null)
  const [showQuickSupplierModal, setShowQuickSupplierModal] = useState(false)
  const [quickSupplierForm, setQuickSupplierForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  })
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null)
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    supplierId: '',
    customPoNumber: '',
    useCustomPo: false,
    invoiceImage: '',
    notes: '',
    gstType: 'percentage' as 'percentage' | 'rupees',
    gstPercentage: 0,
    gstAmountRupees: 0,
    // Transport Details
    logisticsName: '',
    logisticsMobile: '',
    transportAddress: '',
    transportImage: '',
    invoiceNumber: '',
    invoiceDate: '',
    transportCharges: 0,
    restockInventory: true,
  })
  const [contactPersons, setContactPersons] = useState<Array<{ name: string, mobile: string }>>([])
  const [uploadingTransportImage, setUploadingTransportImage] = useState(false)
  const transportImageFileInputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      productName: '',
      category: '',
      sizes: [],
      fabricType: '',
      quantity: 0,
      pricePerPiece: 0,
      totalAmount: 0,
      productImages: [],
    }
  ])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadingInvoice, setUploadingInvoice] = useState(false)
  const invoiceFileInputRef = useRef<HTMLInputElement>(null)
  const [showImageLightbox, setShowImageLightbox] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [userRole, setUserRole] = useState<'superadmin' | 'admin' | 'user' | null>(null)
  const [tenantModules, setTenantModules] = useState<string[]>([])

  useEffect(() => {
    loadData()
    fetchUserInfo()

    // Listen for AI Purchase Order creation to refresh data
    const handlePORefresh = () => {
      console.log('🔄 AI Purchase Order created, refreshing list...')
      loadOrders()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('purchaseOrderCreated', handlePORefresh)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('purchaseOrderCreated', handlePORefresh)
      }
    }
  }, [loadData, fetchUserInfo, loadOrders])

  const fetchUserInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/check')
      const data = await res.json()
      if (data.authenticated && data.admin) {
        setUserRole(data.admin.type === 'tenant' ? 'admin' : data.admin.type)
        if (data.admin.tenant_id) {
          const tenantRes = await fetch(`/api/tenants/${data.admin.tenant_id}`)
          const tenantData = await tenantRes.json()
          if (tenantData.success) {
            setTenantModules(tenantData.data.modules || [])
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [filterSupplier, filterCategory, filterMonth, filterYear, loadOrders])

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showDetailModal) {
          setShowDetailModal(false)
          setSelectedOrder(null)
        } else if (showModal) {
          setShowModal(false)
          resetForm()
        }
      }
    }

    if (showModal || showDetailModal) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [showModal, showDetailModal])

  const loadData = useCallback(async () => {
    try {
      const [suppliersRes, ordersRes, categoriesRes, inventoryRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/purchases'),
        fetch('/api/categories'),
        fetch('/api/inventory')
      ])

      const suppliersResult = await suppliersRes.json()
      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data)
      }

      const ordersResult = await ordersRes.json()
      if (ordersResult.success) {
        setCategories(ordersResult.categories || ['All'])
        await loadOrders()
      }

      const categoriesResult = await categoriesRes.json()
      if (categoriesResult.success) {
        setAvailableCategories(categoriesResult.data)
      }

      const inventoryResult = await inventoryRes.json()
      if (inventoryResult.success) {
        setInventoryItems(inventoryResult.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }, [loadOrders])

  const loadSuppliers = useCallback(async () => {
    try {
      const response = await fetch('/api/suppliers')
      const result = await response.json()
      if (result.success) {
        setSuppliers(result.data)
      }
    } catch (error) {
      console.error('Failed to load suppliers:', error)
    }
  }, [])

  const handleQuickSupplierCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!quickSupplierForm.name.trim() || !quickSupplierForm.phone.trim()) {
      alert('Name and Phone are required')
      return
    }

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickSupplierForm.name.trim(),
          phone: quickSupplierForm.phone.trim(),
          email: quickSupplierForm.email.trim() || undefined,
          address: quickSupplierForm.address.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh suppliers list
        await loadSuppliers()
        // Auto-select new supplier
        setFormData({ ...formData, supplierId: result.data.id })
        // Close modal
        setShowQuickSupplierModal(false)
        // Reset form
        setQuickSupplierForm({ name: '', phone: '', email: '', address: '' })
        alert('Supplier created successfully!')
      } else {
        alert(result.message || 'Failed to create supplier')
      }
    } catch (error) {
      console.error('Failed to create supplier:', error)
      alert('Failed to create supplier')
    }
  }

  // Build category tree for hierarchical display
  const buildCategoryTree = (categories: Array<{ id: string, name: string, parentId: string | null }>) => {
    const map = new Map<string, { id: string, name: string, parentId: string | null, children: any[] }>()
    const roots: any[] = []

    // Create nodes
    categories.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] })
    })

    // Build tree
    categories.forEach(cat => {
      const node = map.get(cat.id)!
      if (cat.parentId && map.has(cat.parentId)) {
        const parent = map.get(cat.parentId)!
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return { roots, map }
  }

  const getCategoryOptions = () => {
    const { roots } = buildCategoryTree(availableCategories)
    const options: JSX.Element[] = []

    const renderCategory = (category: any, level: number = 0) => {
      const indent = '  '.repeat(level)
      options.push(
        <option key={category.id} value={category.name}>
          {indent}{category.name}
        </option>
      )
      category.children.forEach((child: any) => renderCategory(child, level + 1))
    }

    roots.forEach(root => renderCategory(root))
    return options
  }

  const loadOrders = useCallback(async () => {
    try {
      const url = new URL('/api/purchases', window.location.origin)
      if (filterCategory && filterCategory !== 'All') {
        url.searchParams.set('category', filterCategory)
      }

      const response = await fetch(url.toString())
      const result = await response.json()

      if (!result.success) {
        console.error('API error:', result.message || result.error)
        alert(`Failed to load purchase orders: ${result.message || 'Unknown error'}`)
        return
      }

      if (result.data && Array.isArray(result.data)) {
        let allOrders = result.data

        if (filterSupplier) {
          allOrders = allOrders.filter((order: PurchaseOrder) => order.supplierId === filterSupplier)
        }

        if (filterYear) {
          allOrders = allOrders.filter((order: PurchaseOrder) => {
            const orderYear = new Date(order.date).getFullYear().toString()
            return orderYear === filterYear
          })
        }

        if (filterMonth) {
          allOrders = allOrders.filter((order: PurchaseOrder) => {
            const orderMonth = (new Date(order.date).getMonth() + 1).toString().padStart(2, '0')
            return orderMonth === filterMonth
          })
        }

        // Search by supplier name
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          allOrders = allOrders.filter((order: PurchaseOrder) =>
            order.supplierName.toLowerCase().includes(query) ||
            (order.customPoNumber && order.customPoNumber.toLowerCase().includes(query)) ||
            (order.items && order.items.some(item => item.productName.toLowerCase().includes(query))) ||
            (order.productName && order.productName.toLowerCase().includes(query))
          )
        }

        allOrders.sort((a: PurchaseOrder, b: PurchaseOrder) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setOrders(allOrders)
        console.log(`Loaded ${allOrders.length} purchase orders`)
      } else {
        console.error('Invalid data format:', result)
        setOrders([])
      }
    } catch (error) {
      console.error('Failed to load purchase orders:', error)
      alert('Failed to load purchase orders. Please check the console for details.')
    }
  }, [filterCategory, filterSupplier, filterYear, filterMonth, searchQuery])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemIndex: number) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingIndex(itemIndex)
    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          alert('Please select image files only')
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Max size is 5MB`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()
        if (data.success) {
          uploadedUrls.push(data.url)
        }
      }

      if (uploadedUrls.length > 0) {
        setItems(prev => {
          const newItems = [...prev]
          newItems[itemIndex] = {
            ...newItems[itemIndex],
            productImages: [...(newItems[itemIndex].productImages || []), ...uploadedUrls]
          }
          return newItems
        })
      }
    } catch (error) {
      alert('Failed to upload images. Please try again.')
    } finally {
      setUploadingIndex(null)
    }
  }

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploadingInvoice(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setFormData(prev => ({ ...prev, invoiceImage: data.url }))
      } else {
        alert(data.message || 'Failed to upload invoice')
      }
    } catch (error) {
      alert('Failed to upload invoice. Please try again.')
    } finally {
      setUploadingInvoice(false)
    }
  }

  const handleTransportImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploadingTransportImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setFormData(prev => ({ ...prev, transportImage: data.url }))
      } else {
        alert(data.message || 'Failed to upload transport image')
      }
    } catch (error) {
      alert('Failed to upload transport image. Please try again.')
    } finally {
      setUploadingTransportImage(false)
    }
  }

  const addContactPerson = () => {
    setContactPersons(prev => [...prev, { name: '', mobile: '' }])
  }

  const removeContactPerson = (index: number) => {
    setContactPersons(prev => prev.filter((_, i) => i !== index))
  }

  const updateContactPerson = (index: number, field: 'name' | 'mobile', value: string) => {
    setContactPersons(prev => {
      const newPersons = [...prev]
      newPersons[index] = { ...newPersons[index], [field]: value }
      return newPersons
    })
  }

  const addItem = () => {
    setItems(prev => [...prev, {
      productName: '',
      category: '',
      sizes: [],
      fabricType: '',
      quantity: 0,
      pricePerPiece: 0,
      totalAmount: 0,
      productImages: [],
    }])
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setItems(prev => {
      const newItems = [...prev]
      const item = { ...newItems[index] }

      if (field === 'sizes') {
        item.sizes = typeof value === 'string'
          ? value.split(',').map(s => s.trim()).filter(Boolean)
          : value
      } else {
        (item as any)[field] = value
      }

      // Recalculate total
      if (field === 'quantity' || field === 'pricePerPiece') {
        item.totalAmount = item.quantity * item.pricePerPiece
      }

      newItems[index] = item
      return newItems
    })
  }

  const removeImage = (itemIndex: number, imageIndex: number) => {
    setItems(prev => {
      const newItems = [...prev]
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        productImages: newItems[itemIndex].productImages?.filter((_, i) => i !== imageIndex) || []
      }
      return newItems
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const supplier = suppliers.find(s => s.id === formData.supplierId)
    if (!supplier) {
      alert('Please select a supplier')
      return
    }

    // Validate items
    const validItems = items.filter(item =>
      item.productName && item.quantity > 0 && item.pricePerPiece > 0
    )

    if (validItems.length === 0) {
      alert('Please add at least one valid product')
      return
    }

    // Validate custom PO number if enabled
    if (formData.useCustomPo && !formData.customPoNumber.trim()) {
      alert('Please enter a custom PO number')
      return
    }

    try {
      const totals = calculateTotals()

      const payload = {
        date: formData.date,
        supplierId: formData.supplierId,
        supplierName: supplier.name,
        customPoNumber: formData.useCustomPo ? formData.customPoNumber : undefined,
        invoiceImage: formData.invoiceImage || undefined,
        items: validItems.map(item => ({
          productName: item.productName,
          category: item.category || 'Custom',
          sizes: item.sizes || [],
          fabricType: item.fabricType || undefined,
          quantity: Number(item.quantity) || 0, // Ensure quantity is an integer
          pricePerPiece: Number(item.pricePerPiece) || 0,
          totalAmount: Number(item.totalAmount) || 0,
          productImages: item.productImages || [],
        })),
        gstType: totals.gstType,
        gstPercentage: totals.gstPercentage || undefined,
        gstAmountRupees: totals.gstAmountRupees || undefined,
        notes: formData.notes || undefined,
        // Transport Details
        logisticsName: formData.logisticsName || undefined,
        logisticsMobile: formData.logisticsMobile || undefined,
        transportAddress: formData.transportAddress || undefined,
        transportImage: formData.transportImage || undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        invoiceDate: formData.invoiceDate || undefined,
        transportCharges: formData.transportCharges || undefined,
        contactPersons: contactPersons.filter(cp => cp.name.trim() || cp.mobile.trim()).length > 0
          ? contactPersons.filter(cp => cp.name.trim() || cp.mobile.trim())
          : undefined,
        restockRequested: formData.restockInventory
      }

      let response
      if (editingOrder) {
        response = await fetch(`/api/purchases/${editingOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const result = await response.json()
      if (!result.success) {
        alert(`Failed to ${editingOrder ? 'update' : 'add'} purchase order: ${result.message || 'Unknown error'}`)
        return
      }

      alert(`Purchase order ${editingOrder ? 'updated' : 'added'}! Inventory updated automatically.`)

      resetForm()
      await loadOrders()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save purchase order:', error)
      alert('Failed to save purchase order')
    }
  }

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order)
    setFormData({
      date: order.date,
      supplierId: order.supplierId,
      customPoNumber: order.customPoNumber || '',
      useCustomPo: !!order.customPoNumber,
      invoiceImage: order.invoiceImage || '',
      notes: order.notes || '',
      gstType: order.gstType || 'percentage',
      gstPercentage: order.gstPercentage !== undefined && order.gstPercentage !== null ? order.gstPercentage : 0,
      gstAmountRupees: order.gstAmountRupees !== undefined && order.gstAmountRupees !== null ? order.gstAmountRupees : 0,
      logisticsName: (order as any).logisticsName || '',
      logisticsMobile: (order as any).logisticsMobile || '',
      transportAddress: (order as any).transportAddress || '',
      transportImage: (order as any).transportImage || '',
      invoiceNumber: (order as any).invoiceNumber || '',
      invoiceDate: (order as any).invoiceDate || '',
      transportCharges: (order as any).transportCharges || 0,
      restockInventory: (order as any).restockRequested ?? true,
    })
    setContactPersons((order as any).contactPersons || [])

    // Convert order to items format
    if (order.items && order.items.length > 0) {
      setItems(order.items.map(item => ({
        productName: item.productName,
        category: item.category || '',
        sizes: item.sizes || [],
        fabricType: item.fabricType || '',
        quantity: item.quantity,
        pricePerPiece: item.pricePerPiece,
        totalAmount: item.totalAmount,
        productImages: item.productImages || [],
      })))
    } else {
      // Legacy format
      setItems([{
        productName: order.productName || '',
        category: 'Custom',
        sizes: order.sizes || [],
        fabricType: order.fabricType || '',
        quantity: order.quantity || 0,
        pricePerPiece: order.pricePerPiece || 0,
        totalAmount: order.totalAmount || 0,
        productImages: order.productImage ? [order.productImage] : [],
      }])
    }

    setShowModal(true)
  }

  const handleViewDetails = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      try {
        const response = await fetch(`/api/purchases/${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()
        if (!result.success) {
          alert('Failed to delete purchase order')
          return
        }
        await loadOrders()
      } catch (error) {
        console.error('Failed to delete purchase order:', error)
        alert('Failed to delete purchase order')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      supplierId: '',
      customPoNumber: '',
      useCustomPo: false,
      invoiceImage: '',
      notes: '',
      gstType: 'percentage',
      gstPercentage: 0,
      gstAmountRupees: 0,
      logisticsName: '',
      logisticsMobile: '',
      transportAddress: '',
      transportImage: '',
      invoiceNumber: '',
      invoiceDate: '',
      transportCharges: 0,
      restockInventory: true,
    })
    setItems([{
      productName: '',
      category: '',
      sizes: [],
      fabricType: '',
      quantity: 0,
      pricePerPiece: 0,
      totalAmount: 0,
      productImages: [],
    }])
    setContactPersons([])
    setEditingOrder(null)
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.totalAmount, 0)
    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId)

    let gstAmount = 0
    let gstPercentage = 0
    let gstAmountRupees = 0
    let gstType: 'percentage' | 'rupees' = 'percentage'

    // Check if manual GST override is set
    if (formData.gstType === 'rupees' && formData.gstAmountRupees > 0) {
      gstType = 'rupees'
      gstAmountRupees = formData.gstAmountRupees
      gstAmount = gstAmountRupees
    } else if (formData.gstType === 'percentage' && formData.gstPercentage > 0) {
      gstType = 'percentage'
      gstPercentage = formData.gstPercentage
      gstAmount = (subtotal * gstPercentage) / 100
    } else if (selectedSupplier) {
      // Use supplier's GST settings
      if (selectedSupplier.gstType === 'rupees' && selectedSupplier.gstAmountRupees) {
        gstType = 'rupees'
        gstAmountRupees = selectedSupplier.gstAmountRupees
        gstAmount = gstAmountRupees
      } else if (selectedSupplier.gstPercentage) {
        gstType = 'percentage'
        gstPercentage = selectedSupplier.gstPercentage
        gstAmount = (subtotal * gstPercentage) / 100
      }
    }

    const transportCharges = formData.transportCharges || 0
    const grandTotal = subtotal + gstAmount + transportCharges

    return { subtotal, gstAmount, grandTotal, gstPercentage, gstAmountRupees, gstType, transportCharges }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const totals = calculateTotals()
  const totalAmount = orders.reduce((sum, order) => sum + (order.grandTotal || order.totalAmount || 0), 0)

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name')
      return
    }

    // Check if category already exists (case-insensitive) in the same parent
    const existingCat = availableCategories.find(cat => {
      const nameMatch = cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
      const parentMatch = (cat.parentId || null) === (newCategoryParentId || null)
      return nameMatch && parentMatch
    })

    if (existingCat) {
      alert(`Category "${existingCat.name}" already exists${newCategoryParentId ? ' under this parent' : ''}`)
      // Auto-select the existing category for the item that opened the modal
      if (categoryModalItemIndex !== null) {
        const newItems = [...items]
        newItems[categoryModalItemIndex].category = existingCat.name
        setItems(newItems)
      }
      setNewCategoryName('')
      setNewCategoryParentId('')
      setCategoryModalItemIndex(null)
      setShowCategoryModal(false)
      return
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: '',
          parentId: newCategoryParentId || undefined,
          displayOrder: 0,
        }),
      })
      const result = await response.json()
      if (!result.success) {
        alert(result.message || 'Failed to create category')
        return
      }

      // Refresh categories list
      const categoriesRes = await fetch('/api/categories')
      const categoriesResult = await categoriesRes.json()
      if (categoriesResult.success) {
        setAvailableCategories(categoriesResult.data)
      }

      // Auto-select the newly created category for the item that opened the modal
      if (categoryModalItemIndex !== null) {
        const newItems = [...items]
        newItems[categoryModalItemIndex].category = result.data.name
        setItems(newItems)
      }

      setNewCategoryName('')
      setNewCategoryParentId('')
      setCategoryModalItemIndex(null)
      setShowCategoryModal(false)
    } catch (error) {
      console.error('Failed to create category:', error)
      alert('Failed to create category')
    }
  }

  // Get root categories for parent selection
  const getRootCategories = () => {
    return availableCategories.filter(cat => !cat.parentId)
  }

  // Get category path for display
  const getCategoryPath = (categoryId: string): string => {
    const category = availableCategories.find(c => c.id === categoryId)
    if (!category) return ''
    if (!category.parentId) return category.name

    const parent = availableCategories.find(c => c.id === category.parentId)
    if (parent) {
      return `${getCategoryPath(parent.id)} > ${category.name}`
    }
    return category.name
  }

  const exportToExcel = () => {
    try {
      // Prepare data for export - flatten purchase orders with their items
      const exportData: any[] = []

      orders.forEach(order => {
        if (order.items && order.items.length > 0) {
          // If order has multiple items, create a row for each item
          order.items.forEach((item, index) => {
            exportData.push({
              'PO Number': order.customPoNumber || `PO-${order.id}`,
              'Date': format(new Date(order.date), 'dd/MM/yyyy'),
              'Supplier Name': order.supplierName,
              'Product Name': item.productName,
              'Category': item.category || '',
              'Sizes': Array.isArray(item.sizes) ? item.sizes.join(', ') : '',
              'Fabric Type': item.fabricType || '',
              'Quantity': item.quantity,
              'Price Per Piece (₹)': item.pricePerPiece,
              'Item Total (₹)': item.totalAmount,
              'Subtotal (₹)': order.subtotal || order.totalAmount,
              'GST Type': order.gstType || '',
              'GST Percentage': order.gstPercentage || '',
              'GST Amount (₹)': order.gstAmount || '',
              'Grand Total (₹)': order.grandTotal || order.totalAmount,
              'Notes': order.notes || '',
              'Created At': new Date(order.createdAt).toLocaleDateString(),
            })
          })
        } else {
          // Legacy single-item order
          exportData.push({
            'PO Number': order.customPoNumber || `PO-${order.id}`,
            'Date': format(new Date(order.date), 'dd/MM/yyyy'),
            'Supplier Name': order.supplierName,
            'Product Name': order.productName || '',
            'Category': '',
            'Sizes': Array.isArray(order.sizes) ? order.sizes.join(', ') : '',
            'Fabric Type': order.fabricType || '',
            'Quantity': order.quantity || 0,
            'Price Per Piece (₹)': order.pricePerPiece || 0,
            'Item Total (₹)': order.totalAmount,
            'Subtotal (₹)': order.subtotal || order.totalAmount,
            'GST Type': order.gstType || '',
            'GST Percentage': order.gstPercentage || '',
            'GST Amount (₹)': order.gstAmount || '',
            'Grand Total (₹)': order.grandTotal || order.totalAmount,
            'Notes': order.notes || '',
            'Created At': new Date(order.createdAt).toLocaleDateString(),
          })
        }
      })

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders')

      // Set column widths
      const colWidths = [
        { wch: 15 }, // PO Number
        { wch: 12 }, // Date
        { wch: 20 }, // Supplier Name
        { wch: 25 }, // Product Name
        { wch: 15 }, // Category
        { wch: 20 }, // Sizes
        { wch: 15 }, // Fabric Type
        { wch: 10 }, // Quantity
        { wch: 18 }, // Price Per Piece
        { wch: 15 }, // Item Total
        { wch: 15 }, // Subtotal
        { wch: 12 }, // GST Type
        { wch: 15 }, // GST Percentage
        { wch: 15 }, // GST Amount
        { wch: 15 }, // Grand Total
        { wch: 30 }, // Notes
        { wch: 12 }, // Created At
      ]
      ws['!cols'] = colWidths

      // Generate filename with current date
      const filename = `Purchase_Orders_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`

      // Save file
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  // Download single order as PDF
  const downloadOrderAsPDF = async (order: PurchaseOrder) => {
    try {
      const response = await fetch('/api/purchase-order/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const data = await response.json()
      
      if (data.success && data.html) {
        // Open HTML in new window for printing
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(data.html)
          printWindow.document.close()
        }
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('PDF download error:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  // Download single order as Excel
  const downloadOrderAsExcel = (order: PurchaseOrder) => {
    try {
      const exportData: any[] = []
      const poNumber = order.customPoNumber || `PO-${order.id}`

      if (order.items && order.items.length > 0) {
        // If order has multiple items, create a row for each item
        order.items.forEach((item, index) => {
          exportData.push({
            'PO Number': poNumber,
            'Date': format(new Date(order.date), 'dd/MM/yyyy'),
            'Supplier Name': order.supplierName,
            'Product Name': item.productName,
            'Category': item.category || '',
            'Sizes': Array.isArray(item.sizes) ? item.sizes.join(', ') : '',
            'Fabric Type': item.fabricType || '',
            'Quantity': item.quantity,
            'Price Per Piece (₹)': item.pricePerPiece,
            'Item Total (₹)': item.totalAmount,
            'Subtotal (₹)': order.subtotal || order.totalAmount,
            'GST Type': order.gstType || '',
            'GST Percentage': order.gstPercentage || '',
            'GST Amount (₹)': order.gstAmount || '',
            'Grand Total (₹)': order.grandTotal || order.totalAmount,
            'Notes': order.notes || '',
            'Created At': new Date(order.createdAt).toLocaleDateString(),
          })
        })
      } else {
        // Legacy single-item order
        exportData.push({
          'PO Number': poNumber,
          'Date': format(new Date(order.date), 'dd/MM/yyyy'),
          'Supplier Name': order.supplierName,
          'Product Name': order.productName || '',
          'Category': '',
          'Sizes': Array.isArray(order.sizes) ? order.sizes.join(', ') : '',
          'Fabric Type': order.fabricType || '',
          'Quantity': order.quantity || 0,
          'Price Per Piece (₹)': order.pricePerPiece || 0,
          'Item Total (₹)': order.totalAmount,
          'Subtotal (₹)': order.subtotal || order.totalAmount,
          'GST Type': order.gstType || '',
          'GST Percentage': order.gstPercentage || '',
          'GST Amount (₹)': order.gstAmount || '',
          'Grand Total (₹)': order.grandTotal || order.totalAmount,
          'Notes': order.notes || '',
          'Created At': new Date(order.createdAt).toLocaleDateString(),
        })
      }

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Purchase Order')

      // Set column widths
      const colWidths = [
        { wch: 15 }, // PO Number
        { wch: 12 }, // Date
        { wch: 20 }, // Supplier Name
        { wch: 25 }, // Product Name
        { wch: 15 }, // Category
        { wch: 20 }, // Sizes
        { wch: 15 }, // Fabric Type
        { wch: 10 }, // Quantity
        { wch: 18 }, // Price Per Piece
        { wch: 15 }, // Item Total
        { wch: 15 }, // Subtotal
        { wch: 12 }, // GST Type
        { wch: 15 }, // GST Percentage
        { wch: 15 }, // GST Amount
        { wch: 15 }, // Grand Total
        { wch: 30 }, // Notes
        { wch: 12 }, // Created At
      ]
      ws['!cols'] = colWidths

      // Generate filename
      const filename = `Purchase_Order_${poNumber}_${format(new Date(order.date), 'yyyy-MM-dd')}.xlsx`

      // Save file
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error('Excel export error:', error)
      alert('Failed to export to Excel. Please try again.')
    }
  }

  return (
    <AdminLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header Section - Glassmorphic */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 shadow-2xl">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                  <ShoppingCart className="w-6 h-6 text-emerald-400" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">Purchase Command</h1>
              </div>
              <p className="text-slate-400 font-medium flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Order Tracking • Supplier Network
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
                onClick={() => {
                  resetForm()
                  setShowModal(true)
                }}
                disabled={suppliers.length === 0}
                className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 ring-1 ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                <span>New Order</span>
              </button>
            </div>
          </div>

          {/* StatsRow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'emerald' },
              { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'orange' },
              { label: 'Total Value', value: `₹${totalAmount.toLocaleString()}`, icon: IndianRupee, color: 'blue' },
              { label: 'Active Suppliers', value: new Set(orders.map(o => o.supplierId)).size, icon: Building2, color: 'purple' }
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

        {suppliers.length === 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-6 py-4 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>Please add suppliers first before creating purchase orders. <a href="/admin/suppliers" className="underline font-bold hover:text-orange-300">Go to Suppliers</a></p>
          </div>
        )}

        {/* Filters and List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders, suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-500"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-3 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="px-4 py-3 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-4 py-3 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Months</option>
                <option value="01">Jan</option><option value="02">Feb</option><option value="03">Mar</option>
                <option value="04">Apr</option><option value="05">May</option><option value="06">Jun</option>
                <option value="07">Jul</option><option value="08">Aug</option><option value="09">Sep</option>
                <option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 uppercase text-[10px] sm:text-xs tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="p-4 sm:p-6 font-black w-[15%]">PO Details</th>
                    <th className="p-4 sm:p-6 font-black w-[20%]">Supplier</th>
                    <th className="p-4 sm:p-6 font-black w-[25%]">Financials</th>
                    <th className="p-4 sm:p-6 font-black w-[15%]">Status</th>
                    <th className="p-4 sm:p-6 font-black text-right w-[25%]">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <AnimatePresence>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-500">
                           <div className="flex flex-col items-center gap-3">
                              <ShoppingCart className="w-8 h-8 opacity-20" />
                              <p className="text-sm font-medium">No purchase orders found</p>
                           </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                          onClick={() => handleViewDetails(order)}
                        >
                          <td className="p-4 sm:p-6 align-top">
                            <div className="flex items-start gap-3">
                              <div className="hidden sm:flex mt-1 w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 items-center justify-center shrink-0 border border-emerald-500/20">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-white text-sm sm:text-base truncate">
                                  {order.customPoNumber || `PO-${order.id}`}
                                </h3>
                                <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(order.date), 'dd MMM yyyy')}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 sm:p-6 align-top">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-200 text-sm truncate">{order.supplierName}</span>
                              <span className="text-xs text-slate-500 font-medium mt-1">
                                {order.items?.length || 0} product{(order.items?.length || 0) !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 sm:p-6 align-top">
                             <div className="flex flex-col gap-1">
                                <div className="flex items-end gap-2">
                                   <span className="text-lg font-black tracking-tight text-white">
                                     ₹{(order.grandTotal || order.totalAmount || 0).toLocaleString()}
                                   </span>
                                </div>
                                {(order.gstAmount || 0) > 0 && (
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    INCL. GST ₹{(order.gstAmount || 0).toLocaleString()}
                                  </span>
                                )}
                             </div>
                          </td>
                          <td className="p-4 sm:p-6 align-top">
                            <StatusBadge 
                              status={order.status === 'open' ? 'Approved' : order.status === 'rejected' ? 'Rejected' : 'Pending'}
                              variant={order.status === 'open' ? 'success' : order.status === 'rejected' ? 'danger' : 'warning'}
                            />
                          </td>
                          <td className="p-4 sm:p-6 align-top">
                            <div className="flex flex-wrap gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                                <ActionButton 
                                  icon={DownloadCloud} 
                                  onClick={(e) => { e?.stopPropagation(); downloadOrderAsPDF(order); }}
                                  variant="primary" 
                                >
                                  PDF
                                </ActionButton>
                                <ActionButton 
                                  icon={Link} 
                                  onClick={(e) => { e?.stopPropagation(); downloadOrderAsExcel(order); }}
                                  variant="secondary" 
                                >
                                  Excel
                                </ActionButton>
                                <ActionButton 
                                  icon={Activity} 
                                  onClick={(e) => { e?.stopPropagation(); handleEdit(order); }}
                                  variant="ghost" 
                                >
                                  Edit
                                </ActionButton>
                                <ActionButton 
                                  icon={XCircle} 
                                  onClick={(e) => { e?.stopPropagation(); handleDelete(order.id); }}
                                  variant="danger" 
                                >
                                  Erase
                                </ActionButton>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Modal */}
{/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">
                {editingOrder ? 'Edit Purchase Order' : 'Add Purchase Order'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                    <div className="flex items-center gap-2">
                      <select
                        required
                        value={formData.supplierId}
                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name} {supplier.gstPercentage ? `(GST: ${supplier.gstPercentage}%)` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickSupplierForm({ name: '', phone: '', email: '', address: '' })
                          setShowQuickSupplierModal(true)
                        }}
                        className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center min-w-[44px]"
                        title="Add new supplier"
                      >
                        <span className="text-xl font-bold">+</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomPo"
                    checked={formData.useCustomPo}
                    onChange={(e) => setFormData({ ...formData, useCustomPo: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="useCustomPo" className="text-sm font-medium text-gray-700">
                    Use Custom PO Number
                  </label>
                </div>

                {formData.useCustomPo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom PO Number *</label>
                    <input
                      type="text"
                      required={formData.useCustomPo}
                      value={formData.customPoNumber}
                      onChange={(e) => setFormData({ ...formData, customPoNumber: e.target.value })}
                      placeholder="e.g., PO-2024-001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {/* Products Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Products</h3>
                  </div>

                  {items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-700">Product {index + 1}</h4>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                          <input
                            type="text"
                            list={`products-list-${index}`}
                            required
                            value={item.productName}
                            onChange={(e) => {
                              const val = e.target.value
                              updateItem(index, 'productName', val)
                              // Auto-fill category and fabricType if selected from existing inventory
                              const selectedProduct = inventoryItems.find((inv) =>
                                inv.dressName.toLowerCase() === val.toLowerCase() &&
                                (!formData.supplierId || inv.supplierName === suppliers.find(s => s.id === formData.supplierId)?.name)
                              )
                              if (selectedProduct) {
                                if (!item.category) updateItem(index, 'category', selectedProduct.category)
                                if (!item.fabricType) updateItem(index, 'fabricType', selectedProduct.fabricType)
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <datalist id={`products-list-${index}`}>
                            {inventoryItems
                              .filter(inv => !formData.supplierId || inv.supplierName === suppliers.find(s => s.id === formData.supplierId)?.name)
                              .map(inv => <option key={inv.id} value={inv.dressName} />)
                            }
                          </datalist>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <div className="flex gap-2">
                            <select
                              value={item.category}
                              onChange={(e) => updateItem(index, 'category', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="">Select a category...</option>
                              {getCategoryOptions()}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setNewCategoryName('')
                                setNewCategoryParentId('')
                                setCategoryModalItemIndex(index)
                                setShowCategoryModal(true)
                              }}
                              className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center min-w-[44px]"
                              title="Add new category or sub-category"
                            >
                              <span className="text-xl font-bold">+</span>
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500">
                              Select from dropdown or click + to add new
                            </p>
                            <a
                              href="/admin/categories"
                              target="_blank"
                              className="text-xs text-purple-600 hover:underline"
                            >
                              Manage categories
                            </a>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Type</label>
                          <input
                            type="text"
                            value={item.fabricType || ''}
                            onChange={(e) => updateItem(index, 'fabricType', e.target.value)}
                            placeholder="e.g., Cotton, Silk"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sizes (comma-separated)</label>
                          <input
                            type="text"
                            value={item.sizes?.join(', ') || ''}
                            onChange={(e) => updateItem(index, 'sizes', e.target.value)}
                            placeholder="M, L, XL"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price per Piece (₹) *</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={item.pricePerPiece}
                            onChange={(e) => updateItem(index, 'pricePerPiece', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product Images (multiple allowed)</label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(e, index)}
                            disabled={uploadingIndex === index}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                          />
                          {uploadingIndex === index && (
                            <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                          )}
                          {item.productImages && item.productImages.length > 0 && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-2 mb-2">
                                {item.productImages.map((img, imgIndex) => (
                                  <div
                                    key={imgIndex}
                                    className="relative w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity rounded border border-gray-200 overflow-hidden group"
                                    onClick={() => {
                                      setLightboxImages(item.productImages || [])
                                      setLightboxIndex(imgIndex)
                                      setShowImageLightbox(true)
                                    }}
                                    title="Click to view full size"
                                  >
                                    <Image
                                      src={img}
                                      alt={`Product ${index + 1} - Image ${imgIndex + 1}`}
                                      fill
                                      className="object-cover"
                                      sizes="80px"
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeImage(index, imgIndex)
                                      }}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Remove image"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500">Click any image to view full size</p>
                            </div>
                          )}
                        </div>

                        <div className="col-span-2 bg-purple-50 p-3 rounded">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-700">Item Total:</span>
                            <span className="text-lg font-bold text-purple-600">₹{item.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* GST Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold mb-4">GST Settings</h3>
                  {(() => {
                    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId)
                    return (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">GST Type</label>
                          <div className="flex gap-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="percentage"
                                checked={formData.gstType === 'percentage'}
                                onChange={(e) => setFormData({ ...formData, gstType: 'percentage' as const, gstAmountRupees: 0 })}
                                className="mr-2"
                              />
                              Percentage (%)
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="rupees"
                                checked={formData.gstType === 'rupees'}
                                onChange={(e) => setFormData({ ...formData, gstType: 'rupees' as const, gstPercentage: 0 })}
                                className="mr-2"
                              />
                              Fixed Amount (₹)
                            </label>
                          </div>
                        </div>

                        {formData.gstType === 'percentage' ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              GST Percentage {selectedSupplier?.gstPercentage ? `(Default: ${selectedSupplier.gstPercentage}%)` : ''}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={editingOrder
                                ? (formData.gstPercentage !== undefined && formData.gstPercentage !== null ? formData.gstPercentage : '')
                                : (formData.gstPercentage || selectedSupplier?.gstPercentage || '')}
                              onChange={(e) => setFormData({ ...formData, gstPercentage: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                              placeholder={selectedSupplier?.gstPercentage ? `${selectedSupplier.gstPercentage}` : 'Enter GST %'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to use supplier&apos;s default GST percentage</p>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              GST Amount (₹) {selectedSupplier?.gstAmountRupees ? `(Default: ₹${selectedSupplier.gstAmountRupees})` : ''}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingOrder
                                ? (formData.gstAmountRupees !== undefined && formData.gstAmountRupees !== null ? formData.gstAmountRupees : '')
                                : (formData.gstAmountRupees || selectedSupplier?.gstAmountRupees || '')}
                              onChange={(e) => setFormData({ ...formData, gstAmountRupees: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                              placeholder={selectedSupplier?.gstAmountRupees ? `${selectedSupplier.gstAmountRupees}` : 'Enter GST amount'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to use supplier&apos;s default GST amount</p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* Transport Details Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold mb-4">Transport Details</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logistics Name</label>
                        <input
                          type="text"
                          value={formData.logisticsName}
                          onChange={(e) => setFormData({ ...formData, logisticsName: e.target.value })}
                          placeholder="Enter logistics name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                        <input
                          type="tel"
                          value={formData.logisticsMobile}
                          onChange={(e) => setFormData({ ...formData, logisticsMobile: e.target.value })}
                          placeholder="Enter mobile number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transport Address</label>
                      <textarea
                        rows={3}
                        value={formData.transportAddress}
                        onChange={(e) => setFormData({ ...formData, transportAddress: e.target.value })}
                        placeholder="Enter transport address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (optional)</label>
                      <input
                        ref={transportImageFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleTransportImageUpload}
                        disabled={uploadingTransportImage}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                      />
                      {uploadingTransportImage && (
                        <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                      )}
                      {formData.transportImage && (
                        <div className="mt-2">
                          <div className="relative inline-block max-w-xs">
                            <div
                              className="relative w-full h-32 cursor-pointer hover:opacity-80 transition-opacity rounded border border-gray-200 overflow-hidden group"
                              onClick={() => {
                                setLightboxImages([formData.transportImage])
                                setLightboxIndex(0)
                                setShowImageLightbox(true)
                              }}
                              title="Click to view full size"
                            >
                              <Image
                                src={formData.transportImage}
                                alt="Transport Image"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 384px"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setFormData(prev => ({ ...prev, transportImage: '' }))
                                  if (transportImageFileInputRef.current) {
                                    transportImageFileInputRef.current.value = ''
                                  }
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center hover:bg-red-600 transition-colors z-10 opacity-0 group-hover:opacity-100"
                                title="Remove Image"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Click image to view full size</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                        <input
                          type="text"
                          value={formData.invoiceNumber}
                          onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                          placeholder="Enter invoice number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                        <input
                          type="date"
                          value={formData.invoiceDate}
                          onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transport Charges (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.transportCharges || ''}
                        onChange={(e) => setFormData({ ...formData, transportCharges: parseFloat(e.target.value) || 0 })}
                        placeholder="Enter transport charges"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Contact Persons */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Contact Persons</label>
                        <button
                          type="button"
                          onClick={addContactPerson}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
                        >
                          <span>+</span>
                          <span>Add Contact Person</span>
                        </button>
                      </div>
                      {contactPersons.length === 0 && (
                        <p className="text-xs text-gray-500 mb-2">No contact persons added. Click &quot;Add Contact Person&quot; to add one.</p>
                      )}
                      {contactPersons.map((person, index) => (
                        <div key={index} className="border rounded-lg p-3 mb-2 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-gray-700">Contact Person {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeContactPerson(index)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Person Name</label>
                              <input
                                type="text"
                                value={person.name}
                                onChange={(e) => updateContactPerson(index, 'name', e.target.value)}
                                placeholder="Enter name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number</label>
                              <input
                                type="tel"
                                value={person.mobile}
                                onChange={(e) => updateContactPerson(index, 'mobile', e.target.value)}
                                placeholder="Enter mobile number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Invoice Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Image (optional)</label>
                  <input
                    ref={invoiceFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInvoiceUpload}
                    disabled={uploadingInvoice}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  />
                  {uploadingInvoice && (
                    <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                  )}
                  {formData.invoiceImage && (
                    <div className="mt-2">
                      <div className="relative inline-block max-w-xs">
                        <div
                          className="relative w-full h-32 cursor-pointer hover:opacity-80 transition-opacity rounded border border-gray-200 overflow-hidden group"
                          onClick={() => {
                            setLightboxImages([formData.invoiceImage])
                            setLightboxIndex(0)
                            setShowImageLightbox(true)
                          }}
                          title="Click to view full size"
                        >
                          <Image
                            src={formData.invoiceImage}
                            alt="Invoice"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 384px"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFormData(prev => ({ ...prev, invoiceImage: '' }))
                              // Reset the file input
                              if (invoiceFileInputRef.current) {
                                invoiceFileInputRef.current.value = ''
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center hover:bg-red-600 transition-colors z-10 opacity-0 group-hover:opacity-100"
                            title="Remove Invoice"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Click image to view full size</p>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="bg-purple-50 p-4 rounded-lg border-t-2 border-purple-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                      <span className="text-lg font-bold text-gray-900">₹{totals.subtotal.toLocaleString()}</span>
                    </div>
                    {totals.gstAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          GST {totals.gstType === 'percentage' ? `(${totals.gstPercentage}%)` : '(Fixed)'}:
                        </span>
                        <span className="text-lg font-bold text-gray-900">₹{totals.gstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {totals.transportCharges > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Transport Charges:</span>
                        <span className="text-lg font-bold text-gray-900">₹{totals.transportCharges.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-purple-300">
                      <span className="text-xl font-bold text-gray-900">Grand Total:</span>
                      <span className="text-2xl font-bold text-purple-600">₹{totals.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Restock Choice */}
                {editingOrder && (
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer p-4 bg-purple-50 rounded-lg border border-purple-100 transition-colors hover:bg-purple-100">
                      <input
                        type="checkbox"
                        checked={formData.restockInventory}
                        onChange={(e) => setFormData({ ...formData, restockInventory: e.target.checked })}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-purple-900">Restock items in inventory upon approval?</span>
                        <span className="text-sm text-purple-700">If checked, inventory quantities will automatically increment when this Purchase Order is approved.</span>
                      </div>
                    </label>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <span>+</span>
                    <span>Add Product / Material</span>
                  </button>
                  <div className="flex space-x-4">
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
                      className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      {editingOrder ? 'Update' : 'Add'} Order
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Purchase Order: {selectedOrder.customPoNumber || `PO-${selectedOrder.id}`}
                  {(() => {
                    // Get product name(s)
                    let productName = ''
                    if (selectedOrder.items && selectedOrder.items.length > 0) {
                      const names = selectedOrder.items.map(item => item.productName).filter(Boolean)
                      if (names.length === 1) {
                        productName = names[0]
                      } else if (names.length > 1) {
                        productName = `${names[0]}${names.length > 1 ? ` +${names.length - 1} more` : ''}`
                      }
                    } else if (selectedOrder.productName) {
                      productName = selectedOrder.productName
                    }
                    return productName ? ` - ${productName}` : ''
                  })()}
                </h2>
                <div className="flex gap-3">
                  {/* Download PDF Button */}
                  <button
                    onClick={() => downloadOrderAsPDF(selectedOrder)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    title="Download as PDF"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </button>
                  {/* Download Excel Button */}
                  <button
                    onClick={() => downloadOrderAsExcel(selectedOrder)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    title="Download as Excel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel
                  </button>
                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedOrder(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Supplier</label>
                    <p className="text-lg text-gray-900">{selectedOrder.supplierName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date</label>
                    <p className="text-lg text-gray-900">{format(new Date(selectedOrder.date), 'dd MMM yyyy')}</p>
                  </div>
                </div>

                {/* Products List */}
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Products</h3>
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-900">{item.productName}</h4>
                          <span className="text-sm text-gray-500">{item.category}</span>
                        </div>
                        {item.productImages && item.productImages.length > 0 && (
                          <div className="mb-2">
                            <div className="flex gap-2 flex-wrap mb-2">
                              {item.productImages.map((img, imgIndex) => (
                                <div
                                  key={imgIndex}
                                  className="relative w-24 h-24 cursor-pointer hover:opacity-80 transition-opacity rounded border border-gray-200 overflow-hidden"
                                  onClick={() => {
                                    setLightboxImages(item.productImages || [])
                                    setLightboxIndex(imgIndex)
                                    setShowImageLightbox(true)
                                  }}
                                  title="Click to view full size"
                                >
                                  <Image
                                    src={img}
                                    alt={`${item.productName} - Image ${imgIndex + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                  />
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">Click any image to view full size</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Sizes: </span>
                            <span className="font-medium">{item.sizes?.join(', ') || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Fabric: </span>
                            <span className="font-medium">{item.fabricType || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Quantity: </span>
                            <span className="font-medium">{item.quantity} pieces</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Price: </span>
                            <span className="font-medium">₹{item.pricePerPiece} per piece</span>
                          </div>
                          <div className="col-span-2 pt-2 border-t">
                            <span className="text-gray-600">Item Total: </span>
                            <span className="font-bold text-green-600">₹{item.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold text-gray-900">{selectedOrder.productName || 'Product'}</h4>
                    {selectedOrder.productImage && (
                      <div
                        className="relative w-full h-64 my-4 cursor-pointer hover:opacity-80 transition-opacity rounded-lg border-2 border-gray-200 overflow-hidden"
                        onClick={() => {
                          setLightboxImages([selectedOrder.productImage!])
                          setLightboxIndex(0)
                          setShowImageLightbox(true)
                        }}
                        title="Click to view full size"
                      >
                        <Image
                          src={selectedOrder.productImage}
                          alt={selectedOrder.productName || 'Product'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div>
                        <span className="text-gray-600">Sizes: </span>
                        <span className="font-medium">{(selectedOrder.sizes || []).join(', ') || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Quantity: </span>
                        <span className="font-medium">{selectedOrder.quantity} pieces</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invoice Image */}
                {selectedOrder.invoiceImage && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Invoice</label>
                    <div
                      className="relative w-full max-w-md aspect-auto cursor-pointer hover:opacity-80 transition-opacity rounded-lg border-2 border-gray-200 overflow-hidden"
                      onClick={() => {
                        setLightboxImages([selectedOrder.invoiceImage!])
                        setLightboxIndex(0)
                        setShowImageLightbox(true)
                      }}
                      title="Click to view full size"
                    >
                      <Image
                        src={selectedOrder.invoiceImage}
                        alt="Invoice"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Click image to view full size</p>
                  </div>
                )}

                {/* Transport Details */}
                {((selectedOrder as any).logisticsName || (selectedOrder as any).logisticsMobile || (selectedOrder as any).transportAddress || (selectedOrder as any).transportImage || (selectedOrder as any).invoiceNumber || (selectedOrder as any).invoiceDate || (selectedOrder as any).transportCharges || ((selectedOrder as any).contactPersons && (selectedOrder as any).contactPersons.length > 0)) && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-bold mb-4">Transport Details</h3>
                    <div className="space-y-4">
                      {((selectedOrder as any).logisticsName || (selectedOrder as any).logisticsMobile || (selectedOrder as any).transportAddress) && (
                        <div className="grid grid-cols-2 gap-4">
                          {(selectedOrder as any).logisticsName && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Logistics Name</label>
                              <p className="text-lg text-gray-900">{(selectedOrder as any).logisticsName}</p>
                            </div>
                          )}
                          {(selectedOrder as any).logisticsMobile && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Mobile Number</label>
                              <p className="text-lg text-gray-900">{(selectedOrder as any).logisticsMobile}</p>
                            </div>
                          )}
                          {(selectedOrder as any).transportAddress && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium text-gray-500">Transport Address</label>
                              <p className="text-sm text-gray-900">{(selectedOrder as any).transportAddress}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {((selectedOrder as any).invoiceNumber || (selectedOrder as any).invoiceDate) && (
                        <div className="grid grid-cols-2 gap-4">
                          {(selectedOrder as any).invoiceNumber && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                              <p className="text-lg text-gray-900">{(selectedOrder as any).invoiceNumber}</p>
                            </div>
                          )}
                          {(selectedOrder as any).invoiceDate && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Invoice Date</label>
                              <p className="text-lg text-gray-900">{format(new Date((selectedOrder as any).invoiceDate), 'dd MMM yyyy')}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {(selectedOrder as any).transportImage && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-2 block">Transport Image</label>
                          <div
                            className="relative w-full max-w-md aspect-auto cursor-pointer hover:opacity-80 transition-opacity rounded-lg border-2 border-gray-200 overflow-hidden"
                            onClick={() => {
                              setLightboxImages([(selectedOrder as any).transportImage])
                              setLightboxIndex(0)
                              setShowImageLightbox(true)
                            }}
                            title="Click to view full size"
                          >
                            <Image
                              src={(selectedOrder as any).transportImage}
                              alt="Transport Image"
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Click image to view full size</p>
                        </div>
                      )}

                      {(selectedOrder as any).transportCharges && (selectedOrder as any).transportCharges > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Transport Charges</label>
                          <p className="text-lg font-bold text-gray-900">₹{(selectedOrder as any).transportCharges.toLocaleString()}</p>
                        </div>
                      )}

                      {(selectedOrder as any).contactPersons && (selectedOrder as any).contactPersons.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-2 block">Contact Persons</label>
                          <div className="space-y-2">
                            {(selectedOrder as any).contactPersons.map((person: { name: string, mobile: string }, index: number) => (
                              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">Name</label>
                                    <p className="text-sm text-gray-900">{person.name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">Mobile</label>
                                    <p className="text-sm text-gray-900">{person.mobile || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{(selectedOrder.subtotal || selectedOrder.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    {selectedOrder.gstAmount && selectedOrder.gstAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          GST {selectedOrder.gstType === 'percentage' && selectedOrder.gstPercentage
                            ? `(${selectedOrder.gstPercentage}%)`
                            : selectedOrder.gstType === 'rupees' || (selectedOrder as any).gstAmountRupees
                              ? '(Fixed)'
                              : ''}:
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{selectedOrder.gstAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {(selectedOrder as any).transportCharges && (selectedOrder as any).transportCharges > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Transport Charges:</span>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{(selectedOrder as any).transportCharges.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-purple-300">
                      <span className="text-xl font-bold text-gray-900">Grand Total:</span>
                      <span className="text-2xl font-bold text-purple-600">
                        ₹{(() => {
                          const subtotal = selectedOrder.subtotal || selectedOrder.totalAmount || 0
                          const gst = selectedOrder.gstAmount || 0
                          const transport = (selectedOrder as any).transportCharges || 0
                          return (subtotal + gst + transport).toLocaleString()
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      handleEdit(selectedOrder)
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ✏️ Edit Order
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedOrder(null)
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
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

        {/* Create Category/Sub-Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-2">Create Category</h2>
              <p className="text-sm text-gray-500 mb-6">Create a new category or sub-category</p>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateCategory(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Type
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="categoryType"
                        value="root"
                        checked={!newCategoryParentId}
                        onChange={() => setNewCategoryParentId('')}
                        className="mr-2"
                      />
                      <span className="text-sm">Root Category</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="categoryType"
                        value="sub"
                        checked={!!newCategoryParentId}
                        onChange={() => {
                          if (!newCategoryParentId && getRootCategories().length > 0) {
                            setNewCategoryParentId(getRootCategories()[0].id)
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">Sub-Category</span>
                    </label>
                  </div>
                </div>

                {newCategoryParentId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Category *
                    </label>
                    <select
                      value={newCategoryParentId}
                      onChange={(e) => setNewCategoryParentId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required={!!newCategoryParentId}
                    >
                      <option value="">Select parent category...</option>
                      {getRootCategories().map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the parent category for this sub-category
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newCategoryParentId ? 'Sub-Category Name *' : 'Category Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={newCategoryParentId ? "e.g., Anarkali, Straight, A-Line" : "e.g., Kurtis, Dresses, Sarees"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                  {newCategoryParentId && (
                    <p className="text-xs text-gray-500 mt-1">
                      This will be created under: <span className="font-medium">{getCategoryPath(newCategoryParentId)}</span>
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Tip:</strong> {newCategoryParentId
                      ? 'Sub-categories help organize products under main categories. Example: "Anarkali" under "Kurtis".'
                      : 'Root categories are main product types. You can add sub-categories later to organize further.'}
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCategoryName('')
                      setNewCategoryParentId('')
                      setCategoryModalItemIndex(null)
                      setShowCategoryModal(false)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    {newCategoryParentId ? 'Create Sub-Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Supplier Creation Modal */}
        {showQuickSupplierModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Quick Add Supplier</h2>
              <form onSubmit={handleQuickSupplierCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={quickSupplierForm.name}
                    onChange={(e) => setQuickSupplierForm({ ...quickSupplierForm, name: e.target.value })}
                    placeholder="Supplier name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={quickSupplierForm.phone}
                    onChange={(e) => setQuickSupplierForm({ ...quickSupplierForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={quickSupplierForm.email}
                    onChange={(e) => setQuickSupplierForm({ ...quickSupplierForm, email: e.target.value })}
                    placeholder="supplier@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
                  <textarea
                    value={quickSupplierForm.address}
                    onChange={(e) => setQuickSupplierForm({ ...quickSupplierForm, address: e.target.value })}
                    rows={3}
                    placeholder="Supplier address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickSupplierForm({ name: '', phone: '', email: '', address: '' })
                      setShowQuickSupplierModal(false)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Supplier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </motion.div>

    </AdminLayout>
  )
}
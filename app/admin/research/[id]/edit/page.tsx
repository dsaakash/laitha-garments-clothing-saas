'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import AdminLayout from '@/components/AdminLayout'
import { ArrowLeft, Save, Plus, X, MapPin, Video, Image as ImageIcon, User, Package, Home, Globe, Link2 } from 'lucide-react'
import { uploadImage } from '@/lib/cloudinary'

interface ReferenceLink {
  type: string
  url: string
  title: string
  description: string
  embeddable: boolean
}

interface Product {
  id: string
  name: string
  type: string
  description: string
  price: string
  priceCurrency: string
  priceNotes: string
  images: string[]
}

export default function EditResearchPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [activeTab, setActiveTab] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({})
  const [formData, setFormData] = useState({
    supplierName: '',
    contactNumber: '',
    email: '',
    whatsappNumber: '',
    address: '',
    mapLocation: '',
    mapPinGroup: '',
    products: [] as Product[],
    referenceLinks: [] as ReferenceLink[],
    researchNotes: '',
    status: 'New' as 'New' | 'Reviewed' | 'Interested' | 'Not Suitable',
    tags: [] as string[],
    researchDate: new Date().toISOString().split('T')[0],
    followUpDate: '',
  })
  const [newLink, setNewLink] = useState({ type: 'youtube', url: '', title: '', description: '' })

  const tabs = [
    { id: 1, label: 'Supplier Details', icon: User },
    { id: 2, label: 'Product Details', icon: Package },
    { id: 3, label: 'Address Details', icon: Home },
    { id: 4, label: 'Google Maps Location', icon: Globe },
    { id: 5, label: 'YouTube Reference Links', icon: Link2 },
  ]

  useEffect(() => {
    if (id) {
      loadEntry()
    }
  }, [id])

  const loadEntry = async () => {
    try {
      setLoadingData(true)
      const response = await fetch(`/api/research/${id}`, { credentials: 'include' })
      const result = await response.json()

      if (result.success && result.data) {
        const data = result.data
        
        // Use products array if available, otherwise create from legacy fields
        let products: Product[] = []
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          products = data.products.map((p: any, idx: number) => ({
            id: `${Date.now()}-${idx}`,
            name: p.name || '',
            type: p.type || '',
            description: p.description || '',
            price: p.price !== null && p.price !== undefined ? String(p.price) : '',
            priceCurrency: p.priceCurrency || '₹',
            priceNotes: p.priceNotes || '',
            images: Array.isArray(p.images) ? p.images : []
          }))
        } else if (data.materialName) {
          // Backward compatibility: create product from legacy fields
          products = [{
            id: Date.now().toString(),
            name: data.materialName || '',
            type: data.materialType || '',
            description: data.materialDescription || '',
            price: data.price !== null && data.price !== undefined ? String(data.price) : '',
            priceCurrency: data.priceCurrency || '₹',
            priceNotes: data.priceNotes || '',
            images: Array.isArray(data.materialImages) ? data.materialImages : []
          }]
        }
        
        setFormData({
          supplierName: data.supplierName || '',
          contactNumber: data.contactNumber || '',
          email: data.email || '',
          whatsappNumber: data.whatsappNumber || '',
          address: data.address || '',
          mapLocation: data.mapLocation || '',
          mapPinGroup: data.mapPinGroup || '',
          products: products,
          referenceLinks: Array.isArray(data.referenceLinks) ? data.referenceLinks.map((link: any) => ({
            type: link.type || 'website',
            url: link.url || '',
            title: link.title || '',
            description: link.description || '',
            embeddable: link.embeddable !== undefined ? link.embeddable : false
          })) : [],
          researchNotes: data.researchNotes || '',
          status: data.status || 'New',
          tags: Array.isArray(data.tags) ? data.tags : [],
          researchDate: data.researchDate ? data.researchDate.split('T')[0] : new Date().toISOString().split('T')[0],
          followUpDate: data.followUpDate ? data.followUpDate.split('T')[0] : '',
        })
      } else {
        alert(result.message || 'Failed to load research entry')
        router.push('/admin/research')
      }
    } catch (error) {
      console.error('Failed to load research entry:', error)
      alert('Failed to load research entry')
      router.push('/admin/research')
    } finally {
      setLoadingData(false)
    }
  }

  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: '',
      type: '',
      description: '',
      price: '',
      priceCurrency: '₹',
      priceNotes: '',
      images: []
    }
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }))
  }

  const removeProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId)
    }))
  }

  const updateProduct = (productId: string, field: keyof Product, value: any) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === productId ? { ...p, [field]: value } : p
      )
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(prev => ({ ...prev, [productId]: true }))
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file))
      const urls = await Promise.all(uploadPromises)
      updateProduct(productId, 'images', [...formData.products.find(p => p.id === productId)?.images || [], ...urls])
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to upload images')
    } finally {
      setUploadingImages(prev => ({ ...prev, [productId]: false }))
    }
  }

  const removeImage = (productId: string, imageIndex: number) => {
    const product = formData.products.find(p => p.id === productId)
    if (product) {
      updateProduct(productId, 'images', product.images.filter((_, i) => i !== imageIndex))
    }
  }

  const detectLinkType = (url: string): { type: string; embeddable: boolean } => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return { type: 'youtube', embeddable: true }
    }
    if (url.includes('vimeo.com')) {
      return { type: 'vimeo', embeddable: true }
    }
    if (url.includes('instagram.com')) {
      return { type: 'instagram', embeddable: true }
    }
    return { type: 'website', embeddable: false }
  }

  const addReferenceLink = () => {
    if (newLink.url.trim()) {
      const { type, embeddable } = detectLinkType(newLink.url)
      setFormData(prev => ({
        ...prev,
        referenceLinks: [...prev.referenceLinks, {
          type,
          url: newLink.url.trim(),
          title: newLink.title.trim(),
          description: newLink.description.trim(),
          embeddable
        }]
      }))
      setNewLink({ type: 'youtube', url: '', title: '', description: '' })
    }
  }

  const removeReferenceLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referenceLinks: prev.referenceLinks.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.supplierName.trim()) {
      alert('Please fill in supplier name')
      setActiveTab(1)
      return
    }
    if (formData.products.length === 0) {
      alert('Please add at least one product')
      setActiveTab(2)
      return
    }
    if (formData.products.some(p => !p.name.trim())) {
      alert('Please fill in product name for all products')
      setActiveTab(2)
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/research/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierName: formData.supplierName,
          contactNumber: formData.contactNumber,
          email: formData.email,
          whatsappNumber: formData.whatsappNumber,
          address: formData.address,
          mapLocation: formData.mapLocation,
          mapPinGroup: formData.mapPinGroup,
          products: formData.products.map(p => ({
            name: p.name,
            type: p.type,
            description: p.description,
            price: p.price ? parseFloat(p.price) : null,
            priceCurrency: p.priceCurrency,
            priceNotes: p.priceNotes,
            images: p.images
          })),
          referenceLinks: formData.referenceLinks,
          researchNotes: formData.researchNotes,
          status: formData.status,
          tags: formData.tags,
          researchDate: formData.researchDate,
          followUpDate: formData.followUpDate || null,
        }),
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        router.push(`/admin/research/${id}`)
      } else {
        alert(result.message || 'Failed to update research entry')
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to update research:', error)
      alert('Failed to update research entry')
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading research entry...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Raw Research Entry</h1>
            <p className="text-gray-500 mt-1">Update supplier and material research information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Tab 1: Supplier Details */}
            {activeTab === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Supplier Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter supplier name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                    <input
                      type="tel"
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="WhatsApp number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Product Details - Multiple Products */}
            {activeTab === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
                  <button
                    type="button"
                    onClick={addProduct}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>

                {formData.products.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">No products added yet</p>
                    <button
                      type="button"
                      onClick={addProduct}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {formData.products.map((product, index) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Product {index + 1}</h3>
                          {formData.products.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProduct(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                            <input
                              type="text"
                              required
                              value={product.name}
                              onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Material or product name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                            <input
                              type="text"
                              value={product.type}
                              onChange={(e) => updateProduct(product.id, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Fabric, Accessories, etc."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={product.price}
                                onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="0.00"
                              />
                              <select
                                value={product.priceCurrency}
                                onChange={(e) => updateProduct(product.id, 'priceCurrency', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="₹">₹</option>
                                <option value="$">$</option>
                                <option value="€">€</option>
                              </select>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                            <textarea
                              value={product.description}
                              onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Material details, quality, specifications..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price Notes</label>
                            <input
                              type="text"
                              value={product.priceNotes}
                              onChange={(e) => updateProduct(product.id, 'priceNotes', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Price per piece, per meter, bulk discount, etc."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors">
                                  <ImageIcon className="w-5 h-5" />
                                  Upload Images to Cloudinary
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, product.id)}
                                    className="hidden"
                                    disabled={uploadingImages[product.id]}
                                  />
                                </label>
                                {uploadingImages[product.id] && <span className="text-sm text-gray-500">Uploading...</span>}
                              </div>
                              {product.images.length > 0 && (
                                <div className="grid grid-cols-4 gap-4">
                                  {product.images.map((url, imgIndex) => (
                                    <div key={imgIndex} className="relative group">
                                      <Image 
                                        src={url} 
                                        alt={`Product ${index + 1} Image ${imgIndex + 1}`} 
                                        width={128} 
                                        height={128}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-200" 
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeImage(product.id, imgIndex)}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addProduct}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors inline-flex items-center justify-center gap-2 text-gray-600 hover:text-purple-700 font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      Add Another Product
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Address Details */}
            {activeTab === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Address Details</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter complete supplier address"
                  />
                </div>
              </div>
            )}

            {/* Tab 4: Google Maps Location */}
            {activeTab === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Google Maps Location</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Map Location</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.mapLocation}
                        onChange={(e) => setFormData({ ...formData, mapLocation: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Google Maps link or address"
                      />
                      {formData.mapLocation && (
                        <a
                          href={formData.mapLocation.startsWith('http') ? formData.mapLocation : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.mapLocation)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          <MapPin className="w-4 h-4" />
                          View Map
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Map Pin Group</label>
                    <input
                      type="text"
                      value={formData.mapPinGroup}
                      onChange={(e) => setFormData({ ...formData, mapPinGroup: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Group name (e.g., Surat Area, Mumbai Suppliers)"
                    />
                    <p className="text-sm text-gray-500 mt-1">Group pins by location or region for better organization</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: YouTube Reference Links */}
            {activeTab === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">YouTube Reference Links</h2>
                <div className="space-y-4">
                  {formData.referenceLinks.map((link, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Video className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">{link.type.toUpperCase()}</span>
                          {link.embeddable && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Embeddable</span>}
                        </div>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline break-all">
                          {link.url}
                        </a>
                        {link.title && <p className="text-sm text-gray-600 mt-1 font-medium">{link.title}</p>}
                        {link.description && <p className="text-sm text-gray-500 mt-1">{link.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeReferenceLink(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link Type</label>
                        <select
                          value={newLink.type}
                          onChange={(e) => setNewLink({ ...newLink, type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="youtube">YouTube Video</option>
                          <option value="vimeo">Vimeo</option>
                          <option value="instagram">Instagram</option>
                          <option value="website">Website</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link URL *</label>
                        <input
                          type="url"
                          value={newLink.url}
                          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title (Optional)</label>
                        <input
                          type="text"
                          value={newLink.title}
                          onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Link title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <input
                          type="text"
                          value={newLink.description}
                          onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Link description"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addReferenceLink}
                      className="w-full px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Reference Link
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation and Submit */}
          <div className="border-t border-gray-200 p-6 flex justify-between items-center">
            <div className="flex gap-2">
              {activeTab > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Previous
                </button>
              )}
              {activeTab < 5 && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab + 1)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  Next
                </button>
              )}
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Research Entry'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, MapPin, Video, Image as ImageIcon, ExternalLink, Phone, Mail, MessageCircle, User, Package, Home, Globe, Link2 } from 'lucide-react'
import { format } from 'date-fns'

interface ReferenceLink {
  type: string
  url: string
  title?: string
  description?: string
  embeddable?: boolean
}

interface Product {
  name: string
  type: string
  description: string
  price: number | null
  priceCurrency: string
  priceNotes: string
  images: string[]
}

interface ResearchEntry {
  id: string
  supplierName: string
  contactNumber: string
  address: string
  email: string
  whatsappNumber: string
  mapLocation: string
  mapPinGroup: string
  materialName: string
  materialType: string
  materialDescription: string
  price: number | null
  priceCurrency: string
  priceNotes: string
  materialImages: string[]
  products: Product[]
  referenceLinks: ReferenceLink[]
  researchNotes: string
  status: 'New' | 'Reviewed' | 'Interested' | 'Not Suitable'
  tags: string[]
  researchDate: string
  followUpDate: string | null
  createdAt: string
  updatedAt: string
}

export default function ResearchDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [activeTab, setActiveTab] = useState(1)
  const [entry, setEntry] = useState<ResearchEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

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
      setLoading(true)
      const response = await fetch(`/api/research/${id}`, { credentials: 'include' })
      const result = await response.json()

      if (result.success) {
        setEntry(result.data)
      } else {
        alert(result.message || 'Failed to load research entry')
        router.push('/admin/research')
      }
    } catch (error) {
      console.error('Failed to load research entry:', error)
      alert('Failed to load research entry')
      router.push('/admin/research')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this research entry? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/research/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success) {
        router.push('/admin/research')
      } else {
        alert(result.message || 'Failed to delete research entry')
      }
    } catch (error) {
      console.error('Failed to delete research entry:', error)
      alert('Failed to delete research entry')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'Reviewed': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'Interested': return 'bg-green-100 text-green-700 border-green-200'
      case 'Not Suitable': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }
    return null
  }

  const getVimeoEmbedUrl = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/)
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`
    }
    return null
  }

  if (loading) {
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

  if (!entry) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Research entry not found</p>
          <Link href="/admin/research" className="text-purple-600 hover:underline mt-4 inline-block">
            Back to Raw Research
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/research"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{entry.supplierName}</h1>
              <p className="text-gray-500 mt-1">
                {entry.products && entry.products.length > 0 
                  ? `${entry.products.length} Product${entry.products.length > 1 ? 's' : ''}`
                  : entry.materialName || 'Raw Research Entry'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin/research/${id}/edit`}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-4">
          <span className={`px-4 py-2 rounded-lg border font-semibold ${getStatusColor(entry.status)}`}>
            {entry.status}
          </span>
          {entry.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {entry.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Supplier Name</label>
                    <p className="text-gray-900 font-semibold mt-1">{entry.supplierName}</p>
                  </div>
                  {entry.contactNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Contact Number
                      </label>
                      <a href={`tel:${entry.contactNumber}`} className="text-purple-600 hover:text-purple-700 mt-1 block">
                        {entry.contactNumber}
                      </a>
                    </div>
                  )}
                  {entry.whatsappNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </label>
                      <a
                        href={`https://wa.me/${entry.whatsappNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 mt-1 block"
                      >
                        {entry.whatsappNumber}
                      </a>
                    </div>
                  )}
                  {entry.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <a href={`mailto:${entry.email}`} className="text-purple-600 hover:text-purple-700 mt-1 block">
                        {entry.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Product Details - Multiple Products */}
            {activeTab === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>
                {entry.products && entry.products.length > 0 ? (
                  <div className="space-y-6">
                    {entry.products.map((product, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product {index + 1}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Product Name</label>
                            <p className="text-gray-900 font-semibold mt-1">{product.name}</p>
                          </div>
                          {product.type && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Product Type</label>
                              <p className="text-gray-900 mt-1">{product.type}</p>
                            </div>
                          )}
                          {product.description && (
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-gray-500">Description</label>
                              <p className="text-gray-900 mt-1 whitespace-pre-wrap">{product.description}</p>
                            </div>
                          )}
                          {(product.price !== null && product.price !== undefined) && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Price</label>
                              <p className="text-gray-900 font-semibold mt-1">
                                {product.priceCurrency} {product.price.toLocaleString()}
                              </p>
                              {product.priceNotes && (
                                <p className="text-sm text-gray-600 mt-1">{product.priceNotes}</p>
                              )}
                            </div>
                          )}
                        </div>
                        {product.images && product.images.length > 0 && (
                          <div className="mt-4">
                            <label className="text-sm font-medium text-gray-500 mb-2 block">Product Images</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {product.images.map((imageUrl, imgIdx) => (
                                <div key={imgIdx} className="relative group">
                                  <img
                                    src={imageUrl}
                                    alt={`Product ${index + 1} Image ${imgIdx + 1}`}
                                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                  />
                                  <a
                                    href={imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
                                  >
                                    <ExternalLink className="w-6 h-6 text-white" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Backward compatibility: show legacy single product
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Material/Product Name</label>
                        <p className="text-gray-900 font-semibold mt-1">{entry.materialName}</p>
                      </div>
                      {entry.materialType && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Material Type</label>
                          <p className="text-gray-900 mt-1">{entry.materialType}</p>
                        </div>
                      )}
                      {entry.materialDescription && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-500">Description</label>
                          <p className="text-gray-900 mt-1 whitespace-pre-wrap">{entry.materialDescription}</p>
                        </div>
                      )}
                      {(entry.price !== null && entry.price !== undefined) && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Price</label>
                          <p className="text-gray-900 font-semibold mt-1">
                            {entry.priceCurrency} {entry.price.toLocaleString()}
                          </p>
                          {entry.priceNotes && (
                            <p className="text-sm text-gray-600 mt-1">{entry.priceNotes}</p>
                          )}
                        </div>
                      )}
                    </div>
                    {entry.materialImages && entry.materialImages.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-2 block">Product Images</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {entry.materialImages.map((imageUrl, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={imageUrl}
                                alt={`Product ${idx + 1}`}
                                className="w-full h-48 object-cover rounded-lg border border-gray-200"
                              />
                              <a
                                href={imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
                              >
                                <ExternalLink className="w-6 h-6 text-white" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Address Details */}
            {activeTab === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Address Details</h2>
                {entry.address ? (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Supplier Address</label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{entry.address}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">No address provided</p>
                )}
              </div>
            )}

            {/* Tab 4: Google Maps Location */}
            {activeTab === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Google Maps Location</h2>
                <div className="space-y-4">
                  {entry.mapLocation && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Map Location</label>
                      <a
                        href={entry.mapLocation.startsWith('http') ? entry.mapLocation : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entry.mapLocation)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        {entry.mapLocation}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                  {entry.mapPinGroup && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Map Pin Group</label>
                      <p className="text-gray-900">{entry.mapPinGroup}</p>
                    </div>
                  )}
                  {!entry.mapLocation && !entry.mapPinGroup && (
                    <p className="text-gray-500">No map location provided</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 5: YouTube Reference Links */}
            {activeTab === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">YouTube Reference Links</h2>
                {entry.referenceLinks && entry.referenceLinks.length > 0 ? (
                  <div className="space-y-4">
                    {entry.referenceLinks.map((link, idx) => {
                      const youtubeEmbed = link.type === 'youtube' && link.embeddable ? getYouTubeEmbedUrl(link.url) : null
                      const vimeoEmbed = link.type === 'vimeo' && link.embeddable ? getVimeoEmbedUrl(link.url) : null

                      return (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          {youtubeEmbed && (
                            <div className="mb-4">
                              <iframe
                                width="100%"
                                height="315"
                                src={youtubeEmbed}
                                title={link.title || `Video ${idx + 1}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="rounded-lg"
                              ></iframe>
                            </div>
                          )}
                          {vimeoEmbed && (
                            <div className="mb-4">
                              <iframe
                                src={vimeoEmbed}
                                width="100%"
                                height="315"
                                frameBorder="0"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                                className="rounded-lg"
                              ></iframe>
                            </div>
                          )}
                          <div>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
                            >
                              {link.title || link.url}
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            {link.description && (
                              <p className="text-gray-600 text-sm mt-1">{link.description}</p>
                            )}
                            <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {link.type}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">No reference links added</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

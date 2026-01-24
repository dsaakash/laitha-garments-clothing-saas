'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { Plus, Search, Filter, Eye, Edit, Trash2, MapPin, Video, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'

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
  materialImages: Array<{ url: string; caption?: string }>
  referenceLinks: Array<{ type: string; url: string; title?: string; description?: string; embeddable?: boolean }>
  researchNotes: string
  status: 'New' | 'Reviewed' | 'Interested' | 'Not Suitable'
  tags: string[]
  researchDate: string
  followUpDate: string | null
  createdAt: string
  updatedAt: string
}

export default function ResearchPage() {
  const router = useRouter()
  const [researchEntries, setResearchEntries] = useState<ResearchEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [materialTypeFilter, setMaterialTypeFilter] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<{
    statuses: string[]
    materialTypes: string[]
    tags: string[]
  }>({ statuses: [], materialTypes: [], tags: [] })

  const loadResearch = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'All') params.append('status', statusFilter)
      if (materialTypeFilter !== 'All') params.append('materialType', materialTypeFilter)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())

      const response = await fetch(`/api/research?${params.toString()}`, { credentials: 'include' })
      const result = await response.json()

      if (result.success) {
        setResearchEntries(result.data)
        if (result.filters) {
          setFilters(result.filters)
        }
      }
    } catch (error) {
      console.error('Failed to load research:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, materialTypeFilter, searchQuery])

  useEffect(() => {
    loadResearch()
  }, [loadResearch])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this research entry?')) {
      return
    }

    try {
      const response = await fetch(`/api/research/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success) {
        loadResearch()
      } else {
        alert(result.message || 'Failed to delete research entry')
      }
    } catch (error) {
      console.error('Failed to delete research:', error)
      alert('Failed to delete research entry')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-700'
      case 'Reviewed': return 'bg-gray-100 text-gray-700'
      case 'Interested': return 'bg-green-100 text-green-700'
      case 'Not Suitable': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredEntries = researchEntries.filter(entry => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        entry.supplierName.toLowerCase().includes(query) ||
        entry.materialName.toLowerCase().includes(query) ||
        entry.materialDescription?.toLowerCase().includes(query) ||
        entry.researchNotes?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Raw Research</h1>
            <p className="text-gray-500 mt-1">Manage supplier and material research</p>
          </div>
          <Link
            href="/admin/research/new"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Research
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by supplier, material, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="All">All Status</option>
                  {filters.statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Material Type</label>
                <select
                  value={materialTypeFilter}
                  onChange={(e) => setMaterialTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="All">All Types</option>
                  {filters.materialTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Research Entries Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading research entries...</p>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Research Entries Found</h3>
            <p className="text-gray-600 mb-6">Start by adding your first research entry</p>
            <Link
              href="/admin/research/new"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Research
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{entry.supplierName}</h3>
                    <p className="text-sm text-gray-600">{entry.materialName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(entry.status)}`}>
                    {entry.status}
                  </span>
                </div>

                {/* Preview Info */}
                <div className="space-y-2 mb-4">
                  {entry.materialType && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {entry.materialType}
                    </div>
                  )}
                  {entry.price && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Price:</span> {entry.priceCurrency} {entry.price.toLocaleString()}
                    </div>
                  )}
                  {entry.contactNumber && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Contact:</span> {entry.contactNumber}
                    </div>
                  )}
                </div>

                {/* Icons for content */}
                <div className="flex gap-3 mb-4">
                  {entry.materialImages.length > 0 && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <ImageIcon className="w-4 h-4" />
                      <span>{entry.materialImages.length}</span>
                    </div>
                  )}
                  {entry.referenceLinks.length > 0 && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <Video className="w-4 h-4" />
                      <span>{entry.referenceLinks.length}</span>
                    </div>
                  )}
                  {entry.mapLocation && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>Map</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {entry.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">
                        +{entry.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Date */}
                <div className="text-xs text-gray-400 mb-4">
                  {format(new Date(entry.researchDate), 'dd MMM yyyy')}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Link
                    href={`/admin/research/${entry.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    href={`/admin/research/${entry.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

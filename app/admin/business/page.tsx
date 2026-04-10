'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { BusinessProfile } from '@/lib/storage'

export default function BusinessPage() {
  const [formData, setFormData] = useState<BusinessProfile>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    whatsappNumber: '',
    slug: '',
    websiteBuilderEnabled: false,
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch existing business profile from API
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/business')
        const result = await response.json()
        if (result.success && result.data) {
          setFormData(result.data)
        }
      } catch (err) {
        console.error('Failed to fetch business profile:', err)
      }
    }
    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/business', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 5000)
        // Update the saved data to reflect the latest from server
        if (result.data) {
          setFormData(result.data)
        }
        // Dispatch custom event to notify AdminLayout to refresh business name
        if (typeof window !== 'undefined') {
          // Store timestamp in localStorage to trigger refresh
          localStorage.setItem('businessProfileLastUpdated', Date.now().toString())
          // Dispatch custom event with business name
          window.dispatchEvent(new CustomEvent('businessProfileUpdated', {
            detail: { businessName: result.data?.businessName }
          }))
        }
      } else {
        setError(result.message || 'Failed to save business profile')
      }
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save business profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Business Setup</h1>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            ✅ <strong>Business profile saved successfully!</strong> All future invoices will use this updated information. The changes will be reflected immediately in all new invoice PDFs.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
          💡 <strong>Note:</strong> Any changes you make here will be automatically reflected in all future invoices. The invoice PDF generation always uses the latest business profile from the database.
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Lalitha Garments"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number *</label>
              <input
                type="tel"
                required
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="+91XXXXXXXXXX"
              />
              <p className="text-xs text-gray-500 mt-1">This number will be used to send invoices via WhatsApp</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <textarea
                required
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number (optional)</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="29ABCDE1234F1Z5"
              />
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Business Store Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-purple-900">Enable Public Store</h3>
                    <p className="text-sm text-purple-700">Allow customers to view your collection live at your custom URL.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.websiteBuilderEnabled}
                      onChange={(e) => setFormData({ ...formData, websiteBuilderEnabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {formData.websiteBuilderEnabled && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store URL Slug *</label>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        /store/
                      </span>
                      <input
                        type="text"
                        required={formData.websiteBuilderEnabled}
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                        className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-r-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="my-business-name"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This will be your public store link. Only lowercase letters, numbers, and hyphens are allowed.</p>
                    
                    {formData.slug && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md flex items-center justify-between">
                        <span className="text-sm text-gray-600 truncate">
                          Your live URL: <span className="font-mono text-purple-600 font-semibold">{window.location.origin}/store/{formData.slug}</span>
                        </span>
                        <a 
                          href={`/store/${formData.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:text-purple-800 font-medium underline px-2"
                        >
                          View Store
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Business Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}

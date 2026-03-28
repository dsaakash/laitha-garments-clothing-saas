'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { MessageCircle, Users, Link2, FileText, CheckCircle, Send, ChevronRight, ChevronLeft, Search } from 'lucide-react'
import { format } from 'date-fns'

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  lastPurchase?: string
}

interface MessageTemplate {
  id: string
  name: string
  content: string
}

const messageTemplates: MessageTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Message',
    content: 'Hi {name}! 🎉 You\'re invited to join our exclusive Lalitha Garments WhatsApp Community! Get early access to new collections, special discounts, and styling tips. Click here to join: {link}'
  },
  {
    id: 'new_collection',
    name: 'New Collection Launch',
    content: 'Hi {name}! 🌸 Exciting news! Our latest collection is now live! Be the first to explore stunning new designs. Join our WhatsApp community for exclusive previews: {link}'
  },
  {
    id: 'special_offer',
    name: 'Special Offer',
    content: 'Hi {name}! 💝 Exclusive offer just for you! Join our WhatsApp community today and get 10% off on your next purchase. Limited time only! Join here: {link}'
  },
  {
    id: 'custom',
    name: 'Custom Message',
    content: ''
  }
]

export default function WhatsAppCommunityPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [communityLink, setCommunityLink] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate>(messageTemplates[0])
  const [customMessage, setCustomMessage] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<{ success: number; failed: number } | null>(null)
  const [savingLink, setSavingLink] = useState(false)
  const [linkSaved, setLinkSaved] = useState(false)

  useEffect(() => {
    fetchCustomers()
    fetchCommunityLink()
  }, [])

  const fetchCommunityLink = async () => {
    try {
      const response = await fetch('/api/whatsapp-community/link')
      const result = await response.json()
      if (result.success && result.data?.link) {
        setCommunityLink(result.data.link)
      }
    } catch (error) {
      console.error('Failed to fetch community link:', error)
    }
  }

  const saveCommunityLink = async () => {
    if (!communityLink.trim()) {
      alert('Please enter a community link')
      return
    }
    
    try {
      setSavingLink(true)
      const response = await fetch('/api/whatsapp-community/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: communityLink.trim() })
      })
      const result = await response.json()
      if (result.success) {
        setLinkSaved(true)
        setTimeout(() => setLinkSaved(false), 3000)
      } else {
        alert(result.message || 'Failed to save link')
      }
    } catch (error) {
      console.error('Failed to save community link:', error)
      alert('Failed to save link')
    } finally {
      setSavingLink(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      const result = await response.json()
      if (result.success) {
        setCustomers(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const toggleAllCustomers = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id))
    }
  }

  const getMessagePreview = (customer: Customer) => {
    const message = selectedTemplate.id === 'custom' ? customMessage : selectedTemplate.content
    return message
      .replace('{name}', customer.name)
      .replace('{link}', communityLink)
  }

  const handleSend = async () => {
    if (selectedCustomers.length === 0) {
      alert('Please select at least one customer')
      return
    }

    setSending(true)
    let success = 0
    let failed = 0

    try {
      for (const customerId of selectedCustomers) {
        const customer = customers.find(c => c.id === customerId)
        if (!customer || !customer.phone) {
          failed++
          continue
        }

        const message = getMessagePreview(customer)
        const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
        
        // Open WhatsApp in new tab
        window.open(whatsappUrl, '_blank')
        
        // Small delay between openings
        await new Promise(resolve => setTimeout(resolve, 500))
        success++
      }

      setSendStatus({ success, failed })
    } catch (error) {
      console.error('Error sending invites:', error)
    } finally {
      setSending(false)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  )

  const steps = [
    { number: 1, title: 'Community Link', icon: Link2 },
    { number: 2, title: 'Message Template', icon: FileText },
    { number: 3, title: 'Select Customers', icon: Users }
  ]

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-500 rounded-xl">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WhatsApp Community</h1>
              <p className="text-gray-600">Invite customers to join your WhatsApp community</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  currentStep === step.number 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : currentStep > step.number 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  <step.icon className="w-5 h-5" />
                  <div>
                    <p className="text-xs font-medium opacity-80">Step {step.number}</p>
                    <p className="font-semibold">{step.title}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-6 h-6 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Community Link */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add WhatsApp Community Link</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Community Invite Link *
                </label>
                <input
                  type="url"
                  value={communityLink}
                  onChange={(e) => setCommunityLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Accepts: chat.whatsapp.com, whatsapp.com/channel/, whatsapp.com/group/, etc.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-semibold text-green-800 mb-2">How to get your community link:</h3>
                <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                  <li>Open WhatsApp and go to your Community</li>
                  <li>Tap the community name at the top</li>
                  <li>Scroll down and tap "Invite via link"</li>
                  <li>Copy the link and paste it here</li>
                </ol>
              </div>

              <div className="flex justify-between">
                <div>
                  {linkSaved && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Link saved!
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={saveCommunityLink}
                    disabled={!communityLink.trim() || savingLink}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-green-500 text-green-600 rounded-xl font-medium hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    {savingLink ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Save Link
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!communityLink.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Message Template */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Select Message Template</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {messageTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedTemplate.id === template.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedTemplate.id === template.id ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {selectedTemplate.id === template.id && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-semibold text-gray-900">{template.name}</span>
                    </div>
                    {template.id !== 'custom' && (
                      <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
                    )}
                  </div>
                ))}
              </div>

              {selectedTemplate.id === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Message
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    placeholder="Hi {name}! Join our WhatsApp community: {link}"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Use {'{name}'} for customer name and {'{link}'} for community link
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Message Preview:</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-700">
                  {getMessagePreview({ id: '1', name: 'Customer Name', phone: '' })}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedTemplate.id === 'custom' && !customMessage.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  Next Step
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Select Customers */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Select Customers & Send Invites</h2>
            
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers by name or phone..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Select All */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                  onChange={toggleAllCustomers}
                  className="w-5 h-5 text-green-500 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="font-medium text-gray-700">
                  Select All ({filteredCustomers.length} customers)
                </span>
              </label>
              <span className="text-sm text-gray-500">
                {selectedCustomers.length} selected
              </span>
            </div>

            {/* Customers List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No customers found. Add customers in the Customers section.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => toggleCustomer(customer.id)}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedCustomers.includes(customer.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => {}}
                      className="w-5 h-5 text-green-500 rounded border-gray-300 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                    {customer.lastPurchase && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Last Purchase</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(customer.lastPurchase), 'dd MMM yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Send Status */}
            {sendStatus && (
              <div className={`mt-6 p-4 rounded-xl ${sendStatus.failed === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Invitations Sent!</span>
                </div>
                <p>Successfully opened WhatsApp for {sendStatus.success} customers.</p>
                {sendStatus.failed > 0 && (
                  <p className="mt-1">{sendStatus.failed} failed (missing phone numbers).</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between mt-6">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleSend}
                disabled={selectedCustomers.length === 0 || sending}
                className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Opening WhatsApp...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send to {selectedCustomers.length} Customers
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

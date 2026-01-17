'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { format } from 'date-fns'

interface CustomerEnquiry {
  id: number
  customer_name: string
  customer_phone: string
  product_id: number | null
  product_name: string
  product_code: string | null
  fabric_type: string | null
  enquiry_method: 'form' | 'whatsapp' | 'calendar'
  status: 'pending' | 'contacted' | 'resolved' | 'closed'
  notes: string | null
  created_at: string
  updated_at: string
  product_dress_name?: string
  product_dress_code?: string
  product_image_url?: string
  booking_type?: 'visit' | 'online_meeting' | 'product_showcase' | 'online' | null
  meeting_link?: string | null
  appointment_date?: string | null
  appointment_time?: string | null
  calendar_event_id?: string | null
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedEnquiry, setSelectedEnquiry] = useState<CustomerEnquiry | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingData, setBookingData] = useState({
    bookingType: '' as 'visit' | 'online_meeting' | 'product_showcase' | '',
    meetingLink: '',
    appointmentDate: '',
    appointmentTime: '',
    customerName: '',
    customerPhone: '',
    notes: ''
  })
  const [showNotesForm, setShowNotesForm] = useState(false)
  const [notesText, setNotesText] = useState('')
  
  const GOOGLE_CALENDAR_LINK = 'https://calendar.app.google/jYyt5esKUUCRmC6y5'

  const loadEnquiries = useCallback(async () => {
    try {
      const url = filterStatus 
        ? `/api/enquiries?status=${filterStatus}`
        : '/api/enquiries'
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        setEnquiries(result.data)
      }
    } catch (error) {
      console.error('Failed to load enquiries:', error)
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    loadEnquiries()
  }, [loadEnquiries])

  const handleStatusUpdate = async (id: number, status: string, notes?: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/enquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      })
      
      const result = await response.json()
      if (result.success) {
        await loadEnquiries()
        if (selectedEnquiry?.id === id) {
          setSelectedEnquiry(result.data)
        }
      } else {
        alert('Failed to update enquiry status')
      }
    } catch (error) {
      console.error('Failed to update enquiry:', error)
      alert('Failed to update enquiry status')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return

    try {
      const response = await fetch(`/api/enquiries/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        await loadEnquiries()
        if (selectedEnquiry?.id === id) {
          setShowDetailModal(false)
          setSelectedEnquiry(null)
        }
      } else {
        alert('Failed to delete enquiry')
      }
    } catch (error) {
      console.error('Failed to delete enquiry:', error)
      alert('Failed to delete enquiry')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'contacted':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodIcon = (method: string) => {
    if (method === 'whatsapp') return '💬'
    if (method === 'calendar') return '📅'
    return '📝'
  }

  const handleUpdateBooking = async () => {
    if (!selectedEnquiry) return
    
    setUpdating(true)
    try {
      const response = await fetch(`/api/enquiries/${selectedEnquiry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingType: bookingData.bookingType || null,
          meetingLink: bookingData.meetingLink || null,
          appointmentDate: bookingData.appointmentDate || null,
          appointmentTime: bookingData.appointmentTime || null,
          customerName: bookingData.customerName || selectedEnquiry.customer_name,
          customerPhone: bookingData.customerPhone || selectedEnquiry.customer_phone,
          notes: bookingData.notes || null
        })
      })
      
      const result = await response.json()
      if (result.success) {
        await loadEnquiries()
        setSelectedEnquiry(result.data)
        setShowBookingForm(false)
        setBookingData({
          bookingType: '',
          meetingLink: '',
          appointmentDate: '',
          appointmentTime: '',
          customerName: '',
          customerPhone: '',
          notes: ''
        })
      } else {
        alert('Failed to update booking details')
      }
    } catch (error) {
      console.error('Failed to update booking:', error)
      alert('Failed to update booking details')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateNotes = async () => {
    if (!selectedEnquiry) return
    
    setUpdating(true)
    try {
      const response = await fetch(`/api/enquiries/${selectedEnquiry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notesText
        })
      })
      
      const result = await response.json()
      if (result.success) {
        await loadEnquiries()
        setSelectedEnquiry(result.data)
        setShowNotesForm(false)
        setNotesText('')
      } else {
        alert('Failed to update notes')
      }
    } catch (error) {
      console.error('Failed to update notes:', error)
      alert('Failed to update notes')
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateAppointment = (enquiry?: CustomerEnquiry) => {
    const enquiryToUse = enquiry || selectedEnquiry
    if (!enquiryToUse) return
    
    // Set selected enquiry if not already set
    if (!selectedEnquiry) {
      setSelectedEnquiry(enquiryToUse)
      setShowDetailModal(true)
    }
    
    // Open the booking form to create/update appointment
    setBookingData({
      bookingType: enquiryToUse.booking_type || '',
      meetingLink: enquiryToUse.meeting_link || '',
      appointmentDate: enquiryToUse.appointment_date || '',
      appointmentTime: enquiryToUse.appointment_time || '',
      customerName: enquiryToUse.customer_name,
      customerPhone: enquiryToUse.customer_phone,
      notes: enquiryToUse.notes || ''
    })
    setShowBookingForm(true)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading enquiries...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Enquiries</h1>
            <p className="text-gray-600 mt-1">Manage and track customer product enquiries</p>
          </div>
           {/* Removed Schedule Appointment button - appointments are created from enquiry details */}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            {filterStatus && (
              <button
                onClick={() => setFilterStatus('')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Enquiries List */}
        {enquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No enquiries found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {enquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedEnquiry(enquiry)
                    setShowDetailModal(true)
                    setShowBookingForm(false)
                    setShowNotesForm(false)
                    setBookingData({
                      bookingType: enquiry.booking_type || '',
                      meetingLink: enquiry.meeting_link || '',
                      appointmentDate: enquiry.appointment_date || '',
                      appointmentTime: enquiry.appointment_time || '',
                      customerName: enquiry.customer_name,
                      customerPhone: enquiry.customer_phone,
                      notes: enquiry.notes || ''
                    })
                    setNotesText(enquiry.notes || '')
                  }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getMethodIcon(enquiry.enquiry_method)}</span>
                      <h3 className="text-lg font-bold text-gray-900">{enquiry.customer_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(enquiry.status)}`}>
                        {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                      </span>
                    </div>
                    {enquiry.customer_phone && (
                      <p className="text-gray-600 mb-1">📞 {enquiry.customer_phone}</p>
                    )}
                    <p className="text-gray-700 font-medium mb-2">
                      Product: {enquiry.product_name}
                      {enquiry.product_code && ` (${enquiry.product_code})`}
                    </p>
                    {enquiry.fabric_type && (
                      <p className="text-sm text-gray-500">Fabric: {enquiry.fabric_type}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(enquiry.created_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!enquiry.appointment_date && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCreateAppointment(enquiry)
                        }}
                        className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md text-sm font-medium"
                        title="Create Appointment"
                      >
                        📅 Create Appointment
                      </button>
                    )}
                    {enquiry.customer_phone && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`tel:${enquiry.customer_phone}`, '_self')
                          }}
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium"
                          title="Call Customer"
                        >
                          📞 Call
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`https://wa.me/${enquiry.customer_phone.replace(/\D/g, '')}`, '_blank')
                          }}
                          className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-md text-sm font-medium"
                          title="WhatsApp Customer"
                        >
                          💬 WhatsApp
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedEnquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Enquiry Details</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedEnquiry(null)
                    setShowBookingForm(false)
                    setShowNotesForm(false)
                    setBookingData({
                      bookingType: '',
                      meetingLink: '',
                      appointmentDate: '',
                      appointmentTime: '',
                      customerName: '',
                      customerPhone: '',
                      notes: ''
                    })
                    setNotesText('')
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{selectedEnquiry.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{selectedEnquiry.customer_phone || 'Not provided'}</p>
                    </div>
                  </div>
                  {selectedEnquiry.customer_phone && (
                    <div className="mt-4 flex gap-2">
                      <a
                        href={`tel:${selectedEnquiry.customer_phone}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                      >
                        📞 Call
                      </a>
                      <a
                        href={`https://wa.me/${selectedEnquiry.customer_phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Product Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Product Name</p>
                      <p className="font-medium text-gray-900">{selectedEnquiry.product_name}</p>
                    </div>
                    {selectedEnquiry.product_code && (
                      <div>
                        <p className="text-sm text-gray-500">Product Code</p>
                        <p className="font-medium text-gray-900">{selectedEnquiry.product_code}</p>
                      </div>
                    )}
                    {selectedEnquiry.fabric_type && (
                      <div>
                        <p className="text-sm text-gray-500">Preferred Fabric Type</p>
                        <p className="font-medium text-gray-900">{selectedEnquiry.fabric_type}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Enquiry Method</p>
                      <p className="font-medium text-gray-900">
                        {getMethodIcon(selectedEnquiry.enquiry_method)} {
                          selectedEnquiry.enquiry_method === 'whatsapp' ? 'WhatsApp' : 
                          selectedEnquiry.enquiry_method === 'calendar' ? 'Calendar Booking' : 
                          'Form Submission'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking Information */}
                {(selectedEnquiry.enquiry_method === 'calendar' || selectedEnquiry.booking_type || selectedEnquiry.appointment_date) && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-gray-900">📅 Appointment Booking</h3>
                      <button
                        onClick={() => {
                          setBookingData({
                            bookingType: selectedEnquiry.booking_type || '',
                            meetingLink: selectedEnquiry.meeting_link || '',
                            appointmentDate: selectedEnquiry.appointment_date || '',
                            appointmentTime: selectedEnquiry.appointment_time || '',
                            customerName: selectedEnquiry.customer_name,
                            customerPhone: selectedEnquiry.customer_phone,
                            notes: selectedEnquiry.notes || ''
                          })
                          setNotesText(selectedEnquiry.notes || '')
                          setShowBookingForm(!showBookingForm)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {showBookingForm ? 'Cancel' : 'Edit Booking'}
                      </button>
                    </div>
                    
                    {!showBookingForm ? (
                      <div className="space-y-2">
                        {selectedEnquiry.booking_type && (
                          <div>
                            <p className="text-sm text-gray-500">Appointment Type</p>
                            <p className="font-medium text-gray-900">
                              {selectedEnquiry.booking_type === 'visit' ? '🏢 In-Person Visit' :
                               selectedEnquiry.booking_type === 'online_meeting' ? '💻 Online Requirement Meeting' :
                               selectedEnquiry.booking_type === 'product_showcase' ? '📱 Product Showcase (WhatsApp Video Call)' :
                               selectedEnquiry.booking_type === 'online' ? '🌐 Online' : 
                               selectedEnquiry.booking_type}
                            </p>
                          </div>
                        )}
                        {selectedEnquiry.appointment_date && (
                          <div>
                            <p className="text-sm text-gray-500">Appointment Date</p>
                            <p className="font-medium text-gray-900">
                              {format(new Date(selectedEnquiry.appointment_date), 'dd MMM yyyy')}
                            </p>
                          </div>
                        )}
                        {selectedEnquiry.appointment_time && (
                          <div>
                            <p className="text-sm text-gray-500">Appointment Time</p>
                            <p className="font-medium text-gray-900">{selectedEnquiry.appointment_time}</p>
                          </div>
                        )}
                        {selectedEnquiry.meeting_link && (
                          <div>
                            <p className="text-sm text-gray-500">Meeting Link</p>
                            <a
                              href={selectedEnquiry.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {selectedEnquiry.meeting_link}
                            </a>
                            {selectedEnquiry.customer_phone && (
                              <button
                                onClick={() => {
                                  const message = `Hello ${selectedEnquiry.customer_name}! Your appointment is confirmed.\n\nDate: ${selectedEnquiry.appointment_date ? format(new Date(selectedEnquiry.appointment_date), 'dd MMM yyyy') : 'TBD'}\nTime: ${selectedEnquiry.appointment_time || 'TBD'}\n\nMeeting Link: ${selectedEnquiry.meeting_link}\n\nSee you soon!`
                                  window.open(`https://wa.me/${selectedEnquiry.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank')
                                }}
                                className="mt-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                              >
                                💬 Send Link via WhatsApp
                              </button>
                            )}
                          </div>
                        )}
                        {!selectedEnquiry.booking_type && !selectedEnquiry.appointment_date && (
                          <div>
                            <p className="text-sm text-gray-500 italic mb-2">No booking details yet. Click "Edit Booking" or "Create Appointment" to add appointment details.</p>
                            <p className="text-xs text-gray-400">All appointment details will be saved to the database for tracking and follow-up.</p>
                          </div>
                        )}
                        {!selectedEnquiry.appointment_date && !selectedEnquiry.appointment_time && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <button
                              onClick={handleCreateAppointment}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                            >
                              📅 Create Appointment
                            </button>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              Click to create an appointment for this customer enquiry. All details will be saved to database.
                            </p>
                          </div>
                        )}
                        {selectedEnquiry.booking_type === 'online_meeting' && !selectedEnquiry.meeting_link && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-3">
                            <p className="text-sm text-yellow-800 font-semibold mb-1">⚠️ Action Required:</p>
                            <p className="text-sm text-yellow-700">Add a meeting link (Google Meet/Zoom) and send it to the customer.</p>
                          </div>
                        )}
                        {selectedEnquiry.booking_type === 'product_showcase' && selectedEnquiry.customer_phone && (
                          <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mt-3">
                            <p className="text-sm text-purple-800 font-semibold mb-2">📱 Action Required:</p>
                            <p className="text-sm text-purple-700 mb-2">Send WhatsApp confirmation to customer about the video call appointment.</p>
                            <button
                              onClick={() => {
                                const message = `Hello ${selectedEnquiry.customer_name}! Your product showcase appointment is confirmed.\n\nDate: ${selectedEnquiry.appointment_date ? format(new Date(selectedEnquiry.appointment_date), 'dd MMM yyyy') : 'TBD'}\nTime: ${selectedEnquiry.appointment_time || 'TBD'}\n\nWe'll call you on WhatsApp video at the scheduled time to show you our products.\n\nSee you soon!`
                                window.open(`https://wa.me/${selectedEnquiry.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank')
                              }}
                              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                            >
                              💬 Send WhatsApp Confirmation
                            </button>
                          </div>
                        )}
                        {selectedEnquiry.booking_type === 'visit' && selectedEnquiry.customer_phone && (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                            <p className="text-sm text-blue-800 font-semibold mb-2">📞 Action Required:</p>
                            <p className="text-sm text-blue-700 mb-2">Call the customer to confirm appointment time and provide store location.</p>
                            <a
                              href={`tel:${selectedEnquiry.customer_phone}`}
                              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                            >
                              📞 Call Customer Now
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Booking Type</label>
                          <select
                            value={bookingData.bookingType}
                            onChange={(e) => setBookingData({ ...bookingData, bookingType: e.target.value as 'visit' | 'online_meeting' | 'product_showcase' | '' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select type</option>
                            <option value="visit">🏢 In-Person Visit</option>
                            <option value="online_meeting">💻 Online Requirement Meeting</option>
                            <option value="product_showcase">📱 Product Showcase (WhatsApp Video Call)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                          <input
                            type="date"
                            value={bookingData.appointmentDate}
                            onChange={(e) => setBookingData({ ...bookingData, appointmentDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Time</label>
                          <input
                            type="time"
                            value={bookingData.appointmentTime}
                            onChange={(e) => setBookingData({ ...bookingData, appointmentTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        {bookingData.bookingType === 'online_meeting' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (Google Meet/Zoom) *</label>
                            <input
                              type="url"
                              required
                              value={bookingData.meetingLink}
                              onChange={(e) => setBookingData({ ...bookingData, meetingLink: e.target.value })}
                              placeholder="https://meet.google.com/xxx-yyyy-zzz or https://zoom.us/j/..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              After saving, send this link to the customer via WhatsApp or email.
                            </p>
                          </div>
                        )}
                        {bookingData.bookingType === 'product_showcase' && (
                          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                            <p className="text-sm text-purple-800 font-semibold mb-2">📱 WhatsApp Video Call</p>
                            <p className="text-sm text-purple-700 mb-2">
                              This will be a WhatsApp video call to showcase products. No meeting link needed.
                            </p>
                            {selectedEnquiry?.customer_phone && (
                              <button
                                onClick={() => {
                                  const message = `Hello ${selectedEnquiry.customer_name}! Your product showcase appointment is confirmed.\n\nDate: ${bookingData.appointmentDate ? new Date(bookingData.appointmentDate).toLocaleDateString() : 'TBD'}\nTime: ${bookingData.appointmentTime || 'TBD'}\n\nWe'll call you on WhatsApp video at the scheduled time to show you our products.\n\nSee you soon!`
                                  window.open(`https://wa.me/${selectedEnquiry.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank')
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                              >
                                💬 Send WhatsApp Confirmation
                              </button>
                            )}
                          </div>
                        )}
                        {bookingData.bookingType === 'visit' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <p className="text-sm text-yellow-800 mb-2">
                              💡 <strong>Action Required:</strong> Call the customer to confirm the appointment time and provide store location.
                            </p>
                            {selectedEnquiry?.customer_phone && (
                              <a
                                href={`tel:${selectedEnquiry.customer_phone}`}
                                className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
                              >
                                📞 Call Customer Now
                              </a>
                            )}
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Requirements & Follow-up Notes
                          </label>
                          <textarea
                            value={bookingData.notes}
                            onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Add customer requirements, interests, preferences, follow-up conversation details, or any important notes...

Example:
- Customer interested in: [product type]
- Budget: [amount]
- Follow-up: [conversation details]
- Requirements: [specific needs]"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Track customer interests, requirements, and follow-up conversations. This helps manage customer relationships and appointments.
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={handleUpdateBooking}
                            disabled={updating || (bookingData.bookingType === 'online_meeting' && !bookingData.meetingLink)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updating ? 'Saving...' : 'Save Booking Details'}
                          </button>
                          {bookingData.bookingType === 'online_meeting' && bookingData.meetingLink && (
                            <button
                              onClick={() => {
                                const message = `Hello ${selectedEnquiry?.customer_name || 'there'}! Your appointment is confirmed.\n\nDate: ${bookingData.appointmentDate ? new Date(bookingData.appointmentDate).toLocaleDateString() : 'TBD'}\nTime: ${bookingData.appointmentTime || 'TBD'}\n\nMeeting Link: ${bookingData.meetingLink}\n\nSee you soon!`
                                const phone = selectedEnquiry?.customer_phone?.replace(/\D/g, '') || ''
                                if (phone) {
                                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
                                } else {
                                  alert('Customer phone number not available')
                                }
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                            >
                              💬 Send Meeting Link via WhatsApp
                            </button>
                          )}
                          {/* Appointment is saved to database - no calendar redirect */}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Requirements & Follow-up Notes */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">📝 Customer Requirements & Follow-up Notes</h3>
                      <p className="text-xs text-gray-600 mt-1">Track customer interests, requirements, and conversation follow-ups</p>
                    </div>
                    <button
                      onClick={() => {
                        setNotesText(selectedEnquiry.notes || '')
                        setShowNotesForm(!showNotesForm)
                      }}
                      className="text-sm text-yellow-700 hover:text-yellow-900 font-medium"
                    >
                      {showNotesForm ? 'Cancel' : selectedEnquiry.notes ? 'Edit Notes' : 'Add Notes'}
                    </button>
                  </div>
                  
                  {!showNotesForm ? (
                    <div>
                      {selectedEnquiry.notes ? (
                        <div className="bg-white p-3 rounded-md border border-yellow-300">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEnquiry.notes}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-500 italic mb-2">No notes added yet.</p>
                          <p className="text-xs text-gray-400">Use this section to:</p>
                          <ul className="text-xs text-gray-400 list-disc list-inside mt-1 space-y-1">
                            <li>Record customer requirements and interests</li>
                            <li>Track follow-up conversations</li>
                            <li>Add notes about what customer is looking for</li>
                            <li>Document any important details from calls/meetings</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="Add customer requirements, interests, preferences, follow-up conversation details, or any important notes here...

Example:
- Customer interested in: Sarees, Cotton fabric
- Budget: Rs. 2000-3000
- Follow-up: Called on 15 Jan - confirmed appointment for 20 Jan
- Requirements: Needs ready-made, size M
- Notes: Prefers pastel colors, traditional designs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateNotes}
                          disabled={updating}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium disabled:opacity-50"
                        >
                          {updating ? 'Saving...' : 'Save Notes'}
                        </button>
                        <button
                          onClick={() => {
                            setShowNotesForm(false)
                            setNotesText(selectedEnquiry.notes || '')
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Update */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Update Status</h3>
                  <div className="flex gap-2 flex-wrap">
                    {['pending', 'contacted', 'resolved', 'closed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(selectedEnquiry.id, status)}
                        disabled={updating || selectedEnquiry.status === status}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          selectedEnquiry.status === status
                            ? getStatusColor(status) + ' cursor-default'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="text-gray-900">{format(new Date(selectedEnquiry.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="text-gray-900">{format(new Date(selectedEnquiry.updated_at), 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleDelete(selectedEnquiry.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                  >
                    Delete Enquiry
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedEnquiry(null)
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

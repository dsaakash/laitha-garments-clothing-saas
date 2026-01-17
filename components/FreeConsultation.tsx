'use client'

import { useState } from 'react'

export default function FreeConsultation() {
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [bookingType, setBookingType] = useState<'visit' | 'online_meeting' | 'product_showcase'>('online_meeting')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    appointmentDate: '',
    appointmentTime: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showStep2, setShowStep2] = useState(false)
  const [enquiryId, setEnquiryId] = useState<number | null>(null)
  
  const GOOGLE_CALENDAR_LINK = 'https://calendar.app.google/jYyt5esKUUCRmC6y5'
  const WHATSAPP_NUMBER = '917204219541'

  const handleWhatsApp = () => {
    setShowWhatsAppModal(true)
  }

  const handleWhatsAppShareRequirements = () => {
    let message = `Hello! I've booked an appointment and would like to share my requirements.\n\n`
    message += `Name: ${formData.name}\n`
    message += `Phone: ${formData.phone}\n`
    if (formData.appointmentDate && formData.appointmentTime) {
      message += `Appointment: ${new Date(formData.appointmentDate).toLocaleDateString()} at ${formData.appointmentTime}\n`
    }
    message += `\nI'm interested in:\n`
    if (formData.notes) {
      message += `${formData.notes}\n\n`
    }
    message += `Please let me know if you need any additional information.`
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleWhatsAppVideoCall = () => {
    let message = `Hello! I've booked an appointment and would like to do a WhatsApp video call to discuss my requirements.\n\n`
    message += `Name: ${formData.name}\n`
    message += `Phone: ${formData.phone}\n`
    if (formData.appointmentDate && formData.appointmentTime) {
      message += `Appointment: ${new Date(formData.appointmentDate).toLocaleDateString()} at ${formData.appointmentTime}\n\n`
    }
    message += `I would like to do a video call to:\n`
    message += `- See the products\n`
    message += `- Discuss my requirements\n`
    message += `- Get personalized recommendations\n\n`
    message += `Please let me know when would be a good time for the video call.`
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Create enquiry first
      await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name || 'WhatsApp Customer',
          customerPhone: formData.phone || '',
          productName: 'Free Consultation - WhatsApp Inquiry',
          productCode: null,
          fabricType: null,
          enquiryMethod: 'whatsapp'
        })
      })

      // Create WhatsApp message
      let message = 'Hello! I would like to get a free fabric and fit consultation.'
      if (formData.name) {
        message += `\n\nName: ${formData.name}`
      }
      if (formData.phone) {
        message += `\nPhone: ${formData.phone}`
      }
      if (formData.notes) {
        message += `\n\n${formData.notes}`
      }

      // Open WhatsApp
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank')
      
      setSubmitted(true)
      setTimeout(() => {
        setShowWhatsAppModal(false)
        setSubmitted(false)
        setFormData({ name: '', phone: '', email: '', notes: '', appointmentDate: '', appointmentTime: '' })
      }, 2000)
    } catch (error) {
      console.error('Failed to create enquiry:', error)
      // Still open WhatsApp even if enquiry creation fails
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello! I would like to get a free fabric and fit consultation.')}`, '_blank')
      setShowWhatsAppModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCalendarBooking = () => {
    setShowBookingModal(true)
  }

  const formatDateForGoogleCalendar = (date: string, time: string): string => {
    if (!date || !time) return ''
    
    try {
      // Create date object in local timezone
      const dateObj = new Date(`${date}T${time}`)
      
      // Convert to UTC
      const utcDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
      const year = utcDate.getUTCFullYear()
      const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0')
      const day = String(utcDate.getUTCDate()).padStart(2, '0')
      const hours = String(utcDate.getUTCHours()).padStart(2, '0')
      const minutes = String(utcDate.getUTCMinutes()).padStart(2, '0')
      const seconds = '00'
      
      // End time is 30 minutes later
      const endDate = new Date(utcDate.getTime() + 30 * 60000)
      const endYear = endDate.getUTCFullYear()
      const endMonth = String(endDate.getUTCMonth() + 1).padStart(2, '0')
      const endDay = String(endDate.getUTCDate()).padStart(2, '0')
      const endHours = String(endDate.getUTCHours()).padStart(2, '0')
      const endMinutes = String(endDate.getUTCMinutes()).padStart(2, '0')
      
      // Format: YYYYMMDDTHHMMSSZ (UTC)
      const start = `${year}${month}${day}T${hours}${minutes}${seconds}Z`
      const end = `${endYear}${endMonth}${endDay}T${endHours}${endMinutes}${seconds}Z`
      
      return `${start}/${end}`
    } catch (error) {
      console.error('Error formatting date for Google Calendar:', error)
      return ''
    }
  }

  const generateGoogleCalendarURL = (name: string, date: string, time: string, bookingType: string, phone: string, email: string, notes: string): string => {
    const eventTitle = `Free Consultation - ${name}`
    const eventDetails = `Customer: ${name}\nPhone: ${phone || 'Not provided'}\nEmail: ${email || 'Not provided'}\nType: ${bookingType === 'online' ? 'Online (Video Call)' : 'In-Person Visit'}\n\n${notes || 'Free Fabric & Fit Consultation'}`
    
    let calendarURL = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    calendarURL += `&text=${encodeURIComponent(eventTitle)}`
    
    if (date && time) {
      const dates = formatDateForGoogleCalendar(date, time)
      if (dates) {
        calendarURL += `&dates=${dates}`
      }
    }
    
    calendarURL += `&details=${encodeURIComponent(eventDetails)}`
    
    if (bookingType === 'visit') {
      calendarURL += `&location=${encodeURIComponent('Lalitha Garments - Store Visit')}`
    }
    
    return calendarURL
  }

  const handleCalendarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Determine product name based on booking type
      let productName = 'Free Consultation - Appointment Booking'
      if (bookingType === 'product_showcase') {
        productName = 'Product Showcase - WhatsApp Video Call'
      } else if (bookingType === 'online_meeting') {
        productName = 'Online Requirement Meeting'
      } else if (bookingType === 'visit') {
        productName = 'In-Person Visit Consultation'
      }

      // Create enquiry with booking details and save to database
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name || 'Appointment Customer',
          customerPhone: formData.phone || '',
          productName: productName,
          productCode: null,
          fabricType: null,
          enquiryMethod: 'calendar',
          bookingType: bookingType,
          appointmentDate: formData.appointmentDate || null,
          appointmentTime: formData.appointmentTime || null,
          meetingLink: bookingType === 'product_showcase' ? 'WhatsApp Video Call' : null
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create enquiry')
      }

      // Store enquiry ID for reference
      if (result.data?.id) {
        setEnquiryId(result.data.id)
      }

      // All data saved to database - move to Step 2
      setShowStep2(true)
    } catch (error) {
      console.error('Failed to create enquiry:', error)
      alert('Failed to create booking enquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-cream-50">
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-5xl sm:text-6xl mb-4">🎁</div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-sage-800 mb-4 sm:mb-6 font-bold">
          🎁 Get This FREE From Us
        </h2>
        
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 mb-6">
          <div className="text-4xl mb-4">👉</div>
          <h3 className="text-xl sm:text-2xl font-serif text-primary-600 mb-4 font-semibold">
            Free Fabric & Fit Consultation (10 minutes)
          </h3>
          <p className="text-base sm:text-lg text-sage-700 mb-3 leading-relaxed">
            <strong>English:</strong> Know which fabric, design, and style suits <strong>YOU</strong> before buying.
          </p>
          <p className="text-base sm:text-lg text-sage-700 mb-6 leading-relaxed">
            <strong>Kannada:</strong> ಖರೀದಿಸುವ ಮೊದಲು ನಿಮಗೆ ಯಾವ ಬಟ್ಟೆ ಸೂಕ್ತವೆಂದು ತಿಳಿಯಿರಿ.
          </p>
          
          {/* Booking Options */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleCalendarBooking}
              className="bg-primary-500 hover:bg-primary-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-large transform transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px] flex items-center justify-center gap-2"
            >
              📅 Schedule Appointment
            </button>
          <button
            onClick={handleWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-large transform transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px] flex items-center justify-center gap-2"
          >
              💬 WhatsApp
          </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Choose to schedule an appointment or chat with us on WhatsApp
          </p>
        </div>
      </div>

      {/* Calendar Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Step 1: Schedule Appointment</h3>
                <p className="text-sm text-gray-500 mt-1">Book your free consultation appointment</p>
              </div>
              <button
                onClick={() => {
                  setShowBookingModal(false)
                  setFormData({ name: '', phone: '', email: '', notes: '', appointmentDate: '', appointmentTime: '' })
                  setSubmitted(false)
                  setShowStep2(false)
                  setEnquiryId(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {showStep2 ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Appointment Booked Successfully!</p>
                <p className="text-gray-600 mb-6">
                  Your appointment has been saved. Would you like to connect with us on WhatsApp?
                </p>

                <div className="space-y-4">
                  <button
                    onClick={handleWhatsAppShareRequirements}
                    className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-md font-semibold flex items-center justify-center gap-2 shadow-lg"
                  >
                    💬 Share Requirements on WhatsApp
                  </button>
                  <p className="text-xs text-gray-500">
                    Share your requirements, preferences, and any questions you have
                  </p>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">OR</span>
                    </div>
                  </div>

                  <button
                    onClick={handleWhatsAppVideoCall}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white px-6 py-4 rounded-md font-semibold flex items-center justify-center gap-2 shadow-lg"
                  >
                    📱 Request WhatsApp Video Call
                  </button>
                  <p className="text-xs text-gray-500">
                    Request a video call to see products and discuss your requirements live
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={() => {
                      setShowBookingModal(false)
                      setShowStep2(false)
                      setFormData({ name: '', phone: '', email: '', notes: '', appointmentDate: '', appointmentTime: '' })
                      setBookingType('online_meeting')
                      setEnquiryId(null)
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>

                {enquiryId && (
                  <p className="text-xs text-gray-400 mt-4">
                    Reference ID: #{enquiryId}
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleCalendarSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Appointment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Appointment Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Type *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="bookingType"
                        value="visit"
                        checked={bookingType === 'visit'}
                        onChange={(e) => setBookingType(e.target.value as 'visit' | 'online_meeting' | 'product_showcase')}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <span className="font-medium">🏢 In-Person Visit</span>
                        <p className="text-xs text-gray-500 mt-1">Visit our store for consultation and product viewing</p>
                      </div>
                    </label>
                    <label className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="bookingType"
                        value="online_meeting"
                        checked={bookingType === 'online_meeting'}
                        onChange={(e) => setBookingType(e.target.value as 'visit' | 'online_meeting' | 'product_showcase')}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <span className="font-medium">💻 Online Requirement Meeting</span>
                        <p className="text-xs text-gray-500 mt-1">Video call to discuss your requirements and preferences</p>
                      </div>
                    </label>
                    <label className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="bookingType"
                        value="product_showcase"
                        checked={bookingType === 'product_showcase'}
                        onChange={(e) => setBookingType(e.target.value as 'visit' | 'online_meeting' | 'product_showcase')}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <span className="font-medium">📱 Product Showcase (WhatsApp Video Call)</span>
                        <p className="text-xs text-gray-500 mt-1">See our products live via WhatsApp video call</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Any specific requirements or preferred time..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : '📅 Schedule Appointment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingModal(false)
                      setFormData({ name: '', phone: '', email: '', notes: '', appointmentDate: '', appointmentTime: '' })
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">💬 WhatsApp Inquiry</h3>
              <button
                onClick={() => {
                  setShowWhatsAppModal(false)
                  setFormData({ name: '', phone: '', email: '', notes: '', appointmentDate: '', appointmentTime: '' })
                  setSubmitted(false)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Inquiry Submitted!</p>
                <p className="text-gray-600 mb-4">Opening WhatsApp...</p>
              </div>
            ) : (
              <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your phone number (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Any specific questions or requirements..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Opening...' : '💬 Open WhatsApp'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWhatsAppModal(false)
                      setFormData({ name: '', phone: '', email: '', notes: '', appointmentDate: '', appointmentTime: '' })
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  )
}


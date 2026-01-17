'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HeroSection() {
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showStep2, setShowStep2] = useState(false)
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
  const [enquiryId, setEnquiryId] = useState<number | null>(null)
  
  const WHATSAPP_NUMBER = '917204219541'

  const handleGetFreeConsultation = () => {
    setShowBookingModal(true)
    setShowStep2(false)
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
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

      // Move to Step 2
      setShowStep2(true)
    } catch (error) {
      console.error('Failed to create enquiry:', error)
      alert('Failed to create booking enquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
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

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-primary-50/30 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-50 border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl sm:text-2xl font-serif text-sage-800 font-semibold hover:text-primary-600 transition-colors">
            Lalitha Garments
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/catalogue"
              className="text-sm sm:text-base text-sage-600 hover:text-primary-600 transition-colors font-medium hidden sm:inline"
            >
              Catalogue
            </Link>
            <Link
              href="/admin/login"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm sm:text-base transition-colors shadow-md hover:shadow-lg"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Decorative elements */}
      <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary-100/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-sage-100/20 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto text-center z-10 relative">
        <div className="mb-4 sm:mb-6 animate-fade-in">
          <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-100 text-primary-700 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            Quality Sarees, Dresses & Kurtis — Made for YOU
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-sage-800 mb-4 sm:mb-6 animate-fade-in leading-tight px-2">
          🌸 LALITHA GARMENTS
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif text-primary-600 mb-3 sm:mb-4 animate-fade-in font-medium px-4 italic">
          Clothes that fit your body, comfort, and lifestyle — not just trends.
        </p>
        <p className="text-base sm:text-lg md:text-xl font-serif text-sage-700 mb-4 sm:mb-6 animate-fade-in px-4 italic">
          ನಿಮ್ಮ ದೇಹಕ್ಕೆ, ಆರಾಮಕ್ಕೆ ಮತ್ತು ಜೀವನಶೈಲಿಗೆ ಹೊಂದುವ ಬಟ್ಟೆಗಳು — ಟ್ರೆಂಡ್‌ಗಳಿಗಷ್ಟೇ ಅಲ್ಲ.
        </p>
        <p className="text-sm sm:text-base md:text-lg text-sage-600 mb-8 sm:mb-10 max-w-2xl mx-auto animate-fade-in leading-relaxed px-4">
          Customized & Ready-to-Wear Sarees, Kurtis and Dresses — Quality You Can Feel.
          <br className="hidden sm:block" />
          <span className="block mt-2">ಕಸ್ಟಮೈಸ್ ಮತ್ತು ರೆಡಿಮೇಡ್ ಸೀರೆ, ಕುರ್ತಿ ಮತ್ತು ಡ್ರೆಸ್‌ಗಳು — ಗುಣಮಟ್ಟವನ್ನು ಸ್ಪರ್ಶಿಸಿ.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center animate-fade-in px-4">
          <button
            onClick={handleGetFreeConsultation}
            className="group bg-primary-500 hover:bg-primary-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-large transform transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden w-full sm:w-auto min-h-[44px]"
          >
            <span className="relative z-10">👉 Get Free Fabric Consultation</span>
            <span className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          </button>
          <Link
            href="/catalogue"
            className="bg-white hover:bg-cream-50 text-primary-600 border-2 border-primary-500 px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-medium transform transition-all duration-300 hover:scale-105 hover:shadow-large w-full sm:w-auto min-h-[44px] flex items-center justify-center"
          >
            Explore Our Collection
          </Link>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent pointer-events-none"></div>

      {/* Booking Modal - Step 1: Schedule Appointment */}
      {showBookingModal && !showStep2 && (
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
                  setShowStep2(false)
                  setEnquiryId(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
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
                      <p className="text-xs text-gray-500 mt-1">Visit our store for consultation</p>
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
                      <p className="text-xs text-gray-500 mt-1">Video call to discuss requirements</p>
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
                      <p className="text-xs text-gray-500 mt-1">See products live via WhatsApp video</p>
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
                  placeholder="Any specific requirements or questions..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : '📅 Book Appointment'}
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
          </div>
        </div>
      )}

      {/* Step 2: Connect on WhatsApp */}
      {showBookingModal && showStep2 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Step 2: Connect with Us</h3>
                <p className="text-sm text-gray-500 mt-1">Share your requirements or request a video call</p>
              </div>
              <button
                onClick={() => {
                  setShowBookingModal(false)
                  setShowStep2(false)
                  setFormData({ name: '', phone: '', email: '', notes: '', appointmentDate: '', appointmentTime: '' })
                  setEnquiryId(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

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
          </div>
        </div>
      )}
    </section>
  )
}


'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, MessageCircle, Video, X } from 'lucide-react'

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
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-0 left-0 right-0 z-50 transition-all duration-300"
      >
        <div className="glass border-b-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl sm:text-2xl font-serif text-sage-800 font-semibold hover:text-primary-600 transition-colors flex items-center gap-2">
              <span className="text-2xl">🌸</span> Lalitha Garments
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/catalogue"
                className="text-sm sm:text-base text-sage-600 hover:text-primary-600 transition-colors font-medium hidden sm:inline relative group"
              >
                Catalogue
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 transition-all group-hover:w-full"></span>
              </Link>
              <Link
                href="/admin/login"
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base transition-all shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Decorative elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary-100/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1
        }}
        className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-sage-100/30 rounded-full blur-3xl"
      />

      <div className="max-w-7xl mx-auto text-center z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 sm:mb-6"
        >
          <span className="inline-block px-4 sm:px-6 py-2 bg-white/50 backdrop-blur-sm border border-primary-100 text-primary-700 rounded-full text-xs sm:text-sm font-bold tracking-wide shadow-sm mb-3 sm:mb-4">
            ✨ QUALITY SAREES, DRESSES & KURTIS
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-serif font-bold text-sage-800 mb-6 sm:mb-8 leading-tight tracking-tight px-2"
        >
          Lalitha <span className="text-primary-600">Garments</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light font-serif text-sage-800 mb-2 sm:mb-3 px-4"
        >
          Clothes that fit your body, comfort, and lifestyle.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-base sm:text-lg md:text-xl font-serif text-sage-600 mb-8 sm:mb-10 px-4 italic"
        >
          ನಿಮ್ಮ ದೇಹಕ್ಕೆ, ಆರಾಮಕ್ಕೆ ಮತ್ತು ಜೀವನಶೈಲಿಗೆ ಹೊಂದುವ ಬಟ್ಟೆಗಳು.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
        >
          <button
            onClick={handleGetFreeConsultation}
            className="group relative bg-primary-500 hover:bg-primary-600 text-white px-8 sm:px-12 py-4 rounded-full font-bold text-lg shadow-xl shadow-primary-500/30 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 w-full sm:w-auto overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Book Consultation <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
          </button>

          <Link
            href="/catalogue"
            className="group bg-white hover:bg-gray-50 text-sage-800 px-8 sm:px-12 py-4 rounded-full font-bold text-lg border-2 border-gray-100 hover:border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2"
          >
            Wait! View Collection
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </motion.div>
      </div>

      {/* Modern Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative z-10 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-cream-50 to-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-sage-900">
                    {showStep2 ? 'Step 2: Connect' : 'Step 1: Details'}
                  </h3>
                  <p className="text-sm text-sage-600">
                    {showStep2 ? 'Choose how you want to connect' : 'Tell us about your preferences'}
                  </p>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                {!showStep2 ? (
                  <form onSubmit={handleBookingSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-sage-700 mb-1.5">Full Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                          placeholder="Jane Doe"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-semibold text-sage-700 mb-1.5">Phone</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                          placeholder="+91..."
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-semibold text-sage-700 mb-1.5">Email (Optional)</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                          placeholder="jane@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-sage-700 mb-1.5">Date</label>
                        <input
                          type="date"
                          required
                          value={formData.appointmentDate}
                          onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-sage-700 mb-1.5">Time</label>
                        <input
                          type="time"
                          required
                          value={formData.appointmentTime}
                          onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-sage-700 mb-3">Consultation Type</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${bookingType === 'visit' ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}`}>
                          <input type="radio" className="hidden" name="bookingType" value="visit" checked={bookingType === 'visit'} onChange={() => setBookingType('visit')} />
                          <div className="text-2xl mb-1">🏢</div>
                          <div className="font-bold text-sm text-sage-900">In-Store</div>
                        </label>
                        <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${bookingType === 'online_meeting' ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}`}>
                          <input type="radio" className="hidden" name="bookingType" value="online_meeting" checked={bookingType === 'online_meeting'} onChange={() => setBookingType('online_meeting')} />
                          <div className="text-2xl mb-1">💻</div>
                          <div className="font-bold text-sm text-sage-900">Online Call</div>
                        </label>
                        <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${bookingType === 'product_showcase' ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}`}>
                          <input type="radio" className="hidden" name="bookingType" value="product_showcase" checked={bookingType === 'product_showcase'} onChange={() => setBookingType('product_showcase')} />
                          <div className="text-2xl mb-1">📱</div>
                          <div className="font-bold text-sm text-sage-900">Video Shop</div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-sage-700 mb-1.5">Notes</label>
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium resize-none"
                        placeholder="Any specific requirements..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : 'Confirm Booking'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
                    >
                      ✓
                    </motion.div>
                    <h4 className="text-2xl font-bold text-sage-900 mb-2">Booking Confirmed!</h4>
                    <p className="text-sage-600 mb-8 max-w-xs mx-auto">
                      Thank you for booking. Connect with us on WhatsApp for faster communication.
                    </p>

                    <div className="space-y-4">
                      <button
                        onClick={handleWhatsAppShareRequirements}
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-3"
                      >
                        <MessageCircle className="w-6 h-6" />
                        Chat on WhatsApp
                      </button>

                      <button
                        onClick={handleWhatsAppVideoCall}
                        className="w-full bg-white border-2 border-primary-100 text-primary-600 hover:bg-primary-50 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3"
                      >
                        <Video className="w-6 h-6" />
                        Request Video Call
                      </button>
                    </div>

                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="mt-8 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Close Window
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}


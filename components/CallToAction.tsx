'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Phone, ArrowRight } from 'lucide-react'

export default function CallToAction() {
  const handleWhatsApp = () => {
    window.open('https://wa.me/917204219541', '_blank')
  }

  const handleCall = () => {
    window.location.href = 'tel:+917204219541'
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Ready to get started?
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4 sm:mb-6 font-bold leading-tight">
            Ready to Wear Confidence, <br className="hidden sm:block" />
            Comfort & Quality?
          </h2>

          <p className="text-base sm:text-lg md:text-xl mb-3 opacity-90 max-w-2xl mx-auto">
            Message us today and experience garments made with care, not compromise.
          </p>
          <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 opacity-80 italic font-serif max-w-2xl mx-auto">
            ಇಂದೇ ಸಂಪರ್ಕಿಸಿ — ಆರಾಮ, ಗುಣಮಟ್ಟ ಮತ್ತು ನಂಬಿಕೆಯಿಂದ ಮಾಡಿದ ಬಟ್ಟೆಗಳನ್ನು ಅನುಭವಿಸಿ.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWhatsApp}
              className="group bg-white text-primary-600 hover:bg-cream-50 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-black/10 transition-all flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
              <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCall}
              className="group bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 backdrop-blur-sm px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3"
            >
              <Phone className="w-5 h-5" />
              Call: +91 7204219541
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

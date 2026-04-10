'use client'

import HeroSection from '@/components/HeroSection'
import WhatWeDo from '@/components/WhatWeDo'
import WhyChoose from '@/components/WhyChoose'
import FreeConsultation from '@/components/FreeConsultation'
import WhoIsThisFor from '@/components/WhoIsThisFor'
import Products from '@/components/Products'
import CustomizationProcess from '@/components/CustomizationProcess'
import CallToAction from '@/components/CallToAction'
import Footer from '@/components/Footer'
import WhatsAppFloat from '@/components/WhatsAppFloat'
import AIBoutiqueAssistant from '@/components/AIBoutiqueAssistant'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <main className="min-h-screen relative bg-cream-50">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-sage-200/20 rounded-full blur-[100px]" />
      </div>

      <HeroSection />
      
      {/* Featured Products - Discovery Grid */}
      <section id="catalog" className="relative z-10 py-24 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="text-primary-600 font-bold uppercase tracking-widest text-sm mb-4 block"
              >
                Curated Collections
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-serif font-bold text-sage-900 leading-tight"
              >
                Discover the Art of <span className="text-primary-600 italic">Jaipur</span>
              </motion.h2>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-boutique-assistant'))}
                className="group flex items-center gap-3 text-sage-800 font-bold hover:text-primary-600 transition-colors text-lg"
              >
                Ask Lalitha for Suggestions
                <span className="w-10 h-10 rounded-full border border-sage-200 flex items-center justify-center group-hover:border-primary-400 group-hover:bg-primary-50 transition-all">
                  →
                </span>
              </button>
            </motion.div>
          </div>
          <Products />
        </div>
      </section>

      {/* Simplified Process Section */}
      <CustomizationProcess />

      {/* Trust & Legacy Section (formerly WhyChoose but simplified) */}
      <WhyChoose />

      {/* Final Action */}
      <CallToAction />
      
      <Footer />
      
      {/* AI Assistant Core */}
      <AIBoutiqueAssistant />
      
      {/* Helper Floats */}
      <WhatsAppFloat />
    </main>
  )
}

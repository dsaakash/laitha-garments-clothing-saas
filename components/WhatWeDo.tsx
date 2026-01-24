'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function WhatWeDo() {
  return (
    <section className="py-20 px-4 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-purple-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-orange-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
            Collections
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-6">
            Our Core Collections
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Discover our handpicked selection of premium garments, available in both ready-to-wear and customized options.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Sarees */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10"></div>
            <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-xl h-full flex flex-col items-center text-center group-hover:border-transparent transition-all duration-300">
              <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                🎀
              </div>
              <h3 className="text-3xl font-serif text-slate-900 mb-4 group-hover:text-purple-700 transition-colors">Sarees</h3>

              <div className="space-y-4 w-full">
                <div className="bg-slate-50 p-4 rounded-xl group-hover:bg-purple-50/50 transition-colors">
                  <p className="text-slate-900 font-semibold mb-1">English</p>
                  <p className="text-slate-600 text-sm">Daily, Office, Festival, Function wear</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl group-hover:bg-purple-50/50 transition-colors">
                  <p className="text-slate-900 font-semibold mb-1">Kannada</p>
                  <p className="text-slate-600 text-sm font-medium">ದಿನನಿತ್ಯ, ಆಫೀಸ್, ಹಬ್ಬ, ಕಾರ್ಯಕ್ರಮ</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Kurtis & Dresses */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-400 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10"></div>
            <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-xl h-full flex flex-col items-center text-center group-hover:border-transparent transition-all duration-300">
              <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                👗
              </div>
              <h3 className="text-3xl font-serif text-slate-900 mb-4 group-hover:text-orange-600 transition-colors">Kurtis & Dresses</h3>

              <div className="space-y-4 w-full">
                <div className="bg-slate-50 p-4 rounded-xl group-hover:bg-orange-50/50 transition-colors">
                  <p className="text-slate-900 font-semibold mb-1">English</p>
                  <p className="text-slate-600 text-sm">Ready-made & Customized</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl group-hover:bg-orange-50/50 transition-colors">
                  <p className="text-slate-900 font-semibold mb-1">Kannada</p>
                  <p className="text-slate-600 text-sm font-medium">ರೆಡಿಮೇಡ್ ಮತ್ತು ಕಸ್ಟಮೈಸ್</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-black text-white p-8 md:p-12 rounded-[2rem] text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600 rounded-full blur-[100px] opacity-50"></div>

          <div className="relative z-10 max-w-4xl mx-auto">
            <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-6" />
            <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-6 font-light">
              &quot;Lalitha Garments is a women-focused clothing brand offering high-quality sarees, kurtis, and dresses. We work on both customized stitching and catalogue-based ready designs, carefully selected based on customer comfort, fabric quality, and occasion needs.&quot;
            </p>
            <div className="h-px w-24 bg-white/20 mx-auto mb-6"></div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed font-light">
              &quot;ಲಲಿತಾ ಗಾರ್ಮೆಂಟ್ಸ್ ಮಹಿಳೆಯರಿಗಾಗಿ ವಿಶೇಷವಾಗಿ ರೂಪುಗೊಂಡ ಬಟ್ಟೆ ಅಂಗಡಿ. ನಾವು ಉನ್ನತ ಗುಣಮಟ್ಟದ ಸೀರೆ, ಕುರ್ತಿ ಮತ್ತು ಡ್ರೆಸ್‌ಗಳನ್ನು ಕಸ್ಟಮೈಸ್ ಸ್ಟಿಚಿಂಗ್ ಮತ್ತು ಕ್ಯಾಟಲಾಗ್ ಆಧಾರಿತ ರೆಡಿಮೇಡ್ ವಿನ್ಯಾಸಗಳಲ್ಲಿ ಒದಗಿಸುತ್ತೇವೆ.&quot;
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}


'use client'

import { motion } from 'framer-motion'

export default function WhoIsThisFor() {
  const audiences = [
    {
      icon: '💼',
      title: 'Working Women',
      titleKn: 'ಉದ್ಯೋಗದಲ್ಲಿರುವ ಮಹಿಳೆಯರಿಗೆ',
      description: 'Professional yet comfortable office wear',
      color: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: '🏠',
      title: 'Homemakers',
      titleKn: 'ಗೃಹಿಣಿಯರಿಗೆ',
      description: 'Easy daily wear for all activities',
      color: 'from-emerald-400 to-teal-500',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: '👰',
      title: 'Brides & Families',
      titleKn: 'ವಧು ಮತ್ತು ಕುಟುಂಬದವರಿಗೆ',
      description: 'Special occasion & wedding wear',
      color: 'from-pink-400 to-rose-500',
      bgColor: 'bg-pink-50',
    },
    {
      icon: '✨',
      title: 'Quality Seekers',
      titleKn: 'ಆರಾಮ ಮತ್ತು ಗುಣಮಟ್ಟ ಬಯಸುವವರಿಗೆ',
      description: 'Premium fabrics and expert stitching',
      color: 'from-purple-400 to-violet-500',
      bgColor: 'bg-purple-50',
    },
    {
      icon: '🔄',
      title: 'Tired of Poor Quality',
      titleKn: 'ಕಡಿಮೆ ಗುಣಮಟ್ಟದ ಬಟ್ಟೆಗಳಿಂದ ಬೇಸತ್ತವರಿಗೆ',
      description: 'Looking for reliable quality',
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-50',
    },
  ]

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-pink-50 rounded-full blur-3xl opacity-50 pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-purple-50 rounded-full blur-3xl opacity-50 pointer-events-none translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-semibold mb-4 border border-red-100">
            ❤️ Perfect For You
          </span>
          <h2 className="text-4xl sm:text-5xl font-serif text-sage-800 mb-4 font-bold">
            Who Is This For?
          </h2>
          <p className="text-sage-600 text-lg max-w-2xl mx-auto">
            Whether you&apos;re a working professional or a bride-to-be, we have something perfect just for you.
          </p>
          <p className="text-sage-500 text-base mt-2 italic font-serif">
            ಇದು ಯಾರಿಗೆ ಸೂಕ್ತ?
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {audiences.map((audience, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group relative overflow-hidden"
            >
              {/* Gradient accent top bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${audience.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 ${audience.bgColor} rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                  {audience.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-sage-800 mb-1 group-hover:text-primary-600 transition-colors">{audience.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{audience.description}</p>
                  <p className="text-xs text-sage-500 font-serif italic">{audience.titleKn}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

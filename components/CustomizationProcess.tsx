'use client'

import { motion } from 'framer-motion'
import { MessageCircle, PenTool, Sparkles, Scissors, Truck } from 'lucide-react'

export default function CustomizationProcess() {
  const steps = [
    {
      number: '01',
      title: 'Contact Us',
      description: 'Reach out via WhatsApp or call to discuss your requirements.',
      icon: MessageCircle,
      color: 'bg-green-100 text-green-600'
    },
    {
      number: '02',
      title: 'Share Your Requirement',
      description: 'Tell us about your style preferences, occasion, and any specific needs.',
      icon: PenTool,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      number: '03',
      title: 'Fabric & Design Suggestions',
      description: 'We provide personalized recommendations based on your requirements.',
      icon: Sparkles,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      number: '04',
      title: 'Customization',
      description: 'We create your piece with attention to every detail and measurement.',
      icon: Scissors,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      number: '05',
      title: 'Dispatch',
      description: 'Your custom piece is carefully packaged and delivered across India.',
      icon: Truck,
      color: 'bg-red-100 text-red-600'
    },
  ]

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-purple-900 via-slate-900 to-black text-white relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-purple-500 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-purple-200 text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-serif mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Custom Order Process
          </h2>
          <p className="text-purple-100/70 text-lg max-w-2xl mx-auto">
            Simple steps to get your perfect custom piece, tailored just for you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-6 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent z-0"></div>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative z-10"
            >
              <div className="group h-full">
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-purple-500/30 h-full flex flex-col items-center text-center">
                  <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 relative`}>
                    <step.icon className="w-8 h-8" />
                    <div className="absolute -top-3 -right-3 bg-white text-black text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full border-4 border-slate-900">
                      {step.number}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-200 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 px-6 py-3 rounded-full border border-white/10 text-purple-100 hover:bg-white/10 transition-colors cursor-default">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Orders are taken via WhatsApp or Call • Delivery available across India
          </div>
        </motion.div>
      </div>
    </section>
  )
}


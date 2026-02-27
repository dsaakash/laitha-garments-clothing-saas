'use client'

import { motion } from 'framer-motion'
import { MessageCircle, PenTool, Sparkles, Scissors, Truck, ArrowRight } from 'lucide-react'

export default function CustomizationProcess() {
  const steps = [
    {
      number: '01',
      title: 'Contact Us',
      titleKn: 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ',
      description: 'Reach out via WhatsApp or call to discuss your requirements.',
      icon: MessageCircle,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      number: '02',
      title: 'Share Requirements',
      titleKn: 'ಅವಶ್ಯಕತೆ ಹಂಚಿಕೊಳ್ಳಿ',
      description: 'Tell us about your style preferences, occasion, and specific needs.',
      icon: PenTool,
      color: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      number: '03',
      title: 'Expert Suggestions',
      titleKn: 'ತಜ್ಞರ ಸಲಹೆ',
      description: 'We provide personalized fabric & design recommendations.',
      icon: Sparkles,
      color: 'from-purple-400 to-violet-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      number: '04',
      title: 'Customization',
      titleKn: 'ಕಸ್ಟಮೈಸೇಶನ್',
      description: 'We create your piece with attention to every detail and measurement.',
      icon: Scissors,
      color: 'from-orange-400 to-rose-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      number: '05',
      title: 'Delivery',
      titleKn: 'ಡೆಲಿವರಿ',
      description: 'Carefully packaged and delivered to your doorstep across India.',
      icon: Truck,
      color: 'from-rose-400 to-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
  ]

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-purple-500 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500 rounded-full blur-[200px] opacity-20"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-purple-200 text-sm font-semibold mb-6">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
            How It Works
          </span>
          <h2 className="text-4xl md:text-6xl font-serif mb-6 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
            Your Journey With Us
          </h2>
          <p className="text-purple-200/70 text-lg max-w-2xl mx-auto">
            Simple 5-step process to get your perfect custom piece, tailored just for you.
          </p>
        </motion.div>

        {/* Vertical Timeline for Mobile, Horizontal for Desktop */}
        <div className="relative">
          {/* Desktop: Horizontal connecting line */}
          <div className="hidden lg:block absolute top-16 left-[10%] right-[10%] h-0.5 z-0">
            <div className="w-full h-full bg-gradient-to-r from-green-500/30 via-purple-500/30 to-red-500/30 rounded-full"></div>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.5 }}
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-green-400 via-purple-400 to-red-400 rounded-full origin-left"
            />
          </div>

          {/* Mobile: Vertical connecting line */}
          <div className="lg:hidden absolute top-0 bottom-0 left-8 w-0.5 bg-gradient-to-b from-green-500/30 via-purple-500/30 to-red-500/30 z-0"></div>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-4 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className="relative z-10"
              >
                {/* Mobile Layout: Horizontal card */}
                <div className="lg:hidden flex gap-4">
                  {/* Step number circle on the timeline */}
                  <div className="flex-shrink-0 relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shadow-${step.textColor}/20 relative z-10`}>
                      <step.icon className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-white text-slate-900 rounded-full flex items-center justify-center text-xs font-black shadow-md z-20">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                    <p className="text-xs text-purple-300/70 font-medium mb-2">{step.titleKn}</p>
                    <p className="text-sm text-gray-400">{step.description}</p>
                  </div>
                </div>

                {/* Desktop Layout: Vertical card */}
                <div className="hidden lg:block group">
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-500 hover:border-purple-500/30 h-full flex flex-col items-center text-center hover:scale-[1.03] hover:-translate-y-2">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300 relative`}>
                      <step.icon className="w-7 h-7 text-white" strokeWidth={2} />
                      <div className="absolute -top-2 -right-2 bg-white text-slate-900 text-xs font-black w-7 h-7 flex items-center justify-center rounded-full shadow-lg border-2 border-slate-900">
                        {step.number}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold mb-1 text-white group-hover:text-purple-200 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs text-purple-300/60 font-medium mb-3">{step.titleKn}</p>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Arrow connector between desktop cards */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-16 -right-2 z-20">
                    <ArrowRight className="w-4 h-4 text-purple-500/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10 text-purple-100 hover:bg-white/10 transition-colors cursor-default backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm">Orders via WhatsApp or Call</span>
            <span className="w-1 h-1 bg-purple-400/50 rounded-full"></span>
            <span className="text-sm">Delivery across India 🇮🇳</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

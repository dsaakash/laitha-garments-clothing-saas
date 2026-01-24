'use client'

import { motion } from 'framer-motion'
import { Award, Heart, Ruler, Tag, Calendar, CheckCircle } from 'lucide-react'

export default function WhyChoose() {
  const features = [
    {
      icon: Award,
      title: 'Fabric-first approach',
      titleKn: 'ಫ್ಯಾಬ್ರಿಕ್ ಗುಣಮಟ್ಟಕ್ಕೆ ಮೊದಲ ಆದ್ಯತೆ',
      description: 'No compromise on quality',
      descriptionKn: 'ಗುಣಮಟ್ಟದಲ್ಲಿ ಯಾವುದೇ ರಾಜಿ ಇಲ್ಲ',
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      icon: Heart,
      title: 'Personalized guidance',
      titleKn: 'ವೈಯಕ್ತಿಕ ಸಲಹೆ',
      description: 'Before purchase consultation',
      descriptionKn: 'ಖರೀದಿಗೆ ಮೊದಲು ಸಲಹೆ',
      color: 'text-pink-600',
      bg: 'bg-pink-100'
    },
    {
      icon: Ruler,
      title: 'Perfect fitting',
      titleKn: 'ಸೂಕ್ತ ಫಿಟ್',
      description: 'For customized wear',
      descriptionKn: 'ಕಸ್ಟಮೈಸ್ ಬಟ್ಟೆಗಳಿಗೆ',
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      icon: Tag,
      title: 'Honest pricing',
      titleKn: 'ನಿಷ್ಠಾವಂತ ಬೆಲೆ',
      description: 'Transparent suggestions',
      descriptionKn: 'ಸ್ಪಷ್ಟ ಮಾರ್ಗದರ್ಶನ',
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      icon: Calendar,
      title: 'Suitable for all occasions',
      titleKn: 'ಎಲ್ಲಾ ಸಂದರ್ಭಗಳಿಗೆ ಸೂಕ್ತ',
      description: 'Office, daily wear & functions',
      descriptionKn: 'ದಿನನಿತ್ಯ, ಆಫೀಸ್ ಮತ್ತು ಕಾರ್ಯಕ್ರಮಗಳಿಗೆ',
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    },
    {
      icon: CheckCircle,
      title: 'Quality Assurance',
      titleKn: 'ಗುಣಮಟ್ಟದ ಭರವಸೆ',
      description: 'Checked before dispatch',
      descriptionKn: 'ಕಳುಹಿಸುವ ಮೊದಲು ಪರಿಶೀಲನೆ',
      color: 'text-teal-600',
      bg: 'bg-teal-100'
    }
  ]

  return (
    <section className="py-20 px-4 bg-slate-50 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-slate-200 text-slate-700 text-sm font-medium mb-4">
            Why Us?
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-6">
            What Makes Us Different
          </h2>
          <p className="text-slate-600 text-lg">
            Experience the Lalitha Garments difference in every stitch and fold.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${feature.bg} rounded-bl-full opacity-20 transition-transform group-hover:scale-110`}></div>

              <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-500 text-sm mb-4">{feature.description}</p>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-slate-800 font-medium mb-1 font-serif">{feature.titleKn}</p>
                <p className="text-slate-500 text-xs">{feature.descriptionKn}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


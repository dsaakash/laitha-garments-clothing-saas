'use client'

import { motion } from 'framer-motion'

export default function Products() {
  const products = [
    {
      name: 'Kurtis',
      description: 'Perfect for daily wear and office. Comfortable, stylish, and versatile.',
      categories: ['Daily Wear', 'Office Wear'],
      delay: 0
    },
    {
      name: 'Dresses & Sets',
      description: 'Elegant dresses and coordinated sets for every occasion.',
      categories: ['Casual', 'Formal', 'Party Wear'],
      delay: 0.1
    },
    {
      name: 'Sarees',
      description: 'Traditional and contemporary sarees for daily and festive occasions.',
      categories: ['Daily Wear', 'Festive', 'Wedding'],
      delay: 0.2
    },
  ]

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary-600 font-semibold tracking-wider text-sm mb-2 block uppercase">Collections</span>
          <h2 className="text-4xl md:text-5xl font-serif text-sage-900 mb-6">
            Timeless Elegance
          </h2>
          <p className="text-sage-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Every piece is crafted with attention to detail, ensuring you get the perfect blend of tradition and modernity.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: product.delay, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/30 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary-100/50"></div>

              <h3 className="text-2xl font-serif text-sage-800 mb-4 group-hover:text-primary-600 transition-colors relative z-10">{product.name}</h3>
              <p className="text-sage-600 mb-8 leading-relaxed relative z-10">{product.description}</p>

              <div className="flex flex-wrap gap-2 relative z-10">
                {product.categories.map((category, catIndex) => (
                  <span
                    key={catIndex}
                    className="bg-gray-50 text-gray-600 px-4 py-1.5 rounded-full text-sm font-medium border border-gray-100 group-hover:border-primary-100 group-hover:text-primary-700 group-hover:bg-primary-50 transition-all"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


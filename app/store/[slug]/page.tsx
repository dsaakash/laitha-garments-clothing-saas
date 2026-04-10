'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingBag, MessageCircle, ArrowLeft, Phone, MapPin, Mail, Globe } from 'lucide-react'
import PalaceBackground from '@/app/catalogue/PalaceBackground'

interface StoreProduct {
  id: string
  name: string
  description: string
  price: string | number
  category_name: string
  stock: number
  image: string | null
}

interface StoreData {
  store: {
    id: string
    businessName: string
    websiteBuilderEnabled: boolean
    profile: {
      businessName: string
      ownerName: string
      email: string
      phone: string
      address: string
      gstNumber?: string
      whatsappNumber: string
    }
    theme?: {
      primaryColor?: string
      accentColor?: string
    }
  }
  products: StoreProduct[]
}

export default function PublicStorePage({ params }: { params: { slug: string } }) {
  const [data, setData] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('All')

  const fetchStoreData = useCallback(async () => {
    try {
      const response = await fetch(`/api/store/${params.slug}`)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to load store')
      }
    } catch (err) {
      setError('Internal server error')
    } finally {
      setLoading(false)
    }
  }, [params.slug])

  useEffect(() => {
    fetchStoreData()
  }, [fetchStoreData])

  const handleWhatsApp = (productName: string) => {
    if (!data) return
    const whatsapp = data.store.profile.whatsappNumber || data.store.profile.phone
    const message = `Hi ${data.store.businessName}, I'm interested in "${productName}". Can you share more details?`
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-serif">Arriving at {params.slug.replace(/-/g, ' ')}&apos;s collection...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="text-6xl mb-4 text-gray-400">🍂</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Store Not Found'}</h1>
          <p className="text-gray-600 mb-6">This store might be offline or the URL is incorrect.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:underline">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const categories = ['All', ...Array.from(new Set(data.products.map(p => p.category_name).filter(Boolean)))]
  
  const filteredProducts = selectedCategory === 'All' 
    ? data.products 
    : data.products.filter(p => p.category_name === selectedCategory)

  const brandColor = data.store.theme?.primaryColor || '#4F46E5'
  const brandRgb = '79, 70, 229' // Fallback or derived

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FAF9F6]">
      {/* Dynamic Theme Styles */}
      <style jsx global>{`
        :root {
          --brand: ${brandColor};
          --brand-rgb: ${brandRgb};
        }
      `}</style>

      {/* Palace Background */}
      <PalaceBackground />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-white/90 via-white/80 to-[#FAF9F6]/95 backdrop-blur-[0.5px]"></div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100 px-4 py-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-gray-900 uppercase">
              {data.store.businessName}
            </h1>
            <div className="flex items-center gap-4">
              <Link 
                href={`tel:${data.store.profile.phone}`}
                className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors text-gray-700 sm:hidden"
              >
                <Phone size={20} />
              </Link>
              <button 
                onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })}
                className="hidden sm:inline-flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-bold tracking-tight hover:brightness-110 transition-all shadow-lg"
                style={{ backgroundColor: brandColor }}
              >
                Contact Store
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative px-4 py-16 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <span className="text-xs font-black uppercase tracking-[0.3em] mb-4 block" style={{ color: brandColor }}>Collection {new Date().getFullYear()}</span>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif text-gray-900 mb-6 font-bold leading-tight">
              Timeless Elegance, <br/>
              <span style={{ color: `${brandColor}cc` }}>Tailored for You</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover a curated selection of premium garments from {data.store.businessName}. 
              Crafted with heritage and modern sophistication.
            </p>
          </motion.div>
        </section>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-12">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-gray-900 text-white shadow-xl'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-24">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
              {filteredProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx % 3 * 0.1 }}
                  className="group"
                >
                  <div className="relative aspect-[3/4] bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700">
                    {product.image ? (
                      <Image 
                        src={product.image} 
                        alt={product.name} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                         <ShoppingBag size={48} className="text-gray-300 group-hover:scale-110 transition-transform duration-700" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="absolute top-6 right-6 z-10">
                      <span className="bg-white/90 backdrop-blur-md text-gray-900 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                        {product.category_name || 'Standard'}
                      </span>
                    </div>

                    <div className="absolute bottom-6 inset-x-6 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <button 
                        onClick={() => handleWhatsApp(product.name)}
                        className="w-full bg-white text-gray-900 font-black text-xs uppercase tracking-[0.2em] py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 hover:bg-gray-900 hover:text-white transition-all"
                      >
                        <MessageCircle size={16} />
                        Enquire Now
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-6 px-4">
                    <h3 className="text-xl font-serif font-bold text-gray-900 mb-1">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-500 text-sm">{product.category_name}</p>
                      <p className="text-gray-900 font-black text-lg">
                        {typeof product.price === 'number' && product.price > 0 
                          ? `₹${product.price}` 
                          : 'Custom Quote'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-[3rem] shadow-sm border border-gray-50">
              <p className="text-gray-400 italic">No products available in this category.</p>
            </div>
          )}
        </main>

        {/* Footer / Contact Section */}
        <footer id="footer" className="bg-white border-t border-gray-100 pt-20 pb-12 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 sm:gap-20 mb-16">
              <div>
                <h3 className="text-2xl font-serif font-black mb-6 uppercase tracking-tight">About {data.store.businessName}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Experience premium quality and authentic designs curated for the modern wardrobe. 
                  Every piece tells a story of craftsmanship and elegance.
                </p>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <Globe size={18} style={{ color: brandColor }} />
                  </div>
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <Mail size={18} style={{ color: brandColor }} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-serif font-black mb-6 uppercase tracking-tight">Visit Us</h3>
                <div className="space-y-4">
                  <div className="flex gap-4 text-gray-600">
                    <MapPin size={24} style={{ color: brandColor }} className="shrink-0" />
                    <p className="whitespace-pre-line">{data.store.profile.address}</p>
                  </div>
                  <div className="flex gap-4 text-gray-600">
                    <Phone size={20} style={{ color: brandColor }} className="shrink-0" />
                    <p>{data.store.profile.phone}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-serif font-black mb-6 uppercase tracking-tight">Quick Connect</h3>
                <p className="text-gray-600 mb-6 font-medium italic">Chat with us for custom sizes or orders.</p>
                <button 
                  onClick={() => handleWhatsApp('General Enquiry')}
                  className="w-full text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-3"
                  style={{ backgroundColor: brandColor }}
                >
                  <MessageCircle size={24} />
                  Chat on WhatsApp
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-400 text-xs font-bold uppercase tracking-widest font-sans">
              <p>© {new Date().getFullYear()} {data.store.businessName}. All rights reserved.</p>
              <div className="flex items-center gap-2">
                <span>Powered by</span>
                <span className="text-gray-900">Lalitha Garments Platform</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700;900&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
        }
        
        .font-serif {
          font-family: 'Playfair Display', serif;
        }
      `}</style>
    </div>
  )
}

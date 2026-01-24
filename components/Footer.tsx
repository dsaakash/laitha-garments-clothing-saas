'use client'

import Link from 'next/link'
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, ArrowRight } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-950 text-slate-300 py-16 px-4 border-t border-slate-900 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <h3 className="text-3xl font-serif text-white flex items-center gap-2">
              <span className="text-purple-500">🌸</span> Lalitha Garments
            </h3>
            <p className="text-slate-400 leading-relaxed">
              We don&apos;t just sell clothes. We customize them based on your needs. Experience the luxury of perfect fitting and premium fabrics.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all duration-300 border border-slate-800 hover:border-purple-500">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 border border-slate-800 hover:border-blue-500">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all duration-300 border border-slate-800 hover:border-sky-400">
                <Twitter className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-4">
              {[
                { label: 'Home', href: '/' },
                { label: 'Collections', href: '#collections' },
                { label: 'Why Choose Us', href: '#why-us' },
                { label: 'Order Process', href: '#process' },
                { label: 'Admin Login', href: '/admin/login' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="flex items-center gap-2 hover:text-purple-400 transition-colors group">
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-purple-500" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-500 shrink-0 mt-1" />
                <span>Kr mill colony , 570003</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-purple-500 shrink-0" />
                <span>7204219541</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-purple-500 shrink-0" />
                <span>lalithasavant@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6 uppercase tracking-wider text-sm">Newsletter</h4>
            <p className="text-slate-400 mb-4 text-sm">Subscribe to get updates on new arrivals and offers.</p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
              />
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors text-sm">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {currentYear} Lalitha Garments. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}


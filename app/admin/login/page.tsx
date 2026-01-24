'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, User, Mail, Lock, ArrowRight, Loader2, Building2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [activeTab, setActiveTab] = useState<'business' | 'admin' | 'user'>('business')

  useEffect(() => {
    // Check if already authenticated
    fetch('/api/auth/check', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.admin) {
          const role = (data.admin.role || 'admin').toLowerCase().trim()
          const tenantId = data.admin.tenant_id

          if (tenantId) {
            // Business user
            router.push('/admin/dashboard')
          } else if (role === 'user') {
            router.push('/admin/products')
          } else {
            router.push('/admin/dashboard')
          }
        } else {
          setChecking(false)
        }
      })
      .catch(() => {
        setChecking(false)
      })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          loginType: activeTab  // Pass selected tab
        }),
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        const tenantId = result.admin?.tenant_id
        const role = (result.admin?.role || 'admin').toLowerCase().trim()

        // Redirect based on user type
        if (tenantId) {
          router.push('/admin/dashboard')  // Business dashboard
        } else if (role === 'user') {
          router.push('/admin/products')   // User dashboard
        } else {
          router.push('/admin/dashboard')  // Super admin dashboard
        }
      } else {
        setError(result.message || 'Invalid credentials')
        setLoading(false)
      }
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Lalitha Garments</h1>
          <p className="text-purple-100">Business Management Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Three Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setActiveTab('business'); setError('') }}
              className={`flex-1 py-4 px-4 text-sm font-semibold transition-all ${activeTab === 'business'
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Business
            </button>
            <button
              onClick={() => { setActiveTab('admin'); setError('') }}
              className={`flex-1 py-4 px-4 text-sm font-semibold transition-all ${activeTab === 'admin'
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Crown className="w-4 h-4 inline mr-2" />
              Admin
            </button>
            <button
              onClick={() => { setActiveTab('user'); setError('') }}
              className={`flex-1 py-4 px-4 text-sm font-semibold transition-all ${activeTab === 'user'
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              User
            </button>
          </div>

          {/* Login Form */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Tab-specific title */}
                <div className="mb-6">
                  {activeTab === 'business' && (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900">Business Login</h2>
                      <p className="text-sm text-gray-600 mt-1">Login to manage your business</p>
                    </>
                  )}
                  {activeTab === 'admin' && (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900">Admin Portal</h2>
                      <p className="text-sm text-gray-600 mt-1">Super admin access</p>
                    </>
                  )}
                  {activeTab === 'user' && (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900">Lalitha Garments</h2>
                      <p className="text-sm text-gray-600 mt-1">Employee login</p>
                    </>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="you@example.com"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Logging in...</span>
                      </>
                    ) : (
                      <>
                        <span>Login</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-purple-100 text-sm mt-6">
          © 2026 Lalitha Garments. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, User, Mail, Lock, ArrowRight, Loader2, Building2, Eye, EyeOff, Shield, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [activeTab, setActiveTab] = useState<'business' | 'admin' | 'user'>('business')
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    // Check if already authenticated
    fetch('/api/auth/check', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.admin) {
          const role = (data.admin.role || 'admin').toLowerCase().trim()
          const tenantId = data.admin.tenant_id

          if (tenantId) {
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
          loginType: activeTab
        }),
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        const tenantId = result.admin?.tenant_id
        const role = (result.admin?.role || 'admin').toLowerCase().trim()

        if (tenantId) {
          router.push('/admin/dashboard')
        } else if (role === 'user') {
          router.push('/admin/products')
        } else {
          router.push('/admin/dashboard')
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

  const tabConfig = {
    business: {
      icon: Building2,
      title: 'Business Login',
      subtitle: 'Manage your store, inventory & sales',
      gradient: 'from-purple-600 to-indigo-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      features: ['📊 Dashboard & Analytics', '📦 Inventory Management', '💰 Sales Tracking']
    },
    admin: {
      icon: Crown,
      title: 'Admin Portal',
      subtitle: 'Platform administration & oversight',
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      features: ['🏢 Tenant Management', '⚙️ System Configuration', '🔒 Security Controls']
    },
    user: {
      icon: User,
      title: 'Employee Login',
      subtitle: 'Access products & catalogues',
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      features: ['👗 Product Catalogue', '📋 Order Processing', '📱 Quick Access']
    }
  }

  const currentTab = tabConfig[activeTab]

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-white/60 text-sm">Checking authentication...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[200px]"></div>
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-xl"
          >
            <span className="text-3xl">🌸</span>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Lalitha Garments</h1>
          <p className="text-purple-200/70 text-sm">Business Management Platform</p>
        </div>

        {/* Login Card */}
        <motion.div
          layout
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20"
        >
          {/* Three Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            {(['business', 'admin', 'user'] as const).map((tab) => {
              const config = tabConfig[tab]
              const Icon = config.icon
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setError('') }}
                  className={`flex-1 py-4 px-3 text-sm font-semibold transition-all relative ${isActive
                      ? 'text-purple-700 bg-white'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    <span className="text-xs">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Login Form */}
          <div className="p-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Tab-specific header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${currentTab.iconBg} rounded-xl flex items-center justify-center`}>
                      <currentTab.icon className={`w-5 h-5 ${currentTab.iconColor}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{currentTab.title}</h2>
                      <p className="text-xs text-gray-500">{currentTab.subtitle}</p>
                    </div>
                  </div>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2">
                    {currentTab.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-50 text-gray-500 px-3 py-1 rounded-full border border-gray-100"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="mb-4"
                    >
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-start gap-2">
                        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{error}</p>
                          <p className="text-xs text-red-500 mt-1">Please check your credentials and try again.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'email' ? 'ring-2 ring-purple-500 ring-offset-1' : ''
                      }`}>
                      <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'email' ? 'text-purple-500' : 'text-gray-400'
                        }`} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white transition-all text-sm"
                        placeholder="you@example.com"
                        required
                        disabled={loading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'password' ? 'ring-2 ring-purple-500 ring-offset-1' : ''
                      }`}>
                      <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'password' ? 'text-purple-500' : 'text-gray-400'
                        }`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-10 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white transition-all text-sm"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Help text */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">
                    Need help? Contact your administrator or call{' '}
                    <a href="tel:9353083597" className="text-purple-600 hover:text-purple-700 font-medium">
                      9353083597
                    </a>
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Security badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-6 gap-4"
        >
          <div className="flex items-center gap-2 text-purple-200/40 text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>256-bit SSL Secured</span>
          </div>
          <div className="w-px h-4 bg-purple-200/20"></div>
          <p className="text-purple-200/40 text-xs">
            © 2026 Lalitha Garments
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

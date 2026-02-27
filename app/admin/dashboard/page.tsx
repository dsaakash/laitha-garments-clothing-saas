'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { Sale, SaleItem } from '@/lib/storage'
import { format } from 'date-fns'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import StockValueCards from '@/components/dashboard/StockValueCards'
import SupplierStockTable from '@/components/dashboard/SupplierStockTable'
import {
  Package, TrendingUp, TrendingDown, DollarSign,
  ShoppingBag, Calendar, ArrowRight, Plus,
  FileText, Clock, BarChart3, Activity
} from 'lucide-react'

interface SoldItem {
  dressName: string
  dressType: string
  dressCode: string
  quantity: number
  totalProfit: number
  totalRevenue: number
  customerName: string
  saleDate: string
}

export default function Dashboard() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<'superadmin' | 'admin' | 'user' | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalInventory: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    thisMonthSales: 0,
    thisMonthRevenue: 0,
  })
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [soldItems, setSoldItems] = useState<SoldItem[]>([])
  const [stockValueData, setStockValueData] = useState<any>(null)
  const [trialInfo, setTrialInfo] = useState<{
    isTrial: boolean
    daysRemaining: number
    trialEndDate: string
  } | null>(null)

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '🌅 Good Morning'
    if (hour < 17) return '☀️ Good Afternoon'
    return '🌙 Good Evening'
  }

  // Fetch trial info for tenant users
  useEffect(() => {
    const fetchTrialInfo = async () => {
      try {
        const authRes = await fetch('/api/auth/check', { credentials: 'include' })
        const authData = await authRes.json()

        if (authData.authenticated && authData.admin) {
          if (authData.admin.name) {
            setUserName(authData.admin.name)
          }
          if (authData.admin.tenant_id) {
            const tenantRes = await fetch(`/api/tenants/${authData.admin.tenant_id}`)
            const tenantData = await tenantRes.json()

            if (tenantData.success && tenantData.data) {
              const tenant = tenantData.data

              if (tenant.status === 'trial' && tenant.trialEndDate) {
                const endDate = new Date(tenant.trialEndDate)
                const now = new Date()
                const diffTime = endDate.getTime() - now.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                setTrialInfo({
                  isTrial: true,
                  daysRemaining: Math.max(0, diffDays),
                  trialEndDate: tenant.trialEndDate
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching trial info:', error)
      }
    }

    fetchTrialInfo()
  }, [])

  // Check user role on mount
  useEffect(() => {
    fetch('/api/auth/check', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.admin) {
          let role = data.admin.role
          if (!role) {
            role = 'admin'
          } else {
            role = role.toLowerCase().trim()
            if (role === 'super_admin') role = 'superadmin'
          }
          setUserRole(role as 'superadmin' | 'admin' | 'user')

          if (role === 'user') {
            router.push('/admin/products')
            return
          }
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error checking user role:', err)
        setLoading(false)
      })
  }, [router])

  useEffect(() => {
    if (userRole === 'user' || loading) return

    const loadData = async () => {
      try {
        const [inventoryRes, salesRes, stockValueRes] = await Promise.all([
          fetch('/api/inventory', { credentials: 'include' }),
          fetch('/api/sales', { credentials: 'include' }),
          fetch('/api/inventory/value', { credentials: 'include' }),
        ])
        const inventoryResult = await inventoryRes.json()
        const salesResult = await salesRes.json()
        const stockValueResult = await stockValueRes.json()

        const inventory = inventoryResult.success ? inventoryResult.data : []
        const sales = salesResult.success ? salesResult.data : []

        if (stockValueResult.success) {
          setStockValueData(stockValueResult.data)
        }

        const totalRevenue = sales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0)
        const totalProfit = sales.reduce((sum: number, sale: Sale) => {
          const saleProfit = sale.items.reduce((itemSum: number, item: SaleItem) => itemSum + item.profit, 0)
          return sum + saleProfit
        }, 0)

        const now = new Date()
        const thisMonthSales = sales.filter((sale: Sale) => {
          const saleDate = new Date(sale.date)
          return saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear()
        })
        const thisMonthRevenue = thisMonthSales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0)

        const recent = sales
          .sort((a: Sale, b: Sale) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)

        const itemsMap = new Map<string, SoldItem>()
        sales.forEach((sale: Sale) => {
          sale.items.forEach((item: SaleItem) => {
            const key = `${item.dressCode}-${item.dressName}`
            if (itemsMap.has(key)) {
              const existing = itemsMap.get(key)!
              existing.quantity += item.quantity
              existing.totalProfit += item.profit
              existing.totalRevenue += item.sellingPrice * item.quantity
            } else {
              itemsMap.set(key, {
                dressName: item.dressName,
                dressType: item.dressType,
                dressCode: item.dressCode,
                quantity: item.quantity,
                totalProfit: item.profit,
                totalRevenue: item.sellingPrice * item.quantity,
                customerName: sale.partyName,
                saleDate: sale.date,
              })
            }
          })
        })

        const soldItemsList = Array.from(itemsMap.values())
          .sort((a, b) => b.totalProfit - a.totalProfit)
          .slice(0, 10)

        setStats({
          totalInventory: inventory.length,
          totalSales: sales.length,
          totalRevenue,
          totalProfit,
          thisMonthSales: thisMonthSales.length,
          thisMonthRevenue,
        })
        setRecentSales(recent)
        setSoldItems(soldItemsList)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      }
    }
    loadData()
  }, [userRole, loading])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            {/* Skeleton loader */}
            <div className="space-y-6 w-full max-w-4xl mx-auto">
              <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (userRole === 'user') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don&apos;t have permission to access this page.</p>
            <Link
              href="/admin/products"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Go to Products →
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const statCards = [
    {
      title: 'Total Inventory',
      value: stats.totalInventory,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      lightColor: 'text-blue-600',
      link: '/admin/inventory',
      badge: 'Items',
    },
    {
      title: 'Total Sales',
      value: stats.totalSales,
      icon: ShoppingBag,
      color: 'from-emerald-500 to-emerald-600',
      lightBg: 'bg-emerald-50',
      lightColor: 'text-emerald-600',
      link: '/admin/sales',
      badge: 'Orders',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      lightBg: 'bg-purple-50',
      lightColor: 'text-purple-600',
      link: '/admin/sales',
      badge: 'Earned',
    },
    {
      title: 'Total Profit',
      value: `₹${stats.totalProfit.toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-amber-500 to-amber-600',
      lightBg: 'bg-amber-50',
      lightColor: 'text-amber-600',
      link: '/admin/sales',
      badge: 'Net',
    },
    {
      title: 'This Month Sales',
      value: stats.thisMonthSales,
      icon: Calendar,
      color: 'from-pink-500 to-pink-600',
      lightBg: 'bg-pink-50',
      lightColor: 'text-pink-600',
      link: '/admin/sales',
      badge: format(new Date(), 'MMM'),
    },
    {
      title: 'This Month Revenue',
      value: `₹${stats.thisMonthRevenue.toLocaleString()}`,
      icon: BarChart3,
      color: 'from-indigo-500 to-indigo-600',
      lightBg: 'bg-indigo-50',
      lightColor: 'text-indigo-600',
      link: '/admin/sales',
      badge: format(new Date(), 'MMM'),
    },
  ]

  const salesTrendData = recentSales
    .slice()
    .reverse()
    .map(sale => ({
      name: new Date(sale.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
      amount: sale.totalAmount
    }))

  const topProductsChartData = soldItems
    .slice(0, 5)
    .map(item => ({
      name: item.dressName.length > 10 ? item.dressName.slice(0, 10) + '...' : item.dressName,
      profit: item.totalProfit
    }))

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <AdminLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {getGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(), 'EEE, MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-xl border border-green-100">
              <Activity className="w-3.5 h-3.5" />
              <span className="font-medium">Live</span>
            </div>
          </div>
        </motion.div>

        {/* Trial Warning Banner */}
        {trialInfo && trialInfo.isTrial && (
          <motion.div
            variants={itemVariants}
            className={`rounded-2xl p-6 border ${trialInfo.daysRemaining <= 3
              ? 'bg-gradient-to-r from-red-50 to-red-100/50 border-red-200'
              : trialInfo.daysRemaining <= 7
                ? 'bg-gradient-to-r from-orange-50 to-orange-100/50 border-orange-200'
                : 'bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-yellow-200'
              }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trialInfo.daysRemaining <= 3
                    ? 'bg-red-100'
                    : trialInfo.daysRemaining <= 7
                      ? 'bg-orange-100'
                      : 'bg-yellow-100'
                    }`}>
                    <span className="text-2xl">⏰</span>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${trialInfo.daysRemaining <= 3
                      ? 'text-red-900'
                      : trialInfo.daysRemaining <= 7
                        ? 'text-orange-900'
                        : 'text-yellow-900'
                      }`}>
                      {trialInfo.daysRemaining === 0
                        ? '🚨 Trial Ends Today!'
                        : `Trial Period: ${trialInfo.daysRemaining} Days Remaining`}
                    </h3>
                    <p className={`text-sm ${trialInfo.daysRemaining <= 3
                      ? 'text-red-700'
                      : trialInfo.daysRemaining <= 7
                        ? 'text-orange-700'
                        : 'text-yellow-700'
                      }`}>
                      Your trial expires on {format(new Date(trialInfo.trialEndDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <p className={`text-sm mb-3 ${trialInfo.daysRemaining <= 7 ? 'text-gray-700' : 'text-gray-600'}`}>
                  Upgrade now to continue accessing all features and your business data after the trial period.
                </p>
                <div className="flex gap-3">
                  <a
                    href="tel:9353083597"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all text-sm"
                  >
                    <span>📞</span>
                    <span>Call: 9353083597</span>
                  </a>
                  <a
                    href="https://wa.me/919353083597?text=Hi, I want to upgrade my account"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all text-sm"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stock Value - Retail & Wholesale */}
        <motion.div variants={itemVariants}>
          <StockValueCards data={stockValueData} loading={!stockValueData} />
        </motion.div>

        {/* Quick Actions - Now at the top for better UX */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
              Quick Actions
            </h2>
            <span className="text-xs text-gray-400">Jump to any section</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/inventory"
              className="group flex items-center gap-3 bg-gradient-to-r from-purple-50 to-purple-50/50 hover:from-purple-100 hover:to-purple-50 text-purple-700 px-5 py-4 rounded-xl transition-all font-semibold border border-purple-100 hover:border-purple-200 hover:shadow-md"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                <Plus className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">Add Inventory</div>
                <div className="text-xs text-purple-500 font-normal">New items</div>
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/admin/sales"
              className="group flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-emerald-50/50 hover:from-emerald-100 hover:to-emerald-50 text-emerald-700 px-5 py-4 rounded-xl transition-all font-semibold border border-emerald-100 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">Record Sale</div>
                <div className="text-xs text-emerald-500 font-normal">New transaction</div>
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/admin/invoices"
              className="group flex items-center gap-3 bg-gradient-to-r from-blue-50 to-blue-50/50 hover:from-blue-100 hover:to-blue-50 text-blue-700 px-5 py-4 rounded-xl transition-all font-semibold border border-blue-100 hover:border-blue-200 hover:shadow-md"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">View Invoices</div>
                <div className="text-xs text-blue-500 font-normal">Billing history</div>
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </motion.div>

        {/* Stat Cards Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {statCards.map((card, index) => (
            <Link key={index} href={card.link}>
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden group cursor-pointer"
              >
                {/* Subtle gradient background */}
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8">
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity blur-2xl`}></div>
                </div>

                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className={`${card.lightBg} p-2.5 rounded-xl`}>
                    <card.icon className={`w-5 h-5 ${card.lightColor}`} />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${card.lightBg} ${card.lightColor}`}>
                    {card.badge}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-0.5">{card.value}</h3>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Charts Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                Sales Trend
              </h3>
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">Last 5 sales</span>
            </div>
            <div className="h-[300px] w-full">
              {salesTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrendData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={2.5} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No sales data yet</p>
                    <Link href="/admin/sales" className="text-xs text-purple-500 hover:text-purple-600 font-medium mt-1 inline-block">
                      Record your first sale →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                Top Products
              </h3>
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">By profit</span>
            </div>
            <div className="h-[300px] w-full">
              {topProductsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} />
                    <Tooltip
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px' }}
                    />
                    <Bar dataKey="profit" fill="#10b981" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No product data yet</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Supplier Stock Value Table */}
        {stockValueData?.supplierBreakdown && stockValueData.supplierBreakdown.length > 0 && (
          <motion.div variants={itemVariants}>
            <SupplierStockTable
              data={stockValueData.supplierBreakdown}
              loading={!stockValueData}
            />
          </motion.div>
        )}

        {/* Recent Sales Table */}
        {recentSales.length > 0 && (
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-orange-500 rounded-full"></span>
                Recent Transactions
              </h2>
              <Link
                href="/admin/sales"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentSales.map((sale) => {
                    const saleProfit = sale.items.reduce((sum, item) => sum + item.profit, 0)
                    return (
                      <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-sm font-bold text-gray-500">
                              {sale.partyName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 text-sm">{sale.partyName}</span>
                              <span className="text-xs text-gray-400">{format(new Date(sale.date), 'dd MMM yyyy')} • #{sale.billNumber}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            {sale.items.slice(0, 2).map((item, idx) => (
                              <span key={idx} className="text-sm text-gray-600 truncate max-w-[200px]">
                                {item.quantity}x {item.dressName}
                              </span>
                            ))}
                            {sale.items.length > 2 && (
                              <span className="text-xs text-gray-400">+{sale.items.length - 2} more</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-gray-900">₹{sale.totalAmount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-medium px-2.5 py-1 rounded-lg text-xs ${saleProfit >= 0
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-red-700 bg-red-50'
                            }`}>
                            {saleProfit >= 0 ? '+' : ''}₹{saleProfit.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AdminLayout>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { Sale, SaleItem } from '@/lib/storage'
import { format } from 'date-fns'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

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
  const [trialInfo, setTrialInfo] = useState<{
    isTrial: boolean
    daysRemaining: number
    trialEndDate: string
  } | null>(null)

  // Fetch trial info for tenant users
  useEffect(() => {
    const fetchTrialInfo = async () => {
      try {
        const authRes = await fetch('/api/auth/check', { credentials: 'include' })
        const authData = await authRes.json()

        if (authData.authenticated && authData.admin && authData.admin.tenant_id) {
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
            role = 'admin' // Default to admin if role missing
          } else {
            role = role.toLowerCase().trim()
            if (role === 'super_admin') role = 'superadmin'
          }
          setUserRole(role as 'superadmin' | 'admin' | 'user')

          // Redirect users away from dashboard
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
    // Only load dashboard data if user is admin or superadmin
    if (userRole === 'user' || loading) return

    const loadData = async () => {
      try {
        const [inventoryRes, salesRes] = await Promise.all([
          fetch('/api/inventory', { credentials: 'include' }),
          fetch('/api/sales', { credentials: 'include' }),
        ])
        const inventoryResult = await inventoryRes.json()
        const salesResult = await salesRes.json()

        const inventory = inventoryResult.success ? inventoryResult.data : []
        const sales = salesResult.success ? salesResult.data : []

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

        // Get recent sales (last 5)
        const recent = sales
          .sort((a: Sale, b: Sale) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)

        // Aggregate sold items with profit
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
          .slice(0, 10) // Top 10 by profit

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

  // Show loading state while checking role
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // If user role is 'user', they shouldn't see this page (should be redirected)
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
      title: 'Total Inventory Items',
      value: stats.totalInventory,
      icon: '📦',
      color: 'bg-blue-500',
      link: '/admin/inventory',
    },
    {
      title: 'Total Sales',
      value: stats.totalSales,
      icon: '💰',
      color: 'bg-green-500',
      link: '/admin/sales',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: '💵',
      color: 'bg-purple-500',
      link: '/admin/sales',
    },
    {
      title: 'Total Profit',
      value: `₹${stats.totalProfit.toLocaleString()}`,
      icon: '📈',
      color: 'bg-yellow-500',
      link: '/admin/sales',
    },
    {
      title: 'This Month Sales',
      value: stats.thisMonthSales,
      icon: '📅',
      color: 'bg-pink-500',
      link: '/admin/sales',
    },
    {
      title: 'This Month Revenue',
      value: `₹${stats.thisMonthRevenue.toLocaleString()}`,
      icon: '💎',
      color: 'bg-indigo-500',
      link: '/admin/sales',
    },
  ]

  // Prepare chart data
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

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of your business performance</p>
          </div>
          <div className="text-sm text-gray-400 bg-white px-3 py-1 rounded-full border shadow-sm">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Trial Warning Banner */}
        {trialInfo && trialInfo.isTrial && (
          <div className={`rounded-xl p-6 border-2 ${trialInfo.daysRemaining <= 3
              ? 'bg-red-50 border-red-200'
              : trialInfo.daysRemaining <= 7
                ? 'bg-orange-50 border-orange-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trialInfo.daysRemaining <= 3
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
                <p className={`text-sm mb-3 ${trialInfo.daysRemaining <= 7 ? 'text-gray-700' : 'text-gray-600'
                  }`}>
                  Upgrade now to continue accessing all features and your business data after the trial period.
                </p>
                <div className="flex gap-3">
                  <a
                    href="tel:9353083597"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all"
                  >
                    <span>📞</span>
                    <span>Call: 9353083597</span>
                  </a>
                  <a
                    href="https://wa.me/919353083597?text=Hi, I want to upgrade my account"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <Link key={index} href={card.link}>
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                  <div className={`${card.color} w-24 h-24 rounded-full blur-2xl`}></div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color.replace('bg-', 'bg-').replace('500', '100')} p-3 rounded-xl`}>
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {card.title.includes('Month') ? 'Monthly' : 'Total'}
                  </span>
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{card.value}</h3>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              Sales Trend (Last 5 Sales)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#8884d8" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-green-500 rounded-full"></span>
              Top Products by Profit
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="profit" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/inventory"
              className="group flex items-center justify-center gap-3 bg-purple-50 hover:bg-purple-100 text-purple-700 px-6 py-4 rounded-xl transition-all font-semibold border border-purple-100 hover:border-purple-200"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">➕</div>
              Add Inventory Item
            </Link>
            <Link
              href="/admin/sales"
              className="group flex items-center justify-center gap-3 bg-green-50 hover:bg-green-100 text-green-700 px-6 py-4 rounded-xl transition-all font-semibold border border-green-100 hover:border-green-200"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">💰</div>
              Record New Sale
            </Link>
            <Link
              href="/admin/invoices"
              className="group flex items-center justify-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-700 px-6 py-4 rounded-xl transition-all font-semibold border border-blue-100 hover:border-blue-200"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">📄</div>
              View Invoices
            </Link>
          </div>
        </div>

        {/* Recent Sales Table */}
        {recentSales.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
              <Link
                href="/admin/sales"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium hover:underline"
              >
                View All Transactions →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentSales.map((sale) => {
                    const saleProfit = sale.items.reduce((sum, item) => sum + item.profit, 0)
                    return (
                      <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{sale.partyName}</span>
                            <span className="text-xs text-gray-500">{format(new Date(sale.date), 'dd MMM yyyy')} • #{sale.billNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
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
                          <span className="font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                            +₹{saleProfit.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}


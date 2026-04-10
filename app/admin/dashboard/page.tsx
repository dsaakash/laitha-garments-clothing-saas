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
  FileText, Clock, BarChart3, Activity, Factory
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'

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
    lowStock: 0,
    outOfStock: 0,
    totalSuppliers: 0,
  })
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [allSales, setAllSales] = useState<Sale[]>([])
  const [pulseMonth, setPulseMonth] = useState<string>(new Date().getMonth().toString())
  const [pulseYear, setPulseYear] = useState<string>(new Date().getFullYear().toString())
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

        const lowStock = inventory.filter((item: any) => {
          const stock = item.currentStock || 0
          return stock > 0 && stock <= 5
        }).length
        
        const outOfStock = inventory.filter((item: any) => (item.currentStock || 0) === 0).length
        
        const suppliersList = stockValueResult.success && stockValueResult.data.supplierBreakdown 
          ? stockValueResult.data.supplierBreakdown.length 
          : 0

        setStats({
          totalInventory: inventory.length,
          totalSales: sales.length,
          totalRevenue,
          totalProfit,
          thisMonthSales: thisMonthSales.length,
          thisMonthRevenue,
          lowStock,
          outOfStock,
          totalSuppliers: suppliersList,
        })
        setRecentSales(recent)
        setAllSales(sales)
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
              className="font-medium"
              style={{ color: 'var(--accent)' }}
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
      color: 'accent',
      lightBg: 'bg-purple-50',
      lightColor: 'text-purple-600',
      link: '/admin/sales',
      badge: 'Earned',
    },
    {
      title: 'Total Profit',
      value: `₹${stats.totalProfit.toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      lightBg: 'bg-emerald-50',
      lightColor: 'text-emerald-600',
      link: '/admin/sales',
      badge: 'Net',
    },
    {
      title: 'Low Stock',
      value: stats.lowStock,
      icon: Activity,
      color: 'from-amber-500 to-amber-600',
      lightBg: 'bg-amber-50',
      lightColor: 'text-amber-600',
      link: '/admin/inventory?filter=low',
      badge: 'Alert',
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStock,
      icon: Package,
      color: 'from-red-500 to-red-600',
      lightBg: 'bg-red-50',
      lightColor: 'text-red-600',
      link: '/admin/inventory?filter=out',
      badge: 'Critical',
    },
    {
      title: 'Active Suppliers',
      value: stats.totalSuppliers,
      icon: Factory,
      color: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      lightColor: 'text-blue-600',
      link: '/admin/suppliers',
      badge: 'Nodes',
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

  // Revenue Pulse logic
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const years = ['2024', '2025', '2026']

  const getPulseData = () => {
    if (allSales.length === 0) return []

    const selectedYear = parseInt(pulseYear)
    const selectedMonth = pulseMonth === 'all' ? -1 : parseInt(pulseMonth)

    const filtered = allSales.filter(sale => {
      const d = new Date(sale.date)
      if (selectedMonth === -1) {
        return d.getFullYear() === selectedYear
      }
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
    })

    if (selectedMonth === -1) {
      // Group by Month
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: months[i].slice(0, 3),
        amount: 0,
        monthIdx: i
      }))

      filtered.forEach(sale => {
        const d = new Date(sale.date)
        monthlyData[d.getMonth()].amount += sale.totalAmount
      })
      return monthlyData
    } else {
      // Group by Day
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
      const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${i + 1} ${months[selectedMonth].slice(0, 3)}`,
        amount: 0,
        day: i + 1
      }))

      filtered.forEach(sale => {
        const d = new Date(sale.date)
        if (d.getDate() <= daysInMonth) {
          dailyData[d.getDate() - 1].amount += sale.totalAmount
        }
      })
      
      // Filter out days with 0 sales if we want a tighter chart, or leave them for continuity
      // The user screenshot shows specific dates, so let's keep all days for a smooth pulse
      return dailyData
    }
  }

  const pulseData = getPulseData()

  // Calculate Growth
  const calculateGrowth = () => {
    if (allSales.length === 0) return { percent: 0, trend: 'stable' }

    const selectedYear = parseInt(pulseYear)
    const selectedMonth = pulseMonth === 'all' ? -1 : parseInt(pulseMonth)

    let currentTotal = 0
    let prevTotal = 0

    if (selectedMonth === -1) {
      // Yearly growth vs previous year
      currentTotal = allSales
        .filter(s => new Date(s.date).getFullYear() === selectedYear)
        .reduce((sum, s) => sum + s.totalAmount, 0)
      
      prevTotal = allSales
        .filter(s => new Date(s.date).getFullYear() === selectedYear - 1)
        .reduce((sum, s) => sum + s.totalAmount, 0)
    } else {
      // Monthly growth vs previous month
      currentTotal = allSales
        .filter(s => {
          const d = new Date(s.date)
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
        })
        .reduce((sum, s) => sum + s.totalAmount, 0)
      
      const prevDate = new Date(selectedYear, selectedMonth - 1, 1)
      prevTotal = allSales
        .filter(s => {
          const d = new Date(s.date)
          return d.getFullYear() === prevDate.getFullYear() && d.getMonth() === prevDate.getMonth()
        })
        .reduce((sum, s) => sum + s.totalAmount, 0)
    }

    if (prevTotal === 0) return { percent: 100, trend: currentTotal > 0 ? 'up' : 'stable' }
    
    const percent = ((currentTotal - prevTotal) / prevTotal) * 100
    return { 
      percent: Math.abs(Math.round(percent)), 
      trend: percent > 0 ? 'up' : percent < 0 ? 'down' : 'stable' 
    }
  }

  const growth = calculateGrowth()

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

  const currentMonth = format(new Date(), 'MMMM')

  return (
    <AdminLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Command Center Header */}
        <motion.div 
          variants={itemVariants} 
          className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl shadow-slate-200"
          style={{ background: 'var(--sidebar-bg)' }}
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(var(--accent-rgb), 0.2), transparent)' }}></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.1)' }}></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400/80">System Live</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                {getGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}
              </h1>
              <p className="text-slate-400 text-lg font-medium max-w-xl">
                The command center is monitoring your business in real-time. 
                Everything looks stable for {currentMonth}.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 w-full md:w-auto">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-4 rounded-3xl flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Target</p>
                    <p className="text-xl font-black text-white">82.4% Achieved</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/5 border border-white/5 px-4 py-3 rounded-2xl backdrop-blur-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <span className="text-xs font-bold text-slate-300">{format(new Date(), 'EEE, MMM d')}</span>
                  </div>
                  <button 
                    className="p-3 rounded-2xl transition-all shadow-lg"
                    style={{ background: 'var(--accent)', boxShadow: '0 10px 15px -3px rgba(var(--accent-rgb), 0.3)' }}
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
            </div>
          </div>
        </motion.div>

        {/* Trial Warning Banner - Modernized */}
        {trialInfo && trialInfo.isTrial && (
          <motion.div
            variants={itemVariants}
            className={`rounded-[2rem] p-8 border-2 ${trialInfo.daysRemaining <= 3
              ? 'bg-red-50/50 border-red-100'
              : 'bg-amber-50/50 border-amber-100'
              }`}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-lg shadow-opacity-20 ${trialInfo.daysRemaining <= 3 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                {trialInfo.daysRemaining <= 3 ? '🚨' : '⚡'}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-black tracking-tight mb-1 ${trialInfo.daysRemaining <= 3 ? 'text-red-900' : 'text-amber-900'}`}>
                  {trialInfo.daysRemaining === 0 ? "You&apos;re at the limit!" : `Only ${trialInfo.daysRemaining} days left in your trial`}
                </h3>
                <p className="text-slate-600 font-medium">
                  Don&apos;t lose access to your analytics. Upgrade to the <b>Growth Plan</b> to keep the momentum going.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link
                  href="/admin/subscription"
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-slate-900/20"
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stock Value Cards - Top Primary Metrics */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            className="relative overflow-hidden group rounded-[2.5rem] p-8 text-white shadow-2xl transition-all duration-500 hover:-translate-y-1"
            style={{ 
              background: 'linear-gradient(to bottom right, var(--accent), var(--accent-hover))',
              boxShadow: '0 20px 25px -5px rgba(var(--accent-rgb), 0.2)' 
            }}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-blue-100/80 font-black uppercase tracking-[0.2em] text-xs mb-1">Total Retail Value</p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
                  ₹{stockValueData?.totalRetailValue ? stockValueData.totalRetailValue.toLocaleString() : '0'}
                </h2>
              </div>
              <p className="text-blue-100/60 text-sm font-medium">Estimated value if all stock is sold at selling price</p>
            </div>
          </div>

          <div className="relative overflow-hidden group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Package className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs mb-1">Total Stock Value</p>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                  ₹{stockValueData?.totalWholesaleValue ? stockValueData.totalWholesaleValue.toLocaleString() : '0'}
                </h2>
              </div>
              <p className="text-slate-500 text-sm font-medium">Sum of (current stock * wholesale price) across all items</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions - 3 Button Layout */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/inventory" className="p-1 bg-gradient-to-br from-blue-500 to-blue-700 rounded-[2rem] group hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-blue-200">
            <div className="bg-white h-full rounded-[1.8rem] p-6 flex flex-col justify-between overflow-hidden relative">
              <div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                   <Plus className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Add Inventory</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Log new fabric & garment arrivals</p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600">Quick Access</span>
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/admin/sales?action=new" className="p-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] group hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-emerald-200">
            <div className="bg-white h-full rounded-[1.8rem] p-6 flex flex-col justify-between overflow-hidden relative">
              <div>
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Record Sale</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Track high-value transactions</p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Quick Access</span>
                <div className="p-2 bg-emerald-600 rounded-xl text-white">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin/sales" 
            className="p-1 rounded-[2rem] group hover:scale-[1.02] transition-all cursor-pointer shadow-lg"
            style={{ 
              background: 'linear-gradient(to bottom right, var(--accent), var(--accent-hover))',
              boxShadow: '0 10px 15px -3px rgba(var(--accent-rgb), 0.2)'
            }}
          >
            <div className="bg-white h-full rounded-[1.8rem] p-6 flex flex-col justify-between overflow-hidden relative">
              <div>
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)' }}
                >
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">View Invoices</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Manage all sales & billing history</p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Quick Access</span>
                <div className="p-2 rounded-xl text-white" style={{ background: 'var(--accent)' }}>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Charts Section - Wrapped in Premium containers */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Revenue Pulse</h3>
                  {growth.trend !== 'stable' && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      growth.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {growth.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {growth.percent}%
                    </div>
                  )}
                </div>
                <p className="text-slate-400 text-sm font-bold">
                  {pulseMonth === 'all' ? `Growth trend for ${pulseYear}` : `Daily performance in ${months[parseInt(pulseMonth)]}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={pulseMonth}
                  onChange={(e) => setPulseMonth(e.target.value)}
                  className="bg-slate-50 border-none rounded-xl text-xs font-black text-slate-600 px-3 py-2 cursor-pointer focus:ring-2"
                  style={{ '--tw-ring-color': 'rgba(var(--accent-rgb), 0.2)' } as any}
                >
                  <option value="all">All Months</option>
                  {months.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <select 
                  value={pulseYear}
                  onChange={(e) => setPulseYear(e.target.value)}
                  className="bg-slate-50 border-none rounded-xl text-xs font-black text-slate-600 px-3 py-2 cursor-pointer focus:ring-2"
                  style={{ '--tw-ring-color': 'rgba(var(--accent-rgb), 0.2)' } as any}
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="p-2 bg-slate-50 rounded-xl hidden md:block">
                  <BarChart3 className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="h-[350px] w-full">
              {pulseData.some(d => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pulseData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '12px', padding: '16px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="var(--accent)" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorAmount)" 
                      dot={{ fill: '#fff', stroke: 'var(--accent)', strokeWidth: 3, r: 6 }} 
                      activeDot={{ r: 8, strokeWidth: 0, fill: 'var(--accent)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-300">
                  <p className="font-bold underline cursor-pointer hover:text-blue-500">Record sales to unlock charts</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="space-y-1 mb-8">
                  <h3 className="text-2xl font-black tracking-tight">Profit Drivers</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Top Performance Metrics</p>
                </div>
                
                <div className="flex-1 space-y-6">
                   {topProductsChartData.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                         <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-slate-300 truncate pr-4">{item.name}</span>
                            <span className="text-xs font-black text-emerald-400">₹{item.profit.toLocaleString()}</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min(100, (item.profit / stats.totalProfit) * 500)}%` }}
                               className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            />
                         </div>
                      </div>
                   ))}
                   {topProductsChartData.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 opacity-30">
                         <TrendingUp className="w-12 h-12 mb-2" />
                         <p className="text-xs font-bold">No Data Available</p>
                      </div>
                   )}
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                   <div className="flex items-center justify-between">
                      <div>
                         <p className="text-xs font-bold text-slate-500">Net Margin</p>
                         <p className="text-xl font-black text-white">
                           {((stats.totalProfit / stats.totalRevenue) * 100 || 0).toFixed(1)}%
                         </p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-2xl">
                         <Activity className="w-5 h-5 text-emerald-400" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Global Stock Table - Using Step 28 Card Aesthetic */}
        <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
           <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <span className="w-2 h-8 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></span>
                  Active Supplier Nodes
                </h2>
                <p className="text-slate-400 text-sm font-bold mt-1">Real-time inventory distribution network</p>
              </div>
           </div>
           
           <div className="p-6">
              <SupplierStockTable
                data={stockValueData?.supplierBreakdown || []}
                loading={!stockValueData}
              />
           </div>
        </motion.div>

        {/* Recent Transactions - Redesigned to match high-end ERP look */}
        {recentSales.length > 0 && (
          <motion.div variants={itemVariants} className="bg-slate-50 rounded-[2.5rem] p-4">
            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Activity</h2>
                <Link
                  href="/admin/sales"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-2xl transition-all"
                >
                  History
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentSales.map((sale) => {
                      const saleProfit = sale.items.reduce((sum, item) => sum + item.profit, 0)
                      return (
                        <tr key={sale.id} className="hover:bg-slate-50/80 transition-all cursor-default">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black">
                                {sale.partyName.charAt(0).toUpperCase()}
                              </div>
                              <div className="space-y-0.5">
                                <span className="font-black text-slate-900 block">{sale.partyName}</span>
                                <span className="text-xs text-slate-400 font-bold tracking-tight">ID: {sale.billNumber}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                               <Package className="w-4 h-4 text-slate-300" />
                               <span className="text-sm font-bold text-slate-600">
                                 {sale.items.length} Category Component{sale.items.length > 1 ? 's' : ''}
                               </span>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 block mt-1 uppercase tracking-tighter">
                               Processed: {format(new Date(sale.date), 'MMM dd, h:mm a')}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className="text-lg font-black text-slate-900 block">₹{sale.totalAmount.toLocaleString()}</span>
                            <span className="text-xs font-bold text-emerald-500">+{((saleProfit / sale.totalAmount) * 100).toFixed(0)}% Margin</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <StatusBadge status="Settled" variant="success" size="lg" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
        {/* Secondary Metrics Grid - Relocated from Top */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {statCards.map((card, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div 
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.color === 'accent' ? '' : card.lightBg}`}
                style={card.color === 'accent' ? { backgroundColor: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)' } : {}}
              >
                <card.icon className={`w-5 h-5 ${card.color === 'accent' ? '' : card.lightColor}`} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{card.title}</p>
              <h5 className="text-xl font-black text-slate-900 tracking-tight">{card.value}</h5>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </AdminLayout>
  )
}


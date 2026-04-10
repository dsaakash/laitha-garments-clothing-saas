'use client'

import { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  MoreHorizontal, 
  Search, 
  Plus, 
  Clock,
  AlertCircle,
  ArrowRight,
  Filter
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'

interface ShopOrder {
  id: string
  title: string
  subTitle: string
  status: 'Planned' | 'Released' | 'Reserved' | 'Issued' | 'Completed'
  progress: number
  totalUnits: number
  completedUnits: number
  reserved: number
  issued: number
  received: number
  date: string
}

const dummyOrders: ShopOrder[] = [
  {
    id: 'SO-2024-8921',
    title: 'Precision Gear Assembly',
    subTitle: 'Structure: A1-Standard-V2',
    status: 'Issued',
    progress: 75,
    totalUnits: 1000,
    completedUnits: 750,
    reserved: 1200,
    issued: 1200,
    received: 750,
    date: '2024-03-25'
  },
  {
    id: 'SO-2024-8922',
    title: 'Control Module X1',
    subTitle: 'Structure: B3-Delta-Series',
    status: 'Released',
    progress: 24,
    totalUnits: 500,
    completedUnits: 120,
    reserved: 600,
    issued: 120,
    received: 0,
    date: '2024-03-26'
  },
  {
    id: 'SO-2024-8923',
    title: 'Hydraulic Piston Set',
    subTitle: 'Structure: H-Flow-Core',
    status: 'Planned',
    progress: 0,
    totalUnits: 250,
    completedUnits: 0,
    reserved: 300,
    issued: 0,
    received: 0,
    date: '2024-03-27'
  },
  {
    id: 'SO-2024-8924',
    title: 'Sensor Grid Array',
    subTitle: 'Structure: S-Matrix-V1',
    status: 'Completed',
    progress: 100,
    totalUnits: 2000,
    completedUnits: 2000,
    reserved: 2200,
    issued: 2200,
    received: 2000,
    date: '2024-03-20'
  }
]

export default function ManufacturingPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filters = ['All', 'Planned', 'Released', 'Reserved', 'Issued', 'Completed']

  const filteredOrders = dummyOrders.filter(order => {
    const matchesFilter = activeFilter === 'All' || order.status === activeFilter
    const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         order.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 -mt-2">
        {/* Sticky Header - Mockup Style */}
        <div className="flex items-center justify-between py-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm bg-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Shop Orders</h1>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm bg-white">
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search & Tool Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, products..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors border-none text-sm font-medium">
            <Filter className="w-4 h-4" />
            <span className="md:hidden lg:inline">Filters</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeFilter === filter 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent border'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Orders List Container */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Active Orders ({filteredOrders.length})
            </h2>
            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
              Step 28 of 32
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={order.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all group cursor-pointer"
              >
                <div className="p-6 space-y-6">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-blue-600 tracking-wider">
                        {order.id}
                      </p>
                      <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-700 transition-all">
                        {order.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium tracking-tight">
                        {order.subTitle}
                      </p>
                    </div>
                    <StatusBadge 
                      status={order.status} 
                      variant={
                        order.status === 'Completed' ? 'success' : 
                        order.status === 'Issued' ? 'info' : 
                        order.status === 'Released' ? 'warning' : 'default'
                      }
                      size="md"
                    />
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-slate-500">Production Progress</span>
                      <span className="text-xs font-black text-slate-900">
                        {order.completedUnits.toLocaleString()} / {order.totalUnits.toLocaleString()} units
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${order.progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full ${
                          order.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-600'
                        } rounded-full`}
                      ></motion.div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Reserved</p>
                      <p className="text-base font-extrabold text-slate-900">{order.reserved.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Issued</p>
                      <p className="text-base font-extrabold text-slate-900">{order.issued.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Received</p>
                      <p className="text-base font-extrabold text-slate-900">{order.received.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 tracking-tight">Started: {order.date}</span>
                  </div>
                  <button className="text-xs font-black text-blue-600 flex items-center gap-1.5 hover:gap-2.5 transition-all">
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="text-slate-900 font-bold">No orders found</p>
              <p className="text-slate-500 text-sm">Try adjusting your filters or search query.</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-10 right-10 w-16 h-16 bg-blue-600 rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center text-white hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all z-50 group">
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
      </button>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </AdminLayout>
  )
}

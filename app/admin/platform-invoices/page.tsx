'use client'

import AdminLayout from '@/components/AdminLayout'
import SubscriptionInvoices from '@/components/SubscriptionInvoices'
import { FileText, Shield } from 'lucide-react'

export default function PlatformInvoicesPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">
              <Shield className="w-3 h-3" />
              Superadmin Intelligence
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Platform <span className="text-slate-400">Invoices</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium max-w-2xl">
              Monitor all incoming platform subscription payments and download invoices for all tenants.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.03)] border border-slate-100">
          <SubscriptionInvoices isAdmin={true} />
        </div>
      </div>
    </AdminLayout>
  )
}

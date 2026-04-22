'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Invoice {
  id: number
  plan_id: string
  amount: number
  currency: string
  billing_cycle: string
  razorpay_payment_id: string
  status: string
  created_at: string
  business_name?: string // Only for superadmin
}

export default function SubscriptionInvoices({ isAdmin = false }: { isAdmin?: boolean }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invoices')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInvoices(data.data)
        }
      })
      .catch(err => console.error('Error fetching invoices:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-slate-100 rounded-2xl w-full"></div>
      ))}
    </div>
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No invoices found yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-3">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">
              <th className="pb-2 pl-4">Invoice Details</th>
              {isAdmin && <th className="pb-2">Business</th>}
              <th className="pb-2">Date</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Status</th>
              <th className="pb-2 text-right pr-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="bg-white hover:bg-slate-50 transition-colors group">
                <td className="py-4 pl-4 rounded-l-2xl border-y border-l border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 capitalize">{invoice.plan_id} Plan</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                        {invoice.razorpay_payment_id || 'ID: INV-' + invoice.id}
                      </p>
                    </div>
                  </div>
                </td>
                {isAdmin && (
                  <td className="py-4 border-y border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{invoice.business_name || 'Unknown'}</p>
                  </td>
                )}
                <td className="py-4 border-y border-slate-100">
                  <p className="text-sm font-medium text-slate-600">
                    {format(new Date(invoice.created_at), 'dd MMM yyyy')}
                  </p>
                </td>
                <td className="py-4 border-y border-slate-100">
                  <p className="text-sm font-black text-slate-900">
                    {invoice.currency === 'INR' ? '₹' : invoice.currency} {Number(invoice.amount).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 capitalize">{invoice.billing_cycle}</p>
                </td>
                <td className="py-4 border-y border-slate-100">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tight">
                    <CheckCircle2 className="w-3 h-3" />
                    Paid
                  </span>
                </td>
                <td className="py-4 pr-4 rounded-r-2xl border-y border-r border-slate-100 text-right">
                  <button 
                    onClick={() => window.print()}
                    className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                    title="Print Invoice"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { Package, TrendingUp } from 'lucide-react'

interface SupplierStockData {
    supplierName: string
    totalWholesaleValue: number
    totalItems: number
}

interface SupplierStockTableProps {
    data: SupplierStockData[]
    loading: boolean
}

export default function SupplierStockTable({ data, loading }: SupplierStockTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="h-6 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="p-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between mb-4 animate-pulse">
                            <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                            <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                            <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">Supplier Stock Value</h3>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {data?.length || 0} Suppliers
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-3 font-medium">Supplier Name</th>
                            <th className="px-6 py-3 font-medium text-center">Items In Stock</th>
                            <th className="px-6 py-3 font-medium text-right">Value (Wholesale)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data && data.length > 0 ? (
                            data.map((supplier, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {supplier.supplierName}
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-600">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                            {supplier.totalItems}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                                        {formatCurrency(supplier.totalWholesaleValue)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                    No supplier stock data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

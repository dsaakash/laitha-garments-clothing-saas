'use client'

import { Banknote, TrendingUp, Package } from 'lucide-react'

interface StockValueData {
    totalRetailValue: number
    totalWholesaleValue: number
}

interface StockValueCardsProps {
    data: StockValueData | null
    loading: boolean
}

export default function StockValueCards({ data, loading }: StockValueCardsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                        <div className="h-4 w-1/3 bg-gray-200 rounded mb-4"></div>
                        <div className="h-8 w-2/3 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Retail Value Card */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Banknote className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-purple-100 font-medium text-sm">Total Retail Value</h3>
                    </div>
                    <div className="mt-2">
                        <h2 className="text-3xl font-bold tracking-tight">
                            {data ? formatCurrency(data.totalRetailValue) : '₹0'}
                        </h2>
                        <p className="text-purple-200 text-xs mt-1">
                            Potential revenue from current stock (Selling Price)
                        </p>
                    </div>
                </div>
            </div>

            {/* Wholesale Value Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:border-blue-200 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Package className="w-24 h-24 text-blue-500" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-gray-500 font-medium text-sm">Total Stock Value</h3>
                    </div>
                    <div className="mt-2">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                            {data ? formatCurrency(data.totalWholesaleValue) : '₹0'}
                        </h2>
                        <p className="text-gray-400 text-xs mt-1">
                            Invested capital in current stock (Wholesale Price)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

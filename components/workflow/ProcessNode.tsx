'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'

interface ProcessNodeData {
    label: string
    icon: string
    count: number
    route: string
}

function ProcessNode({ data }: NodeProps<ProcessNodeData>) {
    const router = useRouter()

    const handleClick = () => {
        if (data.route) {
            router.push(data.route)
        }
    }

    return (
        <div className="relative group">
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-purple-500"
            />

            {/* Node Content */}
            <div
                onClick={handleClick}
                className="px-6 py-4 bg-white border-2 border-gray-300 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer hover:border-purple-500 min-w-[180px]"
            >
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{data.icon}</span>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-sm">{data.label}</h3>
                        <p className="text-xs text-gray-500">{data.count} items</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-purple-500"
            />
        </div>
    )
}

export default memo(ProcessNode)

import AdminLayout from '@/components/AdminLayout'
import AIChatSetup from '@/components/AIChatSetup'

export default function BusinessAIPage() {
    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Business Setup</h1>
                    <p className="text-gray-600">
                        Let our AI assistant help you set up your business profile automatically through a natural conversation.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                    <p className="text-blue-800 text-sm">
                        <strong>Beta Feature:</strong> This is a new AI-powered setup flow we are testing.
                        <a href="/admin/business" className="ml-2 underline font-medium hover:text-blue-900">
                            Prefer the manual form? Click here.
                        </a>
                    </p>
                </div>

                <AIChatSetup />
            </div>
        </AdminLayout>
    )
}

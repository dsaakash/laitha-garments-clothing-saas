export interface ModuleDefinition {
    id: string;
    label: string;
    description?: string;
}

export const AVAILABLE_MODULES: ModuleDefinition[] = [
    { id: 'ai_setup_assistant', label: 'AI Setup Assistant (Groq)' },
    { id: 'pos', label: 'POS System' },
    { id: 'inventory', label: 'Inventory Management' },
    { id: 'products', label: 'Products' },
    { id: 'catalogues', label: 'Catalogues' },
    { id: 'purchases', label: 'Purchase Orders' },
    { id: 'sales', label: 'Sales & Billing' },
    { id: 'invoices', label: 'Invoicing' },
    { id: 'customers', label: 'CRM / Customers' },
    { id: 'enquiries', label: 'Customer Enquiries' },
    { id: 'suppliers', label: 'Supplier Management' },
    { id: 'workflow', label: 'Workflow Engine' },
    { id: 'website', label: 'Website Builder' },
    { id: 'accounting', label: 'Accounting' },
    { id: 'research', label: 'Raw Research' },
    { id: 'setup', label: 'Setup Wizard' },
    { id: 'business', label: 'Business Profile' },
    { id: 'admins', label: 'Admin Management' },
    { id: 'roles', label: 'Roles & Permissions' },
    { id: 'whatsapp_community', label: 'WhatsApp Community' },
    { id: 'ai-purchase-order', label: 'AI Purchase Order Agent' },
    { id: 'razorpay_gateway', label: 'Razorpay Payment Gateway' },
];

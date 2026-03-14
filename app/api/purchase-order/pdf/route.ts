import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { decodeBase64 } from '@/lib/utils'
import { getTenantContext } from '@/lib/tenant-context'

// Generate PDF for purchase order
export async function POST(request: NextRequest) {
    try {
        const session = request.cookies.get('admin_session')
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { order } = await request.json()

        if (!order) {
            return NextResponse.json({ success: false, message: 'Order data required' }, { status: 400 })
        }

        // Get tenant context
        const { tenantId, isTenant } = getTenantContext(request)

        // Fetch business profile for letterhead
        // If tenant, try to get tenant-specific profile first, otherwise fall back to main profile
        let businessResult
        if (isTenant && tenantId) {
            businessResult = await query(`
                SELECT * FROM business_profile 
                WHERE tenant_id = $1 
                ORDER BY id DESC LIMIT 1
            `, [tenantId])
        }
        
        // If no tenant profile found, or not a tenant, use main business profile
        if (!businessResult || businessResult.rows.length === 0) {
            businessResult = await query(`
                SELECT * FROM business_profile 
                WHERE tenant_id IS NULL 
                ORDER BY CASE WHEN LOWER(business_name) LIKE '%lalitha%' THEN 0 ELSE 1 END, 
                id DESC LIMIT 1
            `)
        }
        
        const business = businessResult.rows[0] || {}

        // Generate HTML content for PDF
        const htmlContent = generatePurchaseOrderHTML(order, business)

        // Call external PDF generation service or use Puppeteer
        // For now, we'll return HTML that can be printed to PDF by the browser
        return NextResponse.json({
            success: true,
            html: htmlContent,
            order: order
        })
    } catch (error) {
        console.error('PDF generation error:', error)
        return NextResponse.json({ success: false, message: 'Failed to generate PDF' }, { status: 500 })
    }
}

function generatePurchaseOrderHTML(order: any, business: any) {
    const poNumber = order.customPoNumber || `PO-${order.id}`
    const date = new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    
    // Calculate totals
    const subtotal = order.subtotal || order.totalAmount || 0
    const gstAmount = order.gstAmount || 0
    const transportCharges = order.transportCharges || 0
    const grandTotal = order.grandTotal || (subtotal + gstAmount + transportCharges)

    // Build items table rows
    let itemsRows = ''
    if (order.items && order.items.length > 0) {
        itemsRows = order.items.map((item: any, index: number) => `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 12px; text-align: center;">${index + 1}</td>
                <td style="padding: 12px;">${item.productName}</td>
                <td style="padding: 12px;">${item.category || '-'}</td>
                <td style="padding: 12px;">${Array.isArray(item.sizes) ? item.sizes.join(', ') : '-'}</td>
                <td style="padding: 12px;">${item.fabricType || '-'}</td>
                <td style="padding: 12px; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right;">₹${item.pricePerPiece?.toLocaleString()}</td>
                <td style="padding: 12px; text-align: right;">₹${item.totalAmount?.toLocaleString()}</td>
            </tr>
        `).join('')
    } else {
        // Legacy single item
        itemsRows = `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 12px; text-align: center;">1</td>
                <td style="padding: 12px;">${order.productName || '-'}</td>
                <td style="padding: 12px;">-</td>
                <td style="padding: 12px;">${Array.isArray(order.sizes) ? order.sizes.join(', ') : '-'}</td>
                <td style="padding: 12px;">${order.fabricType || '-'}</td>
                <td style="padding: 12px; text-align: center;">${order.quantity || 0}</td>
                <td style="padding: 12px; text-align: right;">₹${order.pricePerPiece?.toLocaleString()}</td>
                <td style="padding: 12px; text-align: right;">₹${order.totalAmount?.toLocaleString()}</td>
            </tr>
        `
    }

    // Invoice image section
    let invoiceSection = ''
    if (order.invoiceImage) {
        invoiceSection = `
            <div style="margin-top: 30px; page-break-before: always;">
                <h3 style="color: #7c3aed; margin-bottom: 15px;">Invoice Image</h3>
                <img src="${order.invoiceImage}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;" />
            </div>
        `
    }

    // Product images section
    let productImagesSection = ''
    const allProductImages: string[] = []
    if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
            if (item.productImages && item.productImages.length > 0) {
                allProductImages.push(...item.productImages)
            }
        })
    } else if (order.productImage) {
        allProductImages.push(order.productImage)
    }

    if (allProductImages.length > 0) {
        const imagesHtml = allProductImages.map((img: string) => `
            <img src="${img}" style="width: 200px; height: 200px; object-fit: cover; border: 1px solid #ddd; border-radius: 8px; margin: 5px;" />
        `).join('')
        
        productImagesSection = `
            <div style="margin-top: 30px; ${!order.invoiceImage ? 'page-break-before: always;' : ''}">
                <h3 style="color: #7c3aed; margin-bottom: 15px;">Product Images</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    ${imagesHtml}
                </div>
            </div>
        `
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Purchase Order ${poNumber}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; }
        .header h1 { color: #7c3aed; margin: 0; font-size: 28px; }
        .header p { margin: 5px 0; color: #666; }
        .po-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .po-details .left, .po-details .right { flex: 1; }
        .po-details .right { text-align: right; }
        .section { margin-bottom: 20px; }
        .section h3 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background-color: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #7c3aed; }
        .totals { margin-top: 20px; background: #f9fafb; padding: 20px; border-radius: 8px; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .totals-row.grand-total { font-size: 20px; font-weight: bold; color: #7c3aed; border-top: 2px solid #7c3aed; margin-top: 10px; padding-top: 10px; }
        .notes { margin-top: 30px; padding: 15px; background: #f9fafb; border-left: 4px solid #7c3aed; border-radius: 4px; }
        @media print { body { padding: 0; } .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>${business.business_name || 'Lalitha Garments'}</h1>
        <p>${business.address || ''}</p>
        <p>Phone: ${business.phone || 'N/A'} | Email: ${business.email || 'N/A'}</p>
        ${business.gst_number ? `<p>GST: ${business.gst_number}</p>` : ''}
    </div>

    <div class="po-details">
        <div class="left">
            <h2 style="color: #7c3aed; margin: 0;">PURCHASE ORDER</h2>
            <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${poNumber}</p>
        </div>
        <div class="right">
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Status:</strong> ${order.status || 'Pending'}</p>
        </div>
    </div>

    <div class="section">
        <h3>Supplier Information</h3>
        <p><strong>${order.supplierName}</strong></p>
    </div>

    <div class="section">
        <h3>Order Details</h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 25%;">Product</th>
                    <th style="width: 15%;">Category</th>
                    <th style="width: 15%;">Sizes</th>
                    <th style="width: 10%;">Fabric</th>
                    <th style="width: 8%;">Qty</th>
                    <th style="width: 12%;">Price (₹)</th>
                    <th style="width: 12%;">Total (₹)</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
        </table>
    </div>

    <div class="totals">
        <div class="totals-row">
            <span>Subtotal:</span>
            <span>₹${subtotal.toLocaleString()}</span>
        </div>
        ${gstAmount > 0 ? `
        <div class="totals-row">
            <span>GST ${order.gstType === 'percentage' && order.gstPercentage ? `(${order.gstPercentage}%)` : ''}:</span>
            <span>₹${gstAmount.toLocaleString()}</span>
        </div>
        ` : ''}
        ${transportCharges > 0 ? `
        <div class="totals-row">
            <span>Transport Charges:</span>
            <span>₹${transportCharges.toLocaleString()}</span>
        </div>
        ` : ''}
        <div class="totals-row grand-total">
            <span>Grand Total:</span>
            <span>₹${grandTotal.toLocaleString()}</span>
        </div>
    </div>

    ${order.notes ? `
    <div class="notes">
        <strong>Notes:</strong><br/>
        ${order.notes}
    </div>
    ` : ''}

    ${invoiceSection}
    ${productImagesSection}

    <div style="margin-top: 40px; text-align: center; color: #999; font-size: 12px;">
        <p>This is a computer-generated document. No signature required.</p>
        <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
    </div>

    <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 12px 30px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
            Print / Save as PDF
        </button>
    </div>
</body>
</html>
    `.trim()
}

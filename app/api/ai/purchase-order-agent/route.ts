import { NextRequest, NextResponse } from 'next/server'
import { createGroqChatCompletion, isGroqConfigured } from '@/lib/groq'
import { getTenantContext } from '@/lib/tenant-context'
import { getTenantById } from '@/lib/db-tenants'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    if (!isGroqConfigured()) {
      return NextResponse.json(
        { success: false, message: 'AI features are not configured on this server.' },
        { status: 500 }
      )
    }

    const context = getTenantContext(request)
    
    // Role-Based Access Control
    // Allow SuperAdmin OR Tenant Admin with ai-purchase-order module
    let hasAccess = false
    if (context.isSuperAdmin) {
      hasAccess = true
    } else if (context.isTenant || context.isAdmin) {
      if (context.tenantId) {
        const tenant = await getTenantById(context.tenantId)
        if (tenant && tenant.modules && tenant.modules.includes('ai-purchase-order')) {
          hasAccess = true
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: 'You do not have access to the AI Purchase Order Agent.' },
        { status: 403 }
      )
    }

    const { messages, suppliers: clientSuppliers } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, message: 'Invalid messages format.' },
        { status: 400 }
      )
    }

    // Fetch existing suppliers from the database to pass to the AI for deduplication
    let existingSuppliers: { id: string; name: string; phone: string }[] = clientSuppliers || []
    try {
      const tenantId = context.tenantId
      let suppliersQuery = 'SELECT id, name, phone FROM suppliers'
      const params: any[] = []
      if (tenantId) {
        suppliersQuery += ' WHERE tenant_id = $1'
        params.push(tenantId)
      } else {
        suppliersQuery += ' WHERE tenant_id IS NULL'
      }
      suppliersQuery += ' ORDER BY name ASC'
      const supplierResult = await query(suppliersQuery, params)
      existingSuppliers = supplierResult.rows || []
    } catch (err) {
      console.warn('Could not fetch suppliers for AI context:', err)
    }

    const supplierListText = existingSuppliers.length > 0
      ? `EXISTING SUPPLIERS IN SYSTEM:\n${existingSuppliers.map(s => `- "${s.name}" (ID: ${s.id}, Phone: ${s.phone || 'N/A'})`).join('\n')}`
      : 'No suppliers exist in the system yet.'

    const systemPrompt = `You are a professional Purchase Order (PO) Agent for Lalitha Garments. 
Your goal is to help the user create a purchase order step-by-step by collecting necessary information.

${supplierListText}

FOLLOW THESE STEPS STRICTLY:

STEP 1 - SUPPLIER IDENTIFICATION:
- Ask user for the supplier name.
- Check the EXISTING SUPPLIERS list above CAREFULLY (case-insensitive match).
- If the supplier EXISTS: Confirm it with the user e.g. "I found 'ABC Textiles' in your system. Using that supplier." Set isNewSupplier=false.
- If the supplier DOES NOT EXIST: Tell the user "This is a new supplier. Please provide their phone number." Set isNewSupplier=true.
- NEVER create a duplicate supplier if one already exists with the same (or very similar) name.

STEP 2 - COLLECT ITEMS:
- Ask for product name, category, sizes (e.g., S/M/L/XL), fabric type, quantity, and price per piece.
- Support multiple items. After each item ask "Would you like to add another item?"
- Auto-calculate totalAmount = quantity × pricePerPiece for each item.

STEP 3 - IMAGES:
- Remind the user: "You can upload product images or invoice photos using the 📎 image button in the chat."

STEP 4 - LOGISTICS & GST (ask only if not already provided):
- Ask: "Are there any transport/logistics charges?"
- Ask: "Is GST applicable? If yes, is it a percentage (e.g. 5%) or a fixed rupee amount?"

STEP 5 - FINANCIAL SUMMARY:
Once all info is gathered, present a clear summary:
  📦 Supplier: [name]
  🛍️ Items:
    - [Product]: [Qty] pcs × ₹[Price] = ₹[Total]
    (repeat for each item)
  ─────────────────────
  Subtotal:         ₹[X]
  GST ([type]):     ₹[X]
  Transport:        ₹[X]
  ═════════════════════
  GRAND TOTAL:      ₹[X]

STEP 6 - FINAL CONFIRMATION:
Ask: "Is this correct? Ready to submit the Purchase Order?"

STEP 7 - INVENTORY PRICING (AFTER PO CONFIRMATION):
After the user confirms the PO (and AFTER you output the PO_JSON), ask:
"✅ Purchase Order saved! Would you like to add these items to inventory with selling prices?"

If the user says YES:
- Ask: "What markup would you like to apply to calculate the selling price?"
- Offer these options: 1.25x, 1.5x, 1.75x, 2x, 2.5x, 3x, 4x, or custom
- Example: "For a 2x markup, if purchase price is ₹200, selling price = ₹400."
- Once they choose a multiplier, calculate selling prices for EACH item:
  sellingPrice = pricePerPiece × multiplier (rounded to nearest rupee)
- Show the calculated selling prices and ask for final confirmation.
- Then output INVENTORY_JSON with the selling prices.

If the user says NO: Just say "No problem! You can always update selling prices in Inventory later."

JSON OUTPUT RULES:

1. PO_JSON — Output when user confirms the PO:
<PO_JSON>
{
  "date": "YYYY-MM-DD",
  "supplierName": "...",
  "isNewSupplier": true/false,
  "supplierPhone": "...",
  "items": [
    {
      "productName": "...",
      "category": "...",
      "sizes": ["S", "M"],
      "fabricType": "...",
      "quantity": 0,
      "pricePerPiece": 0,
      "totalAmount": 0
    }
  ],
  "gstType": "percentage",
  "gstPercentage": 0,
  "gstAmountRupees": 0,
  "transportCharges": 0,
  "notes": ""
}
</PO_JSON>

2. INVENTORY_JSON — Output when user confirms inventory pricing:
<INVENTORY_JSON>
{
  "markup": 2,
  "items": [
    {
      "productName": "...",
      "pricePerPiece": 0,
      "sellingPrice": 0
    }
  ]
}
</INVENTORY_JSON>

Keep your tone professional, helpful, and concise. Use emojis sparingly for clarity.`

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

    const response = await createGroqChatCompletion({
      messages: groqMessages,
      temperature: 0.2,
      maxTokens: 2500,
    })

    return NextResponse.json({
      success: true,
      data: {
        content: response
      }
    })
  } catch (error: any) {
    console.error('AI Purchase Order Agent Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process AI request', error: error?.message },
      { status: 500 }
    )
  }
}

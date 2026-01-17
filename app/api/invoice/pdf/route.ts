import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'

// Extend jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable?: {
      finalY: number
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sale, businessProfile: providedBusinessProfile } = await request.json()

    if (!sale) {
      return NextResponse.json(
        { error: 'Missing sale data' },
        { status: 400 }
      )
    }

    // ALWAYS fetch the latest business profile from database to ensure it's up to date
    // This ensures any changes to business profile are immediately reflected in all invoices
    const { query } = await import('@/lib/db')
    let businessProfile = providedBusinessProfile
    
    try {
      const businessResult = await query(
        'SELECT * FROM business_profile ORDER BY id DESC LIMIT 1'
      )
      
      if (businessResult.rows.length > 0) {
        const profile = businessResult.rows[0]
        businessProfile = {
          businessName: profile.business_name || 'Business Name',
          ownerName: profile.owner_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          gstNumber: profile.gst_number || '',
          whatsappNumber: profile.whatsapp_number || '',
        }
        console.log('✅ Using latest business profile from database')
      } else if (!businessProfile) {
        // Use default values if no business profile exists
        businessProfile = {
          businessName: 'Business Name',
          ownerName: '',
          email: '',
          phone: '',
          address: '',
          gstNumber: '',
          whatsappNumber: '',
        }
        console.log('⚠️ No business profile found, using defaults')
      } else {
        // Use provided profile if database has none
        console.log('⚠️ No business profile in database, using provided profile')
      }
    } catch (fetchError) {
      console.warn('⚠️ Failed to fetch business profile, using provided or defaults:', fetchError)
      // Use provided profile or defaults
      if (!businessProfile) {
        businessProfile = {
          businessName: 'Business Name',
          ownerName: '',
          email: '',
          phone: '',
          address: '',
          gstNumber: '',
          whatsappNumber: '',
        }
      }
    }

    // Debug: Log sale structure
    console.log('Sale received:', {
      id: sale.id,
      billNumber: sale.billNumber,
      itemsCount: sale.items ? sale.items.length : 0,
      items: sale.items ? sale.items.map((item: any) => ({
        dressName: item.dressName || item.dress_name,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice || item.selling_price
      })) : []
    })

    const doc = new jsPDF()
    
    // Header - Always use the latest business profile from database
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(businessProfile.businessName || 'Business Name', 14, 20)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    let yPos = 28
    
    // Only show address if provided
    if (businessProfile.address) {
    doc.text(businessProfile.address, 14, yPos)
    yPos += 6
    }
    
    // Only show contact info if provided
    const contactInfo = []
    if (businessProfile.phone) contactInfo.push(`Phone: ${businessProfile.phone}`)
    if (businessProfile.email) contactInfo.push(`Email: ${businessProfile.email}`)
    if (contactInfo.length > 0) {
      doc.text(contactInfo.join(' | '), 14, yPos)
      yPos += 6
    }
    
    // Only show GST if provided
    if (businessProfile.gstNumber) {
      doc.text(`GST: ${businessProfile.gstNumber}`, 14, yPos)
      yPos += 6
    }

    // Invoice Details
    yPos += 12
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', 14, yPos)
    
    yPos += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    doc.text(`Bill Number: ${sale.billNumber}`, 14, yPos)
    yPos += 6
    doc.text(`Date: ${format(new Date(sale.date), 'dd MMM yyyy')}`, 14, yPos)
    yPos += 6
    doc.text(`Party Name: ${sale.partyName}`, 14, yPos)

    // Helper function to calculate text width and wrap accordingly - optimized for codes and readability
    const wrapTextForCell = (text: string, maxChars: number): string => {
      if (!text) return ''
      if (text.length <= maxChars) return text
      
      // For codes, prefer breaking at underscores, dashes, slashes, parentheses
      // For regular text, prefer breaking at spaces
      const breakPoints = ['_', '-', '/', '(', ')', ' ', '.']
      let result = ''
      let remaining = text
      
      while (remaining.length > 0) {
        if (remaining.length <= maxChars) {
          result += (result ? '\n' : '') + remaining
          break
        }
        
        // Find a good break point - search backwards from maxChars
        let breakIndex = maxChars
        let found = false
        // Search backwards from maxChars up to 10 characters back for better wrapping
        // This ensures we find break points even in long codes
        for (let i = maxChars; i > maxChars - 10 && i > 0; i--) {
          if (breakPoints.includes(remaining[i])) {
            breakIndex = i + 1
            found = true
            break
          }
        }
        
        // If no break point found, force break at maxChars (hard break)
        // This ensures long codes without break points still wrap
        if (!found) {
          breakIndex = maxChars
        }
        
        result += (result ? '\n' : '') + remaining.substring(0, breakIndex)
        remaining = remaining.substring(breakIndex).trim()
      }
      
      return result
    }

    // Validate that sale has items
    if (!sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
      console.error('No items found in sale:', JSON.stringify(sale, null, 2))
      return NextResponse.json(
        { error: 'Sale has no items' },
        { status: 400 }
      )
    }

    console.log(`Generating PDF for sale ${sale.billNumber} with ${sale.items.length} items`)

    // Helper function to fetch dress_code from inventory if missing
    // Note: query is already imported above for business profile fetch
    
    // Table data - pre-wrap long codes and dress names BEFORE passing to autoTable
    // Use consistent template: Item, Type, Code, Size, Qty, Price (Total column removed)
    // IMPORTANT: dress_code is ALWAYS displayed in invoices - it's fetched from inventory if missing
    const tableDataPromises = sale.items.map(async (item: any, index: number) => {
      // Try multiple field name variations to ensure we get the dress_code
      let dressName = item.dressName || item.dress_name || ''
      let dressCode = item.dressCode || item.dress_code || item.code || ''
      const dressType = item.dressType || item.dress_type || ''
      const size = item.size || ''
      const quantity = item.quantity || 0
      const sellingPrice = item.sellingPrice || item.selling_price || 0
      const inventoryId = item.inventoryId || item.inventory_id
      
      // CRITICAL: ALWAYS fetch the latest dress_code from inventory to ensure accuracy
      // This ensures we always show the current dress_code, even if sale_items has an old value
      if (inventoryId) {
        try {
          const inventoryResult = await query(
            'SELECT dress_code, dress_name FROM inventory WHERE id = $1',
            [parseInt(inventoryId)]
          )
          if (inventoryResult.rows.length > 0) {
            // ALWAYS use the latest dress_code from inventory (it's the source of truth)
            if (inventoryResult.rows[0].dress_code) {
              dressCode = inventoryResult.rows[0].dress_code
              console.log(`✅ Using latest dress_code from inventory ${inventoryId} for item ${index + 1}: ${dressCode}`)
            }
            // Also update dressName if it's missing
            if (!dressName && inventoryResult.rows[0].dress_name) {
              dressName = inventoryResult.rows[0].dress_name
            }
          }
        } catch (fetchError) {
          console.warn(`⚠️ Failed to fetch dress_code from inventory ${inventoryId}:`, fetchError)
          // Fallback to item data if fetch fails
          if (!dressCode || dressCode.trim() === '') {
            dressCode = item.dressCode || item.dress_code || item.code || ''
          }
        }
      }
      
      // Strategy 2: If still empty and we have dressName but no inventoryId, try to find by dress_name
      if ((!dressCode || dressCode.trim() === '') && dressName && !inventoryId) {
        try {
          const inventoryResult = await query(
            'SELECT dress_code FROM inventory WHERE dress_name = $1 AND dress_code IS NOT NULL AND dress_code != \'\' LIMIT 1',
            [dressName]
          )
          if (inventoryResult.rows.length > 0 && inventoryResult.rows[0].dress_code) {
            dressCode = inventoryResult.rows[0].dress_code
            console.log(`✅ Fetched dress_code by dress_name "${dressName}" for item ${index + 1}: ${dressCode}`)
          }
        } catch (fetchError) {
          console.warn(`⚠️ Failed to fetch dress_code by dress_name:`, fetchError)
        }
      }
      
      // Strategy 3: If still empty, try to extract from item data (check all possible fields)
      if (!dressCode || dressCode.trim() === '') {
        // Try all possible field variations
        dressCode = item.dressCode || item.dress_code || item.code || ''
        // Try nested objects
        if (!dressCode && item.inventory) {
          dressCode = item.inventory.dressCode || item.inventory.dress_code || ''
        }
      }
      
      // Debug logging for first item
      if (index === 0) {
        console.log('📋 First item data:', {
          dressName,
          dressCode,
          dressType,
          size,
          quantity,
          sellingPrice,
          inventoryId,
          rawItem: item
        })
      }
      
      // Final check: If dressCode is STILL empty after all strategies, use a generated code
      if (!dressCode || dressCode.trim() === '') {
        // Generate a code from available data as last resort
        if (dressName) {
          // Create a code from dress name (first 3 words, uppercase, replace spaces with underscores)
          const nameParts = dressName.trim().split(/\s+/).slice(0, 3)
          dressCode = nameParts.map((p: string) => p.toUpperCase().replace(/[^A-Z0-9]/g, '_')).join('_')
          console.warn(`⚠️ Generated dress_code from dress_name for item ${index + 1}: ${dressCode}`)
        } else {
          dressCode = `ITEM_${index + 1}`
          console.warn(`⚠️ Using fallback dress_code for item ${index + 1}: ${dressCode}`)
        }
      }
      
      // Pre-wrap code at 20 characters per line (very aggressive wrapping for long codes)
      // This ensures full codes are visible even if they wrap to multiple lines
      // Example: "SAREE_MUL_COTTON_(MOU/22/1-3/26)_COTTON_GEN" will wrap properly
      const wrappedCode = dressCode.length > 20 ? wrapTextForCell(dressCode, 20) : dressCode
      // Pre-wrap dress name at 40 characters per line (ensures full item names like "SAREE MUL COTTON (MOU/22/1-3/26)" are visible)
      const wrappedDressName = dressName.length > 40 ? wrapTextForCell(dressName, 40) : dressName
      
      // Use "Rs." prefix for better font compatibility (₹ symbol may not render correctly)
      const priceText = `Rs. ${sellingPrice.toLocaleString()}`
      
      // CRITICAL: dress_code MUST always be present - never show [NO CODE]
      // If wrappedCode is empty, use the original dressCode (should never happen after our fallbacks)
      const finalCode = wrappedCode || dressCode || `CODE_${index + 1}`
      
      return [
        wrappedDressName,
        dressType,
        finalCode, // ALWAYS show a code - never empty
        size,
        quantity.toString(),
        priceText,
      ]
    })
    
    // Wait for all promises to resolve (in case we needed to fetch from inventory)
    const tableData = await Promise.all(tableDataPromises)

    let finalY = yPos + 10

    // Try to use autoTable
    try {
      console.log(`Table data prepared: ${tableData.length} rows`)
      if (typeof (doc as any).autoTable === 'function') {
        // A4 page width: 210mm, margins: 14mm each side = 182mm usable width
        // Use tighter column widths and manual text wrapping
        doc.autoTable({
          startY: yPos + 10,
          head: [['Item', 'Type', 'Code', 'Size', 'Qty', 'Price']],
          body: tableData,
          showHead: 'everyPage',
          theme: 'striped',
          headStyles: { 
            fillColor: [70, 70, 70], 
            textColor: [255, 255, 255], 
            fontStyle: 'bold', 
            fontSize: 8,
            halign: 'left'
          },
          styles: { 
            fontSize: 7,
            cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
            overflow: 'linebreak',
            cellWidth: 'wrap',
            halign: 'left',
            valign: 'top',
            lineWidth: 0.1,
            textColor: [0, 0, 0],
            lineColor: [220, 220, 220]
          },
          columnStyles: {
            0: { cellWidth: 34, cellPadding: { top: 4, right: 2, bottom: 4, left: 3 }, overflow: 'linebreak', fontSize: 7, halign: 'left' }, // Item - reduced to make room for Code
            1: { cellWidth: 10, cellPadding: { top: 4, right: 1, bottom: 4, left: 3 }, fontSize: 7, halign: 'left' }, // Type
            2: { cellWidth: 44, cellPadding: { top: 4, right: 2, bottom: 4, left: 1 }, overflow: 'linebreak', fontSize: 6.5, halign: 'left', minCellHeight: 10 }, // Code - increased width significantly for full visibility
            3: { cellWidth: 12, cellPadding: { top: 4, right: 2, bottom: 4, left: 2 }, fontSize: 7, halign: 'left' }, // Size
            4: { cellWidth: 10, cellPadding: { top: 4, right: 2, bottom: 4, left: 2 }, halign: 'center', fontSize: 7 }, // Qty
            5: { cellWidth: 18, cellPadding: { top: 4, right: 3, bottom: 4, left: 2 }, halign: 'right', fontSize: 7 }, // Price
          },
          margin: { left: 14, right: 14 },
          tableWidth: 128, // Total: 34+10+44+12+10+18 = 128mm, fits well in A4 (182mm usable)
          didParseCell: function(data: any) {
            // Skip processing if this is a header row
            if (data.row.index < 0) {
              return
            }
            
            // Ensure text is properly formatted as array for multi-line support
            if (data.cell.text) {
              if (typeof data.cell.text === 'string') {
                // If it contains newlines, split it (already pre-wrapped)
                if (data.cell.text.includes('\n')) {
                  data.cell.text = data.cell.text.split('\n').filter((line: string) => line.trim() !== '')
                } else {
                  data.cell.text = [data.cell.text]
                }
              } else if (Array.isArray(data.cell.text)) {
                // Already an array, filter out empty strings and ensure it's not empty
                data.cell.text = data.cell.text.filter((line: string) => line.trim() !== '')
                if (data.cell.text.length === 0) {
                  data.cell.text = ['']
                }
              } else {
                data.cell.text = [String(data.cell.text || '')]
              }
            } else {
              data.cell.text = ['']
            }
            
            // Don't re-wrap if text already contains newlines (it's been pre-wrapped)
            // Only ensure proper formatting - prevent duplication
            if (data.column.index === 2 && data.cell.text && Array.isArray(data.cell.text)) {
              // Code column - ensure proper wrapping for long codes (CRITICAL: prevent truncation)
              const fullText = data.cell.text.join(' ').trim()
              // Only wrap if not already wrapped (single element) and text is long
              // Use 20 characters for very aggressive wrapping to prevent truncation
              if (data.cell.text.length === 1 && fullText.length > 20) {
                data.cell.text = wrapTextForCell(fullText, 20).split('\n').filter((line: string) => line.trim() !== '')
              }
              // Ensure all lines are preserved (don't filter out wrapped lines)
              if (data.cell.text.length > 1) {
                // Already wrapped, just ensure no empty lines but keep all content
                data.cell.text = data.cell.text.filter((line: string) => line.trim() !== '')
                // If we filtered out all lines, restore the original text
                if (data.cell.text.length === 0 && fullText) {
                  data.cell.text = [fullText]
                }
              }
            }
            if (data.column.index === 0 && data.cell.text && Array.isArray(data.cell.text)) {
              // Item column - check if already wrapped by checking if array has multiple elements
              const fullText = data.cell.text.join(' ').trim()
              // Only wrap if not already wrapped (single element) and text is long
              if (data.cell.text.length === 1 && fullText.length > 40) {
                data.cell.text = wrapTextForCell(fullText, 40).split('\n').filter((line: string) => line.trim() !== '')
              }
            }
          },
        })
        finalY = doc.lastAutoTable?.finalY || yPos + 10 + (tableData.length * 8)
        
        // Verify table was created
        console.log('autoTable rendered, finalY:', doc.lastAutoTable?.finalY)
        if (!doc.lastAutoTable || doc.lastAutoTable.finalY === undefined) {
          console.warn('autoTable may not have rendered correctly, using fallback')
          throw new Error('autoTable rendering issue')
        }
        console.log('Table successfully rendered with autoTable')
      } else {
        console.warn('autoTable function not available, using fallback')
        throw new Error('autoTable function not available')
      }
    } catch (tableError) {
      console.error('autoTable error, using fallback:', tableError)
      // Fallback: Create table manually
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Item', 14, finalY)
      doc.text('Type', 60, finalY)
      doc.text('Code', 90, finalY)
      doc.text('Size', 120, finalY)
      doc.text('Qty', 145, finalY)
      doc.text('Price', 170, finalY)
      
      doc.setFont('helvetica', 'normal')
      finalY += 6
      
      // Fallback table: Also ensure dress_code is always present
      for (let idx = 0; idx < sale.items.length; idx++) {
        const item = sale.items[idx]
        if (finalY > doc.internal.pageSize.height - 30) {
          doc.addPage()
          finalY = 20
        }
        
        let dressName = item.dressName || item.dress_name || ''
        let dressCode = item.dressCode || item.dress_code || item.code || ''
        const dressType = item.dressType || item.dress_type || ''
        const size = item.size || ''
        const quantity = item.quantity || 0
        const sellingPrice = item.sellingPrice || item.selling_price || 0
        const inventoryId = item.inventoryId || item.inventory_id
        
        // ALWAYS fetch the latest dress_code from inventory (same logic as main table)
        if (inventoryId) {
          try {
            const inventoryResult = await query(
              'SELECT dress_code, dress_name FROM inventory WHERE id = $1',
              [parseInt(inventoryId)]
            )
            if (inventoryResult.rows.length > 0) {
              // ALWAYS use the latest dress_code from inventory
              if (inventoryResult.rows[0].dress_code) {
                dressCode = inventoryResult.rows[0].dress_code
              }
              if (!dressName && inventoryResult.rows[0].dress_name) {
                dressName = inventoryResult.rows[0].dress_name
              }
            }
          } catch (fetchError) {
            // Ignore errors in fallback
          }
        }
        
        // Final fallback: generate code if still empty
        if (!dressCode || dressCode.trim() === '') {
          if (dressName) {
            const nameParts = dressName.trim().split(/\s+/).slice(0, 3)
            dressCode = nameParts.map((p: string) => p.toUpperCase().replace(/[^A-Z0-9]/g, '_')).join('_')
          } else {
            dressCode = `ITEM_${idx + 1}`
          }
        }
        
        // For fallback table, wrap long codes across multiple lines
        const wrappedCodeForFallback = dressCode.length > 30 ? wrapTextForCell(dressCode, 30) : dressCode
        const codeLines = wrappedCodeForFallback.split('\n')
        
        doc.text(dressName.substring(0, 20), 14, finalY)
        doc.text(dressType, 60, finalY)
        // Print code with wrapping support
        codeLines.forEach((line: string, lineIdx: number) => {
          doc.text(line.substring(0, 30), 90, finalY + (lineIdx * 4))
        })
        doc.text(size, 120, finalY)
        doc.text(quantity.toString(), 145, finalY)
        doc.text(`Rs. ${sellingPrice.toLocaleString()}`, 170, finalY)
        finalY += 6
      }
    }

    // Total
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Amount: Rs. ${sale.totalAmount.toLocaleString()}`, 14, finalY + 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Payment Mode: ${sale.paymentMode}`, 14, finalY + 16)
    if (sale.upiTransactionId) {
      doc.text(`UPI Transaction ID: ${sale.upiTransactionId}`, 14, finalY + 22)
    }

    // Footer
    doc.setFontSize(8)
    doc.text('Thank you for your business!', 14, doc.internal.pageSize.height - 10)

    // Generate PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Invoice_${sale.billNumber}_${format(new Date(sale.date), 'yyyyMMdd')}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}


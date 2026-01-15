'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Sale, BusinessProfile, Customer } from '@/lib/storage'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable?: {
      finalY: number
    }
  }
}

export default function InvoicesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [userRole, setUserRole] = useState<'superadmin' | 'admin' | 'user' | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // Fetch user info first, then load data
    const fetchUserAndLoadData = async () => {
      try {
        // Fetch user info
        const authRes = await fetch('/api/auth/check', { credentials: 'include' })
        const authData = await authRes.json()
        
        if (authData.authenticated && authData.admin) {
          let role = (authData.admin.role || 'admin').toLowerCase().trim()
          if (role === 'super_admin') role = 'superadmin'
          setUserRole(role as 'superadmin' | 'admin' | 'user')
          if (authData.admin.email) {
            setUserEmail(authData.admin.email)
          }
          
          // Load data with user context
          await loadData(role as 'superadmin' | 'admin' | 'user', authData.admin.email)
        } else {
          // Not authenticated, load all data (will redirect anyway)
          await loadData(null, null)
        }
      } catch (err) {
        console.error('Error fetching user info:', err)
        await loadData(null, null)
      }
    }
    
    fetchUserAndLoadData()
  }, [])

  const loadData = async (role: 'superadmin' | 'admin' | 'user' | null, email: string | null) => {
    try {
      // For users, we need to find their customer by email and filter invoices
      let salesUrl = '/api/sales'
      if (role === 'user' && email) {
        // Fetch customer by email first, then filter sales
        const customersRes = await fetch('/api/customers')
        const customersResult = await customersRes.json()
        
        if (customersResult.success) {
          const customer = customersResult.data.find((c: Customer) => 
            c.email && c.email.toLowerCase() === email.toLowerCase()
          )
          
          if (customer) {
            // Filter sales by customer_id
            salesUrl = `/api/sales?customer_id=${customer.id}`
          } else {
            // No customer found for this user, show empty list
            setSales([])
            setCustomers(customersResult.data)
            const businessRes = await fetch('/api/business')
            const businessResult = await businessRes.json()
            if (businessResult.success && businessResult.data) {
              setBusinessProfile(businessResult.data)
            }
            return
          }
        }
      }
      
      const [salesRes, businessRes, customersRes] = await Promise.all([
        fetch(salesUrl),
        fetch('/api/business'),
        fetch('/api/customers'),
      ])
      const salesResult = await salesRes.json()
      const businessResult = await businessRes.json()
      const customersResult = await customersRes.json()
      
      if (salesResult.success) {
        const allSales = salesResult.data
        allSales.sort((a: Sale, b: Sale) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setSales(allSales)
      }
      if (businessResult.success && businessResult.data) {
        setBusinessProfile(businessResult.data)
      }
      if (customersResult.success) {
        setCustomers(customersResult.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const getCustomer = (sale: Sale): Customer | null => {
    if (!sale.customerId) return null
    return customers.find(c => c.id === sale.customerId) || null
  }

  // View PDF in new tab
  const viewPDF = async (sale: Sale) => {
    try {
      // API will always fetch the latest business profile from database
      // Pass it if available for faster response, but API will use database version
      const response = await fetch('/api/invoice/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sale,
          businessProfile: businessProfile || undefined, // Optional - API will fetch latest from database
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Convert response to blob and create object URL
      const pdfBlob = await response.blob()
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      // Open PDF in new tab for viewing
      window.open(pdfUrl, '_blank')
      
      // Clean up the object URL after a delay (browser will handle it when tab closes)
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100)
    } catch (error) {
      console.error('PDF viewing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Error viewing PDF: ${errorMessage}`)
    }
  }

  // Print PDF
  const printPDF = async (sale: Sale) => {
    try {
      // API will always fetch the latest business profile from database
      // Pass it if available for faster response, but API will use database version
      const response = await fetch('/api/invoice/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sale,
          businessProfile: businessProfile || undefined, // Optional - API will fetch latest from database
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Convert response to blob and create object URL
      const pdfBlob = await response.blob()
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      // Open PDF in new window and trigger print
      const printWindow = window.open(pdfUrl, '_blank')
      
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            // Clean up after printing
            setTimeout(() => {
              URL.revokeObjectURL(pdfUrl)
            }, 1000)
          }, 500)
        }
      } else {
        // Fallback: if popup blocked, open in new tab
        window.open(pdfUrl, '_blank')
        alert('Please use the browser print button (Ctrl+P / Cmd+P) to print the PDF')
      }
    } catch (error) {
      console.error('PDF printing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Error printing PDF: ${errorMessage}`)
    }
  }

  // Download PDF
  const downloadPDF = async (sale: Sale) => {
    try {
      // API will always fetch the latest business profile from database
      // Pass it if available for faster response, but API will use database version
      const response = await fetch('/api/invoice/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sale,
          businessProfile: businessProfile || undefined, // Optional - API will fetch latest from database
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Convert response to blob
      const pdfBlob = await response.blob()
      const fileName = `Invoice_${sale.billNumber}_${format(new Date(sale.date), 'yyyyMMdd')}.pdf`
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (error) {
      console.error('PDF download error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Error downloading PDF: ${errorMessage}`)
    }
  }

  const generatePDF = (sale: Sale, returnBlob: boolean = false): Blob | void => {
    try {
      // Use business profile if available, otherwise use defaults
      // Note: For server-side PDF generation, the API always fetches the latest from database
      const profile = businessProfile || {
        businessName: 'Business Name',
        ownerName: '',
        email: '',
        phone: '',
        address: '',
        gstNumber: '',
        whatsappNumber: '',
      }

      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(profile.businessName || 'Business Name', 14, 20)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      let yPos = 28
      
      // Only show address if provided
      if (profile.address) {
        doc.text(profile.address, 14, yPos)
        yPos += 6
      }
      
      // Only show contact info if provided
      const contactInfo = []
      if (profile.phone) contactInfo.push(`Phone: ${profile.phone}`)
      if (profile.email) contactInfo.push(`Email: ${profile.email}`)
      if (contactInfo.length > 0) {
        doc.text(contactInfo.join(' | '), 14, yPos)
        yPos += 6
      }
      
      // Only show GST if provided
      if (profile.gstNumber) {
        doc.text(`GST: ${profile.gstNumber}`, 14, yPos)
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
      const customer = getCustomer(sale)
      
      doc.text(`Bill Number: ${sale.billNumber}`, 14, yPos)
      yPos += 6
      doc.text(`Date: ${format(new Date(sale.date), 'dd MMM yyyy')}`, 14, yPos)
      yPos += 6
      doc.text(`Party Name: ${sale.partyName}`, 14, yPos)
      if (customer) {
        yPos += 6
        doc.text(`Phone: ${customer.phone}`, 14, yPos)
        if (customer.address) {
          yPos += 6
          doc.text(`Address: ${customer.address}`, 14, yPos)
        }
      }

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
        console.error('No items found in sale:', sale)
        alert('This sale has no items. Cannot generate invoice.')
        return
      }

      // Table data - pre-wrap long codes and dress names BEFORE passing to autoTable
      // Use consistent template: Item, Type, Code, Size, Qty, Price (Total column removed)
      // IMPORTANT: Always use dress_code from inventory if available
      const tableData = sale.items.map(item => {
        const dressName = item.dressName || ''
        // Always try to get dress_code - prefer from item, but will be fetched from inventory if missing
        let dressCode = item.dressCode || (item as any).dress_code || ''
        // Pre-wrap code at 20 characters per line (very aggressive wrapping for long codes)
        const wrappedCode = dressCode.length > 20 ? wrapTextForCell(dressCode, 20) : dressCode
        // Pre-wrap dress name at 40 characters per line (ensures full item names like "SAREE MUL COTTON (MOU/22/1-3/26)" are visible)
        const wrappedDressName = dressName.length > 40 ? wrapTextForCell(dressName, 40) : dressName
        
        // Use "Rs." prefix for better font compatibility (₹ symbol may not render correctly)
        const priceText = `Rs. ${item.sellingPrice.toLocaleString()}`
        
        return [
          wrappedDressName,
          item.dressType || '',
          wrappedCode || dressCode || '[NO CODE]', // Always show code
          item.size || '',
          item.quantity.toString(),
          priceText,
        ]
      })

      let finalY = yPos + 10

      // Try to use autoTable, fallback to manual table if it fails
      try {
        if (typeof (doc as any).autoTable === 'function') {
          // A4 page width: 210mm, margins: 14mm each side = 182mm usable width
          // Use tighter column widths and manual text wrapping
          doc.autoTable({
            startY: yPos + 10,
            head: [['Item', 'Type', 'Code', 'Size', 'Qty', 'Price']],
            body: tableData,
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
                // Ensure all wrapped lines are preserved
                if (data.cell.text.length > 1) {
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
          if (!doc.lastAutoTable || doc.lastAutoTable.finalY === undefined) {
            console.warn('autoTable may not have rendered correctly, using fallback')
            throw new Error('autoTable rendering issue')
          }
        } else {
          throw new Error('autoTable function not available')
        }
      } catch (tableError) {
        // Fallback: Create table manually
        console.warn('autoTable failed, using manual table:', tableError)
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
        
        sale.items.forEach((item, index) => {
          if (finalY > doc.internal.pageSize.height - 30) {
            doc.addPage()
            finalY = 20
          }
          doc.text(item.dressName.substring(0, 20), 14, finalY)
          doc.text(item.dressType, 60, finalY)
          doc.text(item.dressCode, 90, finalY)
          doc.text(item.size, 120, finalY)
          doc.text(item.quantity.toString(), 145, finalY)
          doc.text(`Rs. ${item.sellingPrice.toLocaleString()}`, 170, finalY)
          finalY += 6
        })
      }
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

      if (returnBlob) {
        return doc.output('blob') as Blob
      } else {
        // Save PDF
        doc.save(`Invoice_${sale.billNumber}_${format(new Date(sale.date), 'yyyyMMdd')}.pdf`)
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error details:', errorMessage, error)
      alert(`Error generating PDF: ${errorMessage}. Please check the console for details.`)
    }
  }

  const sendViaWhatsApp = async (sale: Sale) => {
    try {
      // Fetch latest business profile if not available (API will also fetch it, but we need it for the message)
      let profile = businessProfile
      if (!profile) {
        try {
          const profileRes = await fetch('/api/business')
          const profileResult = await profileRes.json()
          if (profileResult.success && profileResult.data) {
            profile = profileResult.data
          }
        } catch (err) {
          console.warn('Failed to fetch business profile:', err)
        }
      }

      // Get customer phone number or use business WhatsApp number
      const customer = getCustomer(sale)
      let phoneNumber = ''
      
      if (customer && customer.phone) {
        phoneNumber = customer.phone.replace(/[^0-9]/g, '')
      } else {
        // If no customer, ask user to enter phone number
        const inputPhone = prompt('Enter customer WhatsApp number (with country code, e.g., 919876543210):')
        if (!inputPhone) return
        phoneNumber = inputPhone.replace(/[^0-9]/g, '')
      }

      if (!phoneNumber) {
        alert('Please enter a valid phone number')
        return
      }

      // Generate PDF on server - API will always fetch latest business profile from database
      const response = await fetch('/api/invoice/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sale,
          businessProfile: profile || undefined, // Optional - API will fetch latest from database
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Convert response to blob
      const pdfBlob = await response.blob()
      const fileName = `Invoice_${sale.billNumber}_${format(new Date(sale.date), 'yyyyMMdd')}.pdf`
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

      // Create invoice message
      const businessName = profile?.businessName || 'Business'
      let message = `*Invoice - ${businessName}*\n\n`
      message += `Bill Number: ${sale.billNumber}\n`
      message += `Date: ${format(new Date(sale.date), 'dd MMM yyyy')}\n`
      message += `Party: ${sale.partyName}\n\n`
      message += `*Items:*\n`
      
      sale.items.forEach((item, index) => {
        message += `${index + 1}. ${item.dressName} (${item.dressType})\n`
        message += `   Code: ${item.dressCode} | Size: ${item.size} | Qty: ${item.quantity}\n`
        message += `   Price: ₹${item.sellingPrice} | Total: ₹${(item.sellingPrice * item.quantity).toLocaleString()}\n\n`
      })
      
      message += `*Total Amount: ₹${sale.totalAmount.toLocaleString()}*\n`
      message += `Payment: ${sale.paymentMode}`
      if (sale.upiTransactionId) {
        message += ` (${sale.upiTransactionId})`
      }
      message += `\n\n📎 Please find the invoice PDF attached.\n\nThank you for your business!`

      // Try Web Share API first (works on mobile and some desktop browsers - can share files directly)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Invoice - ${sale.billNumber}`,
            text: message,
            files: [file],
          })
          // Successfully shared via Web Share API
          return
        } catch (shareError: any) {
          // User cancelled or share failed, fall through to WhatsApp method
          if (shareError.name !== 'AbortError') {
            console.log('Web Share API failed, using WhatsApp method:', shareError)
          }
        }
      }

      // Fallback: WhatsApp method with improved file sharing
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      // Open WhatsApp with message
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank')

      // Show modal with PDF options (NO AUTO-DOWNLOAD)
      setTimeout(() => {
        const modal = document.createElement('div')
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        `
        
        const content = document.createElement('div')
        content.style.cssText = `
          background: white;
          padding: 32px;
          border-radius: 12px;
          max-width: 600px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `
        
        content.innerHTML = `
          <h2 style="margin-bottom: 16px; color: #25D366; font-size: 24px;">📱 Share Invoice via WhatsApp</h2>
          <p style="margin-bottom: 24px; color: #666;">WhatsApp is now open. Choose how to attach the PDF:</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #25D366;">
            <p style="font-weight: bold; margin-bottom: 12px; color: #25D366;">✨ Method 1: Drag & Drop (Recommended)</p>
            <p style="color: #666; margin-bottom: 16px; font-size: 14px;">Open the PDF in a new tab, then drag it directly into the WhatsApp chat window</p>
            <button id="openPdfBtn" style="
              background: #25D366;
              color: white;
              border: none;
              padding: 14px 28px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              width: 100%;
            ">📄 Open PDF in New Tab</button>
          </div>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <p style="font-weight: bold; margin-bottom: 12px;">📥 Method 2: Download & Attach</p>
            <p style="color: #666; margin-bottom: 16px; font-size: 14px;">Download the PDF, then attach it using the 📎 icon in WhatsApp</p>
            <button id="downloadPdfBtn" style="
              background: #128C7E;
              color: white;
              border: none;
              padding: 14px 28px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              width: 100%;
            ">📥 Download PDF</button>
          </div>
          <button id="closeModalBtn" style="
            background: #e0e0e0;
            color: #333;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
          ">Close</button>
        `
        
        modal.appendChild(content)
        document.body.appendChild(modal)
        
        const openPdfBtn = document.getElementById('openPdfBtn')
        const downloadBtn = document.getElementById('downloadPdfBtn')
        const closeBtn = document.getElementById('closeModalBtn')
        
        openPdfBtn?.addEventListener('click', () => {
          window.open(pdfUrl, '_blank')
        })
        
        downloadBtn?.addEventListener('click', () => {
          const link = document.createElement('a')
          link.href = pdfUrl
          link.download = fileName
          link.click()
        })
        
        closeBtn?.addEventListener('click', () => {
          modal.remove()
          URL.revokeObjectURL(pdfUrl)
        })
        
        // Clean up after 10 minutes
        setTimeout(() => {
          if (document.body.contains(modal)) {
            modal.remove()
          }
          URL.revokeObjectURL(pdfUrl)
        }, 600000)
      }, 500)
    } catch (error) {
      console.error('WhatsApp send error:', error)
      alert('Error preparing invoice for WhatsApp. Please try again.')
    }
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Invoices</h1>

        {!businessProfile && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
            💡 <strong>Tip:</strong> Set up your business profile to customize invoice headers. <a href="/admin/business" className="underline font-semibold">Go to Business Setup</a> (The system will use the latest profile from database)
          </div>
        )}

        {businessProfile && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            ✅ <strong>Business Profile Active:</strong> All invoices will use the latest business profile from the database. Any updates made in <a href="/admin/business" className="underline font-semibold">Business Setup</a> will be automatically reflected in all future invoices.
          </div>
        )}

        {sales.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No sales recorded yet. Record a sale to generate invoices!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(sale.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {sale.billNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{sale.partyName}</p>
                        {getCustomer(sale) && (
                          <p className="text-xs text-gray-500">{getCustomer(sale)?.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₹{sale.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.paymentMode}
                      {sale.upiTransactionId && (
                        <span className="block text-xs text-gray-400">{sale.upiTransactionId}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              await viewPDF(sale)
                            } catch (err) {
                              console.error('PDF viewing failed:', err)
                              alert('Failed to view PDF. Please try again.')
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View PDF"
                        >
                          👁️ View
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await printPDF(sale)
                            } catch (err) {
                              console.error('PDF printing failed:', err)
                              alert('Failed to print PDF. Please try again.')
                            }
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Print PDF"
                        >
                          🖨️ Print
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await downloadPDF(sale)
                            } catch (err) {
                              console.error('PDF download failed:', err)
                              alert('Failed to download PDF. Please try again.')
                            }
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Download PDF"
                        >
                          📥 Download
                        </button>
                        <button
                          onClick={() => sendViaWhatsApp(sale)}
                          className="text-green-600 hover:text-green-900"
                          title="Send via WhatsApp"
                        >
                          💬 WhatsApp
                        </button>
                        <button
                          onClick={() => {
                            window.location.href = `/admin/sales`
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Edit Sale"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete this sale? This will restore inventory stock.')) {
                              return
                            }
                            try {
                              const response = await fetch(`/api/sales/${sale.id}`, {
                                method: 'DELETE',
                              })
                              const result = await response.json()
                              if (!result.success) {
                                alert('Failed to delete sale')
                                return
                              }
                              // Reload the page to refresh the list
                              window.location.reload()
                            } catch (error) {
                              console.error('Failed to delete sale:', error)
                              alert('Failed to delete sale')
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Sale"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}


# UPI Payment Integration Proposal

## Overview
This document outlines the approach for integrating UPI payment flow into the sales creation process. When an admin selects "UPI" as the payment method, the system will guide them through a 3-step process to collect UPI ID, send payment request, and confirm payment status.

---

## User Flow

### Step 1: UPI ID Collection
When admin selects "UPI" as payment method:
- A modal/dialog appears prompting: **"Enter Customer UPI ID"**
- Input field for UPI ID (e.g., `customer@paytm`, `customer@phonepe`, `customer@ybl`)
- Validation: Must be a valid UPI ID format (alphanumeric + @ + provider)
- Options: "Continue" or "Cancel"

### Step 2: Payment Request Generation
After entering UPI ID:
- System generates a UPI payment deep link
- Format: `upi://pay?pa=<UPI_ID>&pn=Lalitha Garments&am=<Total_Amount>&cu=INR&tn=Payment for Sale`
- Opens customer's UPI app (PhonePe, Google Pay, Paytm, etc.)
- Customer can complete payment in their UPI app

### Step 3: Payment Confirmation Dialog
After payment request is sent:
- Show confirmation dialog with:
  - **Total Amount**: ₹X,XXX
  - **Customer UPI ID**: customer@paytm
  - **Payment Status Options**:
    1. ✅ **"Payment Done"** - Mark sale as paid, save to database
    2. ❌ **"Not Received"** - Mark sale as pending, save to database
    3. 📱 **"Send Payment Request"** - Generate UPI link to business number (+91 7204219541)
       - Alternative: Send payment request to business UPI ID instead

---

## Technical Implementation

### 1. Database Schema Changes

#### Add to `sales` table:
```sql
ALTER TABLE sales 
ADD COLUMN upi_id VARCHAR(255),
ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'failed'));

CREATE INDEX idx_sales_payment_status ON sales(payment_status);
```

**Fields:**
- `upi_id`: Customer's UPI ID (e.g., `customer@paytm`)
- `payment_status`: `'paid'`, `'pending'`, or `'failed'`

---

### 2. UPI Deep Link Generation

#### UPI Deep Link Format:
```
upi://pay?pa=<UPI_ID>&pn=<Payee_Name>&am=<Amount>&cu=INR&tn=<Transaction_Note>
```

**Parameters:**
- `pa`: Payee Address (UPI ID)
- `pn`: Payee Name (Business Name: "Lalitha Garments")
- `am`: Amount (Total sale amount)
- `cu`: Currency (INR)
- `tn`: Transaction Note (e.g., "Payment for Sale #BILL-2026-0001")

#### Example:
```
upi://pay?pa=customer@paytm&pn=Lalitha%20Garments&am=1500.00&cu=INR&tn=Payment%20for%20Sale%20%23BILL-2026-0001
```

---

### 3. Frontend Implementation

#### Component Structure:
```typescript
// New state variables
const [showUpiModal, setShowUpiModal] = useState(false)
const [upiId, setUpiId] = useState('')
const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false)
const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | null>(null)

// UPI ID validation
const validateUpiId = (upi: string): boolean => {
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
  return upiRegex.test(upi)
}

// Generate UPI payment link
const generateUpiLink = (upiId: string, amount: number, billNumber: string): string => {
  const payeeName = encodeURIComponent('Lalitha Garments')
  const transactionNote = encodeURIComponent(`Payment for Sale #${billNumber}`)
  const amountStr = amount.toFixed(2)
  
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${payeeName}&am=${amountStr}&cu=INR&tn=${transactionNote}`
}

// Open UPI app
const openUpiApp = (upiLink: string) => {
  window.location.href = upiLink
  // Fallback: If UPI app not installed, show instructions
  setTimeout(() => {
    // Check if user is still on page (UPI app didn't open)
    // Show fallback message
  }, 1000)
}
```

#### UI Flow:
1. **Payment Method Selection**:
   - When "UPI" is selected → Show UPI ID input modal
   
2. **UPI ID Modal**:
   ```jsx
   <Modal>
     <h2>Enter Customer UPI ID</h2>
     <input 
       type="text" 
       placeholder="customer@paytm / customer@phonepe"
       value={upiId}
       onChange={(e) => setUpiId(e.target.value)}
     />
     <button onClick={handleContinue}>Continue</button>
     <button onClick={() => setShowUpiModal(false)}>Cancel</button>
   </Modal>
   ```

3. **Payment Confirmation Dialog**:
   ```jsx
   <Dialog>
     <h2>Payment Confirmation</h2>
     <p>Total Amount: ₹{totalAmount}</p>
     <p>Customer UPI: {upiId}</p>
     
     <div>
       <button onClick={() => handlePaymentStatus('paid')}>
         ✅ Payment Done
       </button>
       <button onClick={() => handlePaymentStatus('pending')}>
         ❌ Not Received
       </button>
       <button onClick={handleSendPaymentRequest}>
         📱 Send Payment Request
       </button>
     </div>
   </Dialog>
   ```

---

### 4. Backend API Changes

#### Update `POST /api/sales`:
```typescript
// Add to request body
{
  // ... existing fields
  upiId: string,           // Customer UPI ID
  paymentStatus: 'paid' | 'pending' | 'failed'
}

// Update database insert
INSERT INTO sales (
  // ... existing columns
  upi_id,
  payment_status
) VALUES (
  // ... existing values
  $upiId,
  $paymentStatus
)
```

#### Update `GET /api/sales`:
```typescript
// Include in response
{
  // ... existing fields
  upiId: row.upi_id,
  paymentStatus: row.payment_status
}
```

---

### 5. "Send Payment Request" Feature

#### Option A: Send to Business UPI ID
When admin clicks "Send Payment Request":
- Generate UPI link with business UPI ID: `lalitha_garments@paytm` (or configured UPI ID)
- Amount: Total sale amount
- Note: "Payment request for Sale #BILL-XXXX"
- Open UPI app to send request

#### Option B: Send to Business Mobile Number
When admin clicks "Send Payment Request":
- Generate UPI link with business mobile: `+917204219541@paytm`
- Amount: Total sale amount
- Note: "Payment request for Sale #BILL-XXXX"
- Open UPI app to send request

**Note**: Mobile number-based UPI requires the business to have registered their mobile number with a UPI provider.

---

## Implementation Steps

### Phase 1: Database Migration
1. Create migration script: `scripts/migrate-upi-payment.sql`
2. Add `upi_id` and `payment_status` columns to `sales` table
3. Run migration: `npm run migrate-upi-payment`

### Phase 2: Backend API Updates
1. Update `POST /api/sales` to accept `upiId` and `paymentStatus`
2. Update `GET /api/sales` to return `upiId` and `paymentStatus`
3. Update `PUT /api/sales/[id]` to allow updating payment status

### Phase 3: Frontend UI Implementation
1. Add UPI ID input modal component
2. Add payment confirmation dialog component
3. Integrate UPI deep link generation
4. Update sales form to handle UPI payment flow
5. Add payment status badge/indicator in sales list

### Phase 4: Testing
1. Test UPI link generation with various UPI IDs
2. Test payment status updates
3. Test "Send Payment Request" functionality
4. Test on mobile devices (where UPI apps are installed)

---

## Limitations & Considerations

### 1. UPI Deep Links
- **Works on**: Mobile devices with UPI apps installed (PhonePe, Google Pay, Paytm, BHIM)
- **Doesn't work on**: Desktop browsers (no UPI apps installed)
- **Solution**: Show fallback message on desktop: "Please use mobile device to complete UPI payment"

### 2. Payment Verification
- **Current Approach**: Manual confirmation by admin (Payment Done / Not Received)
- **Future Enhancement**: Integrate with UPI payment gateway API for automatic verification
  - Requires: Business account with payment gateway (Razorpay, Paytm Business, etc.)
  - Webhook integration for payment status updates

### 3. Business UPI ID Configuration
- Store business UPI ID in database/config: `business_upi_id` or `business_mobile_number`
- Allow admin to configure in settings
- Default: Use mobile number `+917204219541` if UPI ID not configured

### 4. Payment Status Tracking
- Add filter in sales list: "Filter by Payment Status" (All / Paid / Pending / Failed)
- Add payment status badge in sales cards
- Add payment status update functionality in edit sale modal

---

## Alternative Approaches

### Option 1: WhatsApp Payment Request (Recommended for India)
Instead of UPI deep link, send WhatsApp message with payment request:
- Use WhatsApp Business API or WhatsApp Web link
- Format: `https://wa.me/917204219541?text=Payment%20request%20for%20₹1500`
- Customer can click link and pay via UPI from WhatsApp

### Option 2: Payment Gateway Integration
- Integrate with Razorpay/Paytm Business API
- Generate payment links automatically
- Automatic payment verification via webhooks
- **Pros**: Automatic verification, better tracking
- **Cons**: Requires business account, transaction fees, more complex setup

### Option 3: QR Code Generation
- Generate UPI QR code for business
- Display QR code in confirmation dialog
- Customer scans and pays
- **Pros**: Works on any device with QR scanner
- **Cons**: Still requires manual confirmation

---

## Recommended Approach

**Hybrid Solution:**
1. **Primary**: UPI Deep Link (for mobile devices)
   - Generate UPI link when "Send Payment Request" is clicked
   - Open customer's UPI app directly
   
2. **Fallback**: WhatsApp Link (for desktop or if UPI app not available)
   - Generate WhatsApp message link
   - Customer can pay via WhatsApp UPI
   
3. **Manual Confirmation**: Admin confirms payment status
   - "Payment Done" → Mark as paid
   - "Not Received" → Mark as pending
   - Can update later from sales list

---

## Configuration

### Environment Variables (Optional):
```env
BUSINESS_UPI_ID=lalitha_garments@paytm
BUSINESS_MOBILE=+917204219541
BUSINESS_NAME=Lalitha Garments
```

### Database Config Table (Future):
```sql
CREATE TABLE business_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO business_config (key, value) VALUES
  ('business_upi_id', 'lalitha_garments@paytm'),
  ('business_mobile', '+917204219541'),
  ('business_name', 'Lalitha Garments');
```

---

## Questions for Review

1. **Business UPI ID**: Do you have a registered UPI ID for the business, or should we use the mobile number?
2. **Payment Verification**: Do you want automatic payment verification (requires payment gateway), or manual confirmation is sufficient?
3. **Payment Status Updates**: Should admins be able to update payment status later from the sales list?
4. **WhatsApp Integration**: Do you want to integrate WhatsApp payment requests as a fallback?
5. **Desktop Support**: How should we handle UPI payments on desktop (where UPI apps aren't available)?

---

## Next Steps

1. **Review this proposal** and provide feedback
2. **Confirm business UPI ID or mobile number** for payment requests
3. **Decide on payment verification approach** (manual vs automatic)
4. **Approve implementation approach** (UPI deep link vs WhatsApp vs Payment Gateway)
5. **Start Phase 1 implementation** (Database migration)

---

## Estimated Implementation Time

- **Phase 1 (Database)**: 30 minutes
- **Phase 2 (Backend API)**: 1 hour
- **Phase 3 (Frontend UI)**: 2-3 hours
- **Phase 4 (Testing)**: 1 hour
- **Total**: ~4-5 hours

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-11  
**Status**: Proposal - Awaiting Review


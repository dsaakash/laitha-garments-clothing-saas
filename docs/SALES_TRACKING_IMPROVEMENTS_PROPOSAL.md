# Sales Tracking Improvements - Implementation Proposal

## Overview
This document outlines the proposed approach for enhancing the Sales Tracking system with four key improvements:
1. Auto-generated serial bill numbers
2. Enhanced item selection with search functionality
3. Advanced filtering by party name with sales summary
4. Stock validation before adding items to sale

---

## 1. Auto-Generated Bill Numbers (Serial Number Format)

### Current State
- Bill numbers are manually entered by users
- No automatic serialization
- Risk of duplicates or missing numbers

### Proposed Solution

#### **Option A: Simple Sequential (Recommended)**
- Format: `BILL-YYYY-XXXX` (e.g., `BILL-2026-0001`, `BILL-2026-0002`)
- Year-based reset: Each year starts from 0001
- Auto-increment: System automatically generates next number

#### **Option B: Continuous Sequential**
- Format: `BILL-XXXXX` (e.g., `BILL-00001`, `BILL-00002`)
- No year reset: Continuous numbering across all years
- Auto-increment: System automatically generates next number

#### **Implementation Approach**

**Database Changes:**
1. Create a `bill_number_sequence` table to track the last bill number:
   ```sql
   CREATE TABLE bill_number_sequence (
     year INTEGER PRIMARY KEY,
     last_number INTEGER NOT NULL DEFAULT 0,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. Create a function to generate next bill number:
   ```sql
   CREATE OR REPLACE FUNCTION get_next_bill_number(year_val INTEGER)
   RETURNS VARCHAR AS $$
   DECLARE
     next_num INTEGER;
     bill_num VARCHAR;
   BEGIN
     -- Insert or update sequence for the year
     INSERT INTO bill_number_sequence (year, last_number)
     VALUES (year_val, 0)
     ON CONFLICT (year) DO UPDATE SET last_number = bill_number_sequence.last_number + 1;
     
     -- Get the updated number
     SELECT last_number INTO next_num
     FROM bill_number_sequence
     WHERE year = year_val;
     
     -- Format: BILL-YYYY-XXXX
     bill_num := 'BILL-' || year_val || '-' || LPAD(next_num::TEXT, 4, '0');
     RETURN bill_num;
   END;
   $$ LANGUAGE plpgsql;
   ```

**API Changes:**
- Modify `/api/sales` POST endpoint to auto-generate bill number if not provided
- Allow manual override (optional field) for special cases
- Frontend: Make bill number field read-only with auto-generated value

**Frontend Changes:**
- Display bill number as read-only field (can be edited if needed for special cases)
- Show preview: "Next Bill Number: BILL-2026-0001"
- Add tooltip: "Bill number is auto-generated. Click to edit if needed."

**Benefits:**
- ✅ No duplicate bill numbers
- ✅ Consistent format
- ✅ Easy to track and reference
- ✅ Year-based organization

---

## 2. Enhanced Item Selection with Search

### Current State
- Dropdown list with all inventory items
- Format: `{dressName} ({dressType}) - {dressCode}`
- Hard to find items when list is long
- No visual preview of products

### Proposed Solution

#### **Multi-Modal Search Interface**

**Component Structure:**
1. **Search Input** (Primary method)
   - Real-time search as user types
   - Search by:
     - Dress Name (e.g., "Kurta", "Saree")
     - Dress Code (e.g., "LG-001")
     - Dress Type (e.g., "Kurtis", "Dresses")
     - Category (e.g., "Home Textiles")
   
2. **Product Grid View** (Visual selection)
   - Display items as cards with:
     - Product image (thumbnail)
     - Dress Name
     - Dress Code (prominent)
     - Dress Type
     - Current Stock (if available)
     - Selling Price
   - Click to select item
   - Filter by category/type

3. **Quick Filters**
   - Filter by Category (Kurtis, Dresses, Sarees, Home Textiles)
   - Filter by Stock Status (In Stock, Low Stock, Out of Stock)
   - Sort by: Name, Code, Price, Stock

**UI/UX Flow:**
```
[Add Item Button]
    ↓
[Modal Opens]
    ├─ [Search Bar: "Search by name, code, or type..."]
    ├─ [Filter Buttons: All | Kurtis | Dresses | Sarees | Home Textiles]
    ├─ [Product Grid]
    │   └─ [Product Card 1] [Product Card 2] [Product Card 3] ...
    └─ [Selected Item Preview]
```

**Implementation Details:**

**New Component: `ItemSelectionModal.tsx`**
- Search state management
- Filter state management
- Product grid rendering
- Selection handler

**API Enhancement:**
- Add search endpoint: `GET /api/inventory/search?q={query}&category={category}&inStock={boolean}`
- Return filtered and sorted results

**Features:**
- ✅ Real-time search
- ✅ Visual product selection
- ✅ Multiple search criteria
- ✅ Stock visibility
- ✅ Category filtering

---

## 3. Advanced Filtering by Party Name with Sales Summary

### Current State
- Basic search by party name (text input)
- No sales summary/aggregation
- No filter by specific party

### Proposed Solution

#### **Enhanced Filter Panel**

**Filter Options:**
1. **Party Filter**
   - Dropdown: "All Parties" (default) + list of all unique party names
   - OR: Search input with autocomplete
   - Shows count: "X sales for this party"

2. **Date Range Filter** (Enhanced)
   - Keep existing Month/Year filters
   - Add: Date Range picker (optional)
   - Quick filters: Today, This Week, This Month, This Year

3. **Sales Summary Card** (New)
   - When party is selected, show:
     - Total Sales Count: "X sales"
     - Total Revenue: "₹X,XXX"
     - Average Sale Value: "₹X,XXX"
     - Date Range: "From DD/MM/YYYY to DD/MM/YYYY"

**UI Layout:**
```
[Filter Panel]
├─ [Party Filter: Dropdown/Select]
│   └─ Options: "All Parties" | "Party 1" | "Party 2" | ...
├─ [Date Filters]
│   ├─ [Month Dropdown]
│   └─ [Year Dropdown]
└─ [Sales Summary Card] (shown when party selected)
    ├─ Total Sales: X
    ├─ Total Revenue: ₹X,XXX
    └─ Average Sale: ₹X,XXX
```

**Implementation:**

**Frontend:**
- Add party filter dropdown (populated from unique `party_name` values)
- Calculate and display sales summary when party is selected
- Update sales list based on selected party

**API Enhancement:**
- Modify `GET /api/sales` to accept `partyName` query parameter
- Add endpoint: `GET /api/sales/summary?partyName={name}&startDate={date}&endDate={date}`
  - Returns: `{ totalSales, totalRevenue, averageSale, dateRange }`

**Features:**
- ✅ Filter by specific party
- ✅ Sales summary for selected party
- ✅ Revenue tracking per party
- ✅ Easy party selection

---

## 4. Stock Validation Before Adding Items

### Current State
- No stock validation when adding items
- Items can be added even if out of stock
- Stock is only checked when sale is finalized

### Proposed Solution

#### **Real-Time Stock Validation**

**Validation Points:**
1. **When Selecting Item**
   - Check `currentStock` from inventory
   - If stock = 0: Show warning, disable "Add to Sale" button
   - If stock > 0: Show available stock, allow selection

2. **When Entering Quantity**
   - Validate: `quantity <= currentStock`
   - Real-time feedback:
     - ✅ Green: "In Stock (X available)"
     - ⚠️ Yellow: "Low Stock (X available)"
     - ❌ Red: "Out of Stock" or "Only X available"

3. **Visual Indicators**
   - Stock badge on product card:
     - Green badge: "In Stock (X)"
     - Yellow badge: "Low Stock (X)"
     - Red badge: "Out of Stock"
   - Disable selection for out-of-stock items

**Error Messages:**
- "This item is out of stock. Current stock: 0"
- "Insufficient stock. Available: X, Requested: Y"
- "Please reduce quantity. Only X units available."

**Implementation:**

**Frontend:**
- Fetch stock information when loading inventory
- Validate stock when item is selected
- Validate quantity when user enters it
- Show real-time feedback

**API:**
- Ensure inventory API returns `currentStock` for each item
- Add validation in sales API before creating sale

**Stock Status Logic:**
```typescript
function getStockStatus(stock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (stock === 0) return 'out_of_stock'
  if (stock <= 5) return 'low_stock'  // Configurable threshold
  return 'in_stock'
}
```

**Features:**
- ✅ Prevent adding out-of-stock items
- ✅ Real-time stock validation
- ✅ Clear visual feedback
- ✅ Quantity validation
- ✅ Prevents overselling

---

## Implementation Priority & Phases

### Phase 1: Critical (Week 1)
1. ✅ Auto-generated bill numbers
2. ✅ Stock validation

### Phase 2: High Priority (Week 2)
3. ✅ Enhanced item selection with search

### Phase 3: Nice to Have (Week 3)
4. ✅ Advanced filtering with sales summary

---

## Technical Considerations

### Database Migrations
- Create `bill_number_sequence` table
- Add indexes for performance:
  - `idx_sales_party_name` on `sales.party_name`
  - `idx_sales_date` on `sales.date`
  - `idx_inventory_dress_code` on `inventory.dress_code` (if not exists)

### Performance
- Index party names for fast filtering
- Cache inventory list for search (with stock updates)
- Paginate product grid if inventory is large (>100 items)

### User Experience
- Loading states for search/filter operations
- Error messages with actionable guidance
- Success confirmations
- Keyboard shortcuts (e.g., Enter to add item)

### Backward Compatibility
- Existing sales with manual bill numbers remain valid
- Allow manual bill number override for special cases
- Migration script to backfill bill numbers for existing sales (optional)

---

## Questions for Review

1. **Bill Number Format:**
   - Prefer `BILL-YYYY-XXXX` (year-based) or `BILL-XXXXX` (continuous)?
   - Should we allow manual override?

2. **Item Selection:**
   - Prefer search-first or grid-first interface?
   - How many products typically in inventory? (affects pagination need)

3. **Stock Validation:**
   - What's the "low stock" threshold? (suggested: 5 units)
   - Should we allow adding out-of-stock items with a warning? (not recommended)

4. **Sales Summary:**
   - Should summary include all time or only filtered date range?
   - Any additional metrics needed? (e.g., profit margin, item count)

---

## Next Steps

1. **Review this proposal** and provide feedback
2. **Confirm preferences** for bill number format and UI choices
3. **Approve implementation plan** or suggest modifications
4. **Begin implementation** in phases as outlined above

---

## Estimated Development Time

- **Phase 1:** 2-3 days
- **Phase 2:** 3-4 days
- **Phase 3:** 2-3 days
- **Total:** ~7-10 days

---

*Document created: 2026-01-17*
*Last updated: 2026-01-17*


# Purchase Order Selective Update - Testing Guide

## Changes Made

### 1. Product Selector Enhancement
**File**: `app/admin/purchases/components/ProductSelector.tsx`

**Changes**:
- Now loads ALL products from the purchase order on initial mount
- Users can see the complete product list immediately
- Search functionality filters the list in real-time
- Empty search shows all products (not an empty state)

**Before**: Users had to search to see any products
**After**: All products are displayed by default, search filters them

### 2. Search Service Update
**File**: `lib/services/product-search-service.ts`

**Changes**:
- Modified `searchProducts()` to return all items when query is empty
- Maintains limit functionality (max 100 products by default)
- Preserves all existing search capabilities (name, SKU, category, fabric)

### 3. UI Improvements
- Updated placeholder text to indicate search is optional
- Added helpful message showing product count when viewing all products
- Better loading state messaging

## Testing the Feature

### Prerequisites
1. Database must be running (Neon PostgreSQL)
2. Run migration: `npm run migrate:selective-update`
3. Start dev server: `npm run dev`

### Test Workflow

#### Step 1: Access Purchase Orders
1. Navigate to `/admin/purchases`
2. Find any purchase order with multiple products
3. Click the "Edit" button

#### Step 2: Select Workflow
1. Modal appears with two options:
   - "Update Specific Products" ✅ (Select this)
   - "Update All Products"

#### Step 3: Product Selection (NEW BEHAVIOR)
1. **Product Selector opens showing ALL products immediately**
2. You should see:
   - Complete list of all products in the PO
   - Product images, names, categories, prices
   - Checkboxes for selection
   - "Select All" button
   - Selection count at bottom

3. **Test Search Functionality**:
   - Type a product name → list filters in real-time
   - Clear search → all products reappear
   - Search by category → filters by category
   - Search by fabric → filters by fabric type

4. **Test Selection**:
   - Click individual products to select/deselect
   - Use "Select All" to select all visible products
   - Use "Deselect All" to clear selection
   - Locked products (with pending approvals) cannot be selected

5. Click "Edit Selected" when ready

#### Step 4: Edit Selected Products
1. Form opens with ONLY selected products
2. Edit any fields:
   - Product name
   - Category
   - Sizes
   - Fabric type
   - Quantity
   - Wholesale price (pricePerPiece)
   - Selling price
   - Product images (add/remove)

3. Click "Submit for Approval"

#### Step 5: Approval Workflow
1. Navigate to `/admin/approvals`
2. Find the pending approval request
3. Review before/after comparison
4. Click "Approve" or "Reject"

#### Step 6: Verify Changes
1. **If Approved**:
   - Purchase order is updated with new values
   - Inventory is automatically synced
   - Products are unlocked for future edits

2. **If Rejected**:
   - Changes are discarded
   - Products are unlocked
   - Original data remains unchanged

## Key Features to Test

### ✅ Product Listing
- [ ] All products load immediately on selector open
- [ ] Products display with images, names, prices
- [ ] Locked products show "Pending Changes" badge
- [ ] Product count is accurate

### ✅ Search & Filter
- [ ] Search filters products in real-time
- [ ] Empty search shows all products
- [ ] Search works for: name, category, fabric
- [ ] Search is case-insensitive
- [ ] Debouncing prevents excessive API calls

### ✅ Selection
- [ ] Individual product selection works
- [ ] "Select All" selects all unlocked products
- [ ] "Deselect All" clears selection
- [ ] Selection count updates correctly
- [ ] Locked products cannot be selected
- [ ] "Edit Selected" button disabled when nothing selected

### ✅ Editing
- [ ] Only selected products appear in edit form
- [ ] Current values are pre-filled
- [ ] All fields are editable
- [ ] Image upload/removal works
- [ ] Form validation works

### ✅ Approval
- [ ] Approval request created successfully
- [ ] Before/after comparison shows correctly
- [ ] Approve action updates PO and inventory
- [ ] Reject action discards changes
- [ ] Products unlock after approval/rejection

### ✅ Concurrent Edits
- [ ] Cannot edit products with pending approvals
- [ ] Can edit different products in same PO
- [ ] Lock indicator shows correctly

## Expected Behavior

### Product Selector Initial State
```
┌─────────────────────────────────────────┐
│ Select Products                    [X]  │
├─────────────────────────────────────────┤
│ [🔍] Search by product name...          │
│ Showing all 25 products. Use search...  │
├─────────────────────────────────────────┤
│ ☐ [IMG] Blue Cotton Dress               │
│         Category: Dress | Fabric: Cotton│
│         Qty: 10 | Price: ₹500           │
├─────────────────────────────────────────┤
│ ☐ [IMG] Red Silk Saree                  │
│         Category: Saree | Fabric: Silk  │
│         Qty: 5 | Price: ₹2000           │
├─────────────────────────────────────────┤
│ ... (all products listed)               │
├─────────────────────────────────────────┤
│ Select All (25)  Deselect All           │
│                  0 products selected    │
│                  [Cancel] [Edit Selected]│
└─────────────────────────────────────────┘
```

### After Searching "cotton"
```
┌─────────────────────────────────────────┐
│ Select Products                    [X]  │
├─────────────────────────────────────────┤
│ [🔍] cotton                             │
├─────────────────────────────────────────┤
│ ☐ [IMG] Blue Cotton Dress               │
│ ☐ [IMG] White Cotton Shirt              │
│ ☐ [IMG] Cotton Blend Kurta              │
├─────────────────────────────────────────┤
│ Select All (3)  Deselect All            │
│                  0 products selected    │
│                  [Cancel] [Edit Selected]│
└─────────────────────────────────────────┘
```

## Troubleshooting

### Products Not Loading
- Check browser console for errors
- Verify purchase order has items
- Check API endpoint: `/api/purchases/[id]/products/search?q=`

### Search Not Working
- Clear browser cache
- Check network tab for API calls
- Verify search service is deployed

### Selection Not Working
- Check if products are locked
- Verify JavaScript console for errors
- Ensure product IDs are present

## Database Migration

If migration hasn't been run yet:

```bash
npm run migrate:selective-update
```

This creates:
- `staged_po_changes` table
- `po_product_locks` table
- `inventory_sync_log` table

## API Endpoints

### Product Search
```
GET /api/purchases/[id]/products/search?q=query&limit=100
```

### Get Locked Products
```
GET /api/purchases/[id]/locks
```

### Submit Selective Update
```
POST /api/purchases/[id]/selective-update
Body: { productIds: [...], changes: {...} }
```

### Approval Action
```
POST /api/approvals/[id]/action
Body: { action: 'approve' | 'reject', comments: '...' }
```

## Success Criteria

✅ Users can see all products immediately without searching
✅ Search filters the product list in real-time
✅ Selection and editing workflow works smoothly
✅ Approval process updates both PO and inventory
✅ Concurrent edit prevention works correctly
✅ UI is intuitive and responsive

## Next Steps

After testing:
1. Verify inventory sync is working correctly
2. Test with large purchase orders (100+ products)
3. Test concurrent user scenarios
4. Verify tenant isolation (if applicable)
5. Test error handling (network failures, etc.)

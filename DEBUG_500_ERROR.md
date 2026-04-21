# Debugging 500 Error - Product Search API

## Error Observed
```
GET /api/purchases/52/products/search?q= 500 in 1606ms
```

## Changes Made to Debug

### 1. Updated API to Handle Next.js 15 Params
**File**: `app/api/purchases/[id]/products/search/route.ts`

**Issue**: In Next.js 15, `params` might be a Promise that needs to be awaited.

**Fix**:
```typescript
// BEFORE
{ params }: { params: { id: string } }

// AFTER
{ params }: { params: Promise<{ id: string }> | { id: string } }

// Then await if needed
const resolvedParams = params instanceof Promise ? await params : params
```

### 2. Added Detailed Error Logging
Added comprehensive logging to track the error:

```typescript
console.error('Product search error:', error)
console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
console.error('Error details:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    type: typeof error,
    error: JSON.stringify(error, null, 2)
})
```

### 3. Added Debug Console Logs
Added logging at each step to identify where the error occurs:

```typescript
console.log('[Product Search] Starting search for PO:', resolvedParams.id)
console.log('[Product Search] Query:', searchQuery, 'Limit:', limit)
console.log('[Product Search] Fetching PO from database...')
console.log('[Product Search] PO query result:', { rowCount, hasItems, itemCount })
console.log('[Product Search] Items to search:', items.length)
console.log('[Product Search] Search complete:', { found, total, limited })
```

### 4. Improved Frontend Error Display
**File**: `app/admin/purchases/components/ProductSelector.tsx`

Updated to show the actual error message from the API:

```typescript
if (response.ok && data.success) {
    // Success handling
} else {
    const errorMsg = data.message || data.error || 'Search failed'
    setError(errorMsg)
    console.error('Search API error:', data)
}
```

## How to Debug

### Step 1: Check Browser Console
Open browser DevTools (F12) and check the Console tab for:
- Frontend error messages
- API response details

### Step 2: Check Server Terminal
Look at the terminal where `npm run dev` is running for:
- `[Product Search]` log messages
- Error stack traces
- Database query errors

### Step 3: Check Network Tab
In browser DevTools, go to Network tab:
- Find the failed request to `/api/purchases/52/products/search?q=`
- Click on it
- Check the Response tab for error details
- Check the Preview tab for JSON structure

## Common Causes of 500 Error

### 1. Database Connection Issue
**Symptoms**:
- Error mentions "ECONNREFUSED" or "connection"
- Logs show database query failing

**Solution**:
- Verify DATABASE_URL in .env
- Check if database is accessible
- Test connection: `npm run check-env`

### 2. Invalid Purchase Order ID
**Symptoms**:
- Logs show "Purchase order not found" (should be 404, not 500)
- PO ID is not a valid format

**Solution**:
- Verify the PO exists in database
- Check if ID is being passed correctly

### 3. Malformed Items Data
**Symptoms**:
- Error occurs when parsing items
- Items field is not valid JSON

**Solution**:
- Check purchase_orders table
- Verify items column contains valid JSON array

### 4. Search Service Error
**Symptoms**:
- Error occurs in searchProducts function
- Items array has unexpected structure

**Solution**:
- Check if items have required fields
- Verify PurchaseOrderItem interface matches data

### 5. Next.js 15 Params Issue
**Symptoms**:
- Error about "params.id is undefined"
- Params not being resolved

**Solution**:
- Already fixed with Promise handling
- Restart dev server to apply changes

## Testing the Fix

### 1. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Start fresh
npm run dev
```

### 2. Open Browser DevTools
```
F12 or Right-click → Inspect
Go to Console tab
```

### 3. Try the Feature
1. Navigate to `/admin/purchases`
2. Click "Edit" on purchase order #52
3. Select "Update Specific Products"
4. Watch the console for logs

### 4. Check Logs
Look for these messages in terminal:
```
[Product Search] Starting search for PO: 52
[Product Search] Query:  Limit: 100
[Product Search] Fetching PO from database...
[Product Search] PO query result: { rowCount: 1, hasItems: true, itemCount: 25 }
[Product Search] Items to search: 25
[Product Search] Search complete: { found: 25, total: 25, limited: false }
```

If you see an error instead, note which step it fails at.

## Expected Behavior After Fix

### Success Case
```
GET /api/purchases/52/products/search?q= 200 in 150ms
```

Browser shows:
- All products listed
- No error message
- "Showing all X products" message

### Error Cases

#### 404 - Purchase Order Not Found
```json
{
  "error": "Purchase order not found"
}
```

#### 400 - Invalid Limit
```json
{
  "error": "Limit must be between 1 and 1000"
}
```

#### 500 - Server Error
```json
{
  "success": false,
  "error": "Failed to search products",
  "message": "Detailed error message",
  "details": "Stack trace (in development)"
}
```

## Next Steps

1. **Restart the dev server** to apply changes
2. **Try the feature again** and check console/terminal
3. **Share the error logs** if issue persists:
   - Browser console errors
   - Terminal server logs
   - Network response details

## Files Modified

1. `app/api/purchases/[id]/products/search/route.ts`
   - Added Promise handling for params
   - Added detailed error logging
   - Added debug console logs

2. `app/admin/purchases/components/ProductSelector.tsx`
   - Improved error message display
   - Added response.ok check

## Rollback (if needed)

If these changes cause issues, you can revert by:

```bash
git diff app/api/purchases/[id]/products/search/route.ts
git checkout app/api/purchases/[id]/products/search/route.ts
```

Or manually remove the console.log statements and revert the params type.

# Fix: Column "items" Does Not Exist Error

## Problem
```
column "items" does not exist
```

The API was trying to query a column `items` from the `purchase_orders` table, but this column doesn't exist in the database schema.

## Root Cause

The purchase orders system uses a **relational schema** with a separate table for items:

```sql
purchase_orders (main table)
  ├── id
  ├── date
  ├── supplier_id
  ├── subtotal
  ├── gst_amount
  └── grand_total

purchase_order_items (items table)
  ├── id
  ├── purchase_order_id (foreign key)
  ├── product_name
  ├── category
  ├── sizes
  ├── fabric_type
  ├── quantity
  ├── price_per_piece
  ├── total_amount
  └── product_images
```

The API was incorrectly assuming items were stored as a JSON column in the main table.

## Solution

Updated the API query to **JOIN** the `purchase_order_items` table and aggregate the results:

### Before (Incorrect)
```sql
SELECT items, tenant_id 
FROM purchase_orders 
WHERE id = $1
```

### After (Correct)
```sql
SELECT po.id, po.tenant_id, 
       json_agg(
           json_build_object(
               'id', poi.id::text,
               'productName', poi.product_name,
               'category', poi.category,
               'sizes', poi.sizes,
               'fabricType', poi.fabric_type,
               'quantity', poi.quantity,
               'pricePerPiece', poi.price_per_piece,
               'totalAmount', poi.total_amount,
               'productImages', poi.product_images
           )
       ) as items
FROM purchase_orders po
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
WHERE po.id = $1
GROUP BY po.id, po.tenant_id
```

This query:
1. Joins `purchase_orders` with `purchase_order_items`
2. Aggregates all items into a JSON array
3. Returns the same structure the API expects

## Files Modified

**`app/api/purchases/[id]/products/search/route.ts`**
- Updated database query to use JOIN instead of direct column access
- Query now fetches items from `purchase_order_items` table
- Aggregates items into JSON format matching PurchaseOrderItem interface

## Testing

After this fix, the API should:

1. ✅ Successfully fetch purchase order items
2. ✅ Return items in the correct format
3. ✅ Display all products in the Product Selector
4. ✅ Allow searching and filtering

### Expected Response
```json
{
  "success": true,
  "products": [
    {
      "id": "123",
      "productName": "Blue Cotton Dress",
      "category": "Dress",
      "sizes": ["S", "M", "L"],
      "fabricType": "Cotton",
      "quantity": 10,
      "pricePerPiece": 500,
      "totalAmount": 5000,
      "productImages": ["https://..."]
    }
  ],
  "total": 25,
  "limited": false,
  "query": "",
  "limit": 100
}
```

## Verification Steps

1. **Restart dev server**:
   ```bash
   npm run dev
   ```

2. **Test the feature**:
   - Go to `/admin/purchases`
   - Click "Edit" on any purchase order
   - Select "Update Specific Products"
   - You should now see all products listed!

3. **Check logs**:
   Terminal should show:
   ```
   [Product Search] Starting search for PO: 52
   [Product Search] Query:  Limit: 100
   [Product Search] Fetching PO and items from database...
   [Product Search] PO query result: { rowCount: 1, hasItems: true, itemCount: 25 }
   [Product Search] Items to search: 25
   [Product Search] Search complete: { found: 25, total: 25, limited: false }
   ```

## Why This Happened

The spec and implementation assumed a JSON column structure (common in modern apps), but the actual database uses a traditional relational structure with a separate items table. This is actually a better design for:

- ✅ Better query performance
- ✅ Easier to update individual items
- ✅ Better data integrity with foreign keys
- ✅ More flexible for complex queries

## Related APIs to Update

Other APIs that might have the same issue:

1. **Selective Update API** (`app/api/purchases/[id]/selective-update/route.ts`)
   - Needs to update `purchase_order_items` table
   - Should use UPDATE/INSERT on items table

2. **Product Locks API** (`app/api/purchases/[id]/locks/route.ts`)
   - Should reference `purchase_order_items.id` for product IDs

3. **Approval Action API** (`app/api/approvals/route.ts`)
   - When applying changes, update `purchase_order_items` table

Let me check these files next...

## Status

✅ **FIXED** - Product Search API now correctly queries the relational schema
⏳ **PENDING** - Need to verify other APIs use correct schema
⏳ **PENDING** - Test end-to-end workflow

## Next Steps

1. Restart dev server
2. Test product selection
3. Verify other APIs (selective update, locks, approvals)
4. Update those APIs if they have similar issues

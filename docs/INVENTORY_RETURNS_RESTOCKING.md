# Inventory & Returns Enhancements Plan

## 1. Return Policy (7 Days Post-Sale)

### Requirement
- Customers can return items within 7 days of purchase.
- The system should track the sale date and validation against the return window.

### Implementation Plan
- **Database**: Add `return_status` and `returned_at` columns to `sale_items` table.
- **Frontend**:
    - Add "Return Item" button in `Sales History` or `Invoice Details` page.
    - Validate if `currentDate - saleDate <= 7 days`.
    - If valid, allow return processing (restock item or mark as damaged/discarded).
- **Backend API**:
    - `POST /api/sales/[id]/return`: Handle return logic, update inventory count, update sales total (if refunding), and log the return.

## 2. Balance Stock Value Calculation

### A. Purchase Order (Stock Remaining with Supplier)
- **Concept**: Value of items purchased from a supplier that are currently in stock.
- **Formula**: `Count(Items from Supplier in Inventory) * Wholesale Price`
- **Implementation**:
    - This requires linking inventory items back to their specific Purchase Order or Supplier.
    - Currently, `inventory` has `supplier_name` and `wholesale_price`.
    - We need to aggregate this value per supplier.
    - **New Dashboard Widget**: "Supplier Stock Value"
    - **Query**: `SELECT supplier_name, SUM(wholesale_price) as total_value FROM inventory GROUP BY supplier_name`

### B. Inventory Stock Value (Selling Price)
- **Concept**: Total potential revenue from current stock.
- **Formula**: `Count(Stock) * Selling Price`
- **Implementation**:
    - **Dashboard Update**: Add "Total Inventory Value (Retail)" card.
    - **Query**: `SELECT SUM(selling_price) as total_retail_value FROM inventory`

## 3. Restocking Workflow (Existing Supplier)

### Requirement
- Easily add more stock for existing items from existing suppliers without re-entering all details.

### Implementation Plan
- **UI Flow**:
    1.  Go to **Inventory**.
    2.  Find the item to restock.
    3.  Click **Restock** button.
    4.  **Modal Opens**: Pre-filled with item details (Name, Type, Supplier, Cost Price).
    5.  **User Inputs**:
        - New Quantity (or add individual barcodes/items if tracking uniquely).
        - Confirm Supplier & Prices (editable if changed).
    6.  **Action**:
        - Creates a new `Purchase Order` for the restocking.
        - Adds new entries to `inventory` table (since we track individual items?). *Note: Need to verify if `inventory` is quantity-based or item-based.*
        - *Correction*: Based on previous schema, `inventory` seems to be item-based (each row is an item? or does it have a quantity field?). Let's check schema.
        - If `inventory` has `quantity` field, update it. If it's individual rows per item, insert new rows.

### Schema Check Required
- Check `inventory` table definition. Does it have `quantity`?
- Check `purchase_orders` table definition.

## 4. Next Steps
1.  Verify `inventory` schema for quantity vs individual item tracking.
2.  Implement Return Policy logic and UI.
3.  Implement Stock Value Dashboard Widgets.
4.  Implement Restock Modal and Backend Logic.

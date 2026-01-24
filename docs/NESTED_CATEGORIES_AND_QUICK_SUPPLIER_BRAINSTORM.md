# NESTED CATEGORIES & QUICK SUPPLIER CREATION
## Feature Brainstorm & Implementation Plan

**Version:** 1.0  
**Last Updated:** 2026-01-17  
**Status:** Planning - Awaiting Review

---

## OVERVIEW

This document outlines the approach for implementing three key features:

1. **Nested Categories (Sub-categories)** - Allow admin to create categories with sub-categories
2. **Quick Supplier Creation** - Add "+" button to create suppliers on-the-fly during Purchase Order creation
3. **Category/Subcategory Selection in Purchase Orders** - Show hierarchical category selection in purchase order flow

---

## FEATURE 1: NESTED CATEGORIES (SUB-CATEGORIES)

### 1.1 Problem Statement

Currently, categories are flat (single level). Admin wants to:
- Create parent categories (e.g., "Kurtis")
- Create sub-categories under parent categories (e.g., "Kurtis" → "Anarkali Kurtis", "Straight Kurtis", "A-Line Kurtis")
- Support multiple levels of nesting (if needed in future)
- Use these nested categories in Purchase Orders and Inventory

### 1.2 Database Schema Changes

#### Option A: Self-Referencing Foreign Key (Recommended)

```sql
-- Add parent_id column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Add display_order for sorting sub-categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing categories to have parent_id = NULL (root categories)
UPDATE categories SET parent_id = NULL WHERE parent_id IS NULL;
```

**Structure:**
```
categories
├── id (PK)
├── name
├── description
├── parent_id (FK → categories.id, NULL for root categories)
├── display_order
├── created_at
└── updated_at
```

**Example Data:**
```
id | name           | parent_id | display_order
1  | Kurtis         | NULL      | 1
2  | Dresses        | NULL      | 2
3  | Sarees         | NULL      | 3
4  | Anarkali       | 1         | 1
5  | Straight       | 1         | 2
6  | A-Line         | 1         | 3
7  | Casual Dresses  | 2         | 1
8  | Formal Dresses | 2         | 2
```

#### Option B: Adjacency List with Path (Alternative)

```sql
-- Add path column for easier querying
ALTER TABLE categories ADD COLUMN IF NOT EXISTS path VARCHAR(500);
-- Example: "1/4" means category 4 is under category 1
```

**Pros of Option A:**
- Simple and standard approach
- Easy to query children/parents
- Supports unlimited nesting levels
- Standard SQL pattern

**Cons of Option A:**
- Requires recursive queries for full tree (PostgreSQL supports this)
- Slightly more complex queries

### 1.3 API Changes

#### GET /api/categories

**Current:** Returns flat list of categories

**New:** Return hierarchical structure

```typescript
// Option 1: Return flat list with parent_id, client builds tree
GET /api/categories
Response: {
  success: true,
  data: [
    { id: "1", name: "Kurtis", parentId: null, ... },
    { id: "4", name: "Anarkali", parentId: "1", ... }
  ]
}

// Option 2: Return nested tree structure
GET /api/categories?format=tree
Response: {
  success: true,
  data: [
    {
      id: "1",
      name: "Kurtis",
      children: [
        { id: "4", name: "Anarkali", children: [] },
        { id: "5", name: "Straight", children: [] }
      ]
    }
  ]
}
```

**Recommendation:** Return flat list with `parentId`, let frontend build tree. More flexible.

#### POST /api/categories

**New Request Body:**
```json
{
  "name": "Anarkali",
  "description": "Anarkali style kurtis",
  "parentId": "1",  // Optional - if provided, creates sub-category
  "displayOrder": 1
}
```

#### PUT /api/categories/[id]

**New Request Body:**
```json
{
  "name": "Anarkali Kurtis",
  "description": "Updated description",
  "parentId": "1",  // Can change parent
  "displayOrder": 2
}
```

**Validation:**
- Cannot set parent to itself
- Cannot set parent to a descendant (prevent circular references)
- When moving category, update all descendants' paths

#### DELETE /api/categories/[id]

**New Behavior:**
- If category has children, either:
  - Option A: Prevent deletion, show error "Cannot delete category with sub-categories"
  - Option B: Cascade delete all children (dangerous)
  - Option C: Move children to parent's parent (or root if parent is root)

**Recommendation:** Option A (prevent deletion) with option to delete children first or move them.

### 1.4 Frontend Changes

#### Category Management Page (`app/admin/categories/page.tsx`)

**Current:** Simple table with flat list

**New:** Tree view with expand/collapse

**UI Options:**

**Option 1: Tree Table View**
```
┌─────────────────────────────────────────────┐
│ Category Management                         │
├─────────────────────────────────────────────┤
│ ➕ Add New Category                         │
├─────────────────────────────────────────────┤
│ Name              │ Description │ Actions   │
├─────────────────────────────────────────────┤
│ ▼ Kurtis          │ ...         │ Edit Delete│
│   ├─ Anarkali     │ ...         │ Edit Delete│
│   ├─ Straight     │ ...         │ Edit Delete│
│   └─ A-Line       │ ...         │ Edit Delete│
│ ▼ Dresses         │ ...         │ Edit Delete│
│   ├─ Casual       │ ...         │ Edit Delete│
│   └─ Formal       │ ...         │ Edit Delete│
│ Sarees            │ ...         │ Edit Delete│
└─────────────────────────────────────────────┘
```

**Option 2: Nested Accordion View**
```
┌─────────────────────────────────────────────┐
│ ➕ Add New Category                         │
├─────────────────────────────────────────────┤
│ ▼ Kurtis (3 sub-categories)                 │
│   ├─ Anarkali                               │
│   ├─ Straight                               │
│   └─ A-Line                                 │
│   [➕ Add Sub-category]                     │
│ ▼ Dresses (2 sub-categories)                │
│   ├─ Casual                                 │
│   └─ Formal                                 │
│   [➕ Add Sub-category]                     │
│ Sarees                                      │
└─────────────────────────────────────────────┘
```

**Recommendation:** Option 1 (Tree Table) - more compact, easier to scan.

**Modal Changes:**

**Add/Edit Category Modal:**
```
┌─────────────────────────────────────┐
│ Add New Category                    │
├─────────────────────────────────────┤
│ Category Name *                     │
│ [________________]                  │
│                                     │
│ Parent Category (Optional)         │
│ [Select parent... ▼]               │
│   ├─ None (Root Category)          │
│   ├─ Kurtis                         │
│   ├─ Dresses                        │
│   └─ Sarees                         │
│                                     │
│ Description (Optional)              │
│ [________________]                  │
│                                     │
│ Display Order                      │
│ [1]                                │
│                                     │
│ [Cancel] [Add Category]            │
└─────────────────────────────────────┘
```

**Features:**
- Dropdown to select parent category
- Show hierarchy in dropdown (e.g., "Kurtis > Anarkali")
- Prevent selecting self or descendants as parent
- Display order for sorting sub-categories

#### Purchase Order Page (`app/admin/purchases/page.tsx`)

**Current:** Simple category dropdown

**New:** Hierarchical category selection

**Option 1: Grouped Dropdown**
```
Category: [Select category... ▼]
  ├─ Kurtis
  │   ├─ Anarkali
  │   ├─ Straight
  │   └─ A-Line
  ├─ Dresses
  │   ├─ Casual Dresses
  │   └─ Formal Dresses
  └─ Sarees
```

**Option 2: Two-Level Selection**
```
Parent Category: [Kurtis ▼]
Sub-category:    [Anarkali ▼]
```

**Recommendation:** Option 1 (Grouped Dropdown) - cleaner UX, single selection.

**Implementation:**
- Use `<optgroup>` for grouping
- Or custom dropdown component with indentation
- Show full path in selected value (e.g., "Kurtis > Anarkali")

#### Inventory Page (`app/admin/inventory/page.tsx`)

**Similar changes as Purchase Order page:**
- Hierarchical category dropdown
- Show full path when selected

### 1.5 Migration Strategy

1. **Add `parent_id` column** to existing categories table
2. **Set all existing categories** to `parent_id = NULL` (root categories)
3. **Add `display_order` column** for sorting
4. **Update API** to support `parentId` in POST/PUT
5. **Update frontend** to show tree structure
6. **Backward compatibility:** Existing code using flat categories still works

### 1.6 Edge Cases & Validation

1. **Circular References:** Prevent category from being its own parent or descendant
2. **Orphaned Categories:** When parent is deleted, decide what to do with children
3. **Deep Nesting:** Limit nesting depth? (e.g., max 3 levels)
4. **Category Name Uniqueness:** Should be unique per parent level? Or globally?
   - Recommendation: Unique per parent level (e.g., "Anarkali" can exist under "Kurtis" and "Dresses")
5. **Moving Categories:** When changing parent, update all descendants

---

## FEATURE 2: QUICK SUPPLIER CREATION

### 2.1 Problem Statement

When creating Purchase Orders or Inventory items, admin often needs to add a new supplier. Currently, they must:
1. Cancel current form
2. Navigate to Suppliers page
3. Create supplier
4. Navigate back
5. Re-enter all form data

**Solution:** Add "+" button next to supplier dropdown to create supplier on-the-fly.

### 2.2 UI/UX Design

#### Purchase Order Page

**Current:**
```
Supplier: [Select supplier... ▼]
```

**New:**
```
Supplier: [Select supplier... ▼] [➕]
```

**When "+" is clicked:**
- Open modal/dialog for quick supplier creation
- Minimal required fields: Name, Phone
- Optional fields: Email, Address, GST details
- After creation:
  - Auto-refresh supplier dropdown
  - Auto-select newly created supplier
  - Keep all other form data intact

#### Inventory Page

**Similar implementation:**
```
Supplier Name: [________________] [➕]
```

**When "+" is clicked:**
- Same quick supplier creation modal
- After creation, auto-fill supplier name in form

### 2.3 Quick Supplier Creation Modal

**Design:**
```
┌─────────────────────────────────────┐
│ Quick Add Supplier                  │
├─────────────────────────────────────┤
│ Name *                              │
│ [________________]                  │
│                                     │
│ Phone *                            │
│ [________________]                  │
│                                     │
│ Email (Optional)                   │
│ [________________]                  │
│                                     │
│ Address (Optional)                  │
│ [________________]                  │
│                                     │
│ [Show Advanced Options ▼]          │
│   GST Number: [________]           │
│   GST Type: [Percentage ▼]         │
│   GST %: [____]                    │
│                                     │
│ [Cancel] [Add Supplier]            │
└─────────────────────────────────────┘
```

**Features:**
- Minimal form (Name, Phone required)
- Expandable "Advanced Options" for GST details
- Validation: Name and Phone required
- On success: Close modal, refresh supplier list, auto-select new supplier
- On error: Show error message, keep modal open

### 2.4 API Integration

**Use existing API:** `POST /api/suppliers`

**Request Body (Minimal):**
```json
{
  "name": "New Supplier",
  "phone": "9876543210",
  "email": "",  // Optional
  "address": ""  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "New Supplier",
    "phone": "9876543210",
    ...
  }
}
```

**Frontend Flow:**
1. User clicks "+" button
2. Open modal with form
3. User fills form and submits
4. Call `POST /api/suppliers`
5. On success:
   - Close modal
   - Call `GET /api/suppliers` to refresh list
   - Set `formData.supplierId = newSupplier.id`
   - Update supplier dropdown
6. On error: Show error message in modal

### 2.5 Implementation Details

#### Purchase Order Page

**Location:** Next to supplier dropdown in purchase order form

**Component Structure:**
```tsx
<div className="flex items-center gap-2">
  <select
    value={formData.supplierId}
    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
    className="flex-1 ..."
  >
    <option value="">Select supplier...</option>
    {suppliers.map(s => (
      <option key={s.id} value={s.id}>{s.name}</option>
    ))}
  </select>
  <button
    onClick={() => setShowQuickSupplierModal(true)}
    className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
    title="Add new supplier"
  >
    ➕
  </button>
</div>
```

**State Management:**
```tsx
const [showQuickSupplierModal, setShowQuickSupplierModal] = useState(false)
const [quickSupplierForm, setQuickSupplierForm] = useState({
  name: '',
  phone: '',
  email: '',
  address: '',
})
```

**Quick Supplier Creation Handler:**
```tsx
const handleQuickSupplierCreate = async (supplierData: any) => {
  try {
    const response = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplierData),
    })
    const result = await response.json()
    
    if (result.success) {
      // Refresh suppliers list
      await loadSuppliers()
      // Auto-select new supplier
      setFormData({ ...formData, supplierId: result.data.id })
      // Close modal
      setShowQuickSupplierModal(false)
      // Reset form
      setQuickSupplierForm({ name: '', phone: '', email: '', address: '' })
    } else {
      alert(result.message || 'Failed to create supplier')
    }
  } catch (error) {
    console.error('Failed to create supplier:', error)
    alert('Failed to create supplier')
  }
}
```

#### Inventory Page

**Similar implementation:**
- "+" button next to supplier name input
- Quick supplier modal
- After creation, auto-fill `formData.supplierName`

### 2.6 Edge Cases

1. **Duplicate Supplier:** If supplier with same name/phone exists, show warning or auto-select existing
2. **Form Validation:** Ensure name and phone are provided
3. **Network Errors:** Handle API failures gracefully
4. **Modal State:** Ensure modal closes properly, form resets

---

## FEATURE 3: CATEGORY/SUBCATEGORY SELECTION IN PURCHASE ORDERS

### 3.1 Current State

Purchase Orders currently have a simple category dropdown that shows flat list of categories.

### 3.2 New Requirements

- Show hierarchical category structure (parent > child)
- Allow selection of both parent categories and sub-categories
- Display selected category with full path (e.g., "Kurtis > Anarkali")

### 3.3 Implementation

**This is already covered in Feature 1.4 (Purchase Order Page changes).**

**Additional Considerations:**

1. **Category Display in Purchase Order Items:**
   - Show full path: "Kurtis > Anarkali"
   - Or show just sub-category name with parent in tooltip

2. **Filtering by Category:**
   - Update filter dropdown to show hierarchical structure
   - Filter by parent category should show all sub-categories

3. **Reports & Analytics:**
   - Group by parent category or sub-category
   - Show breakdown by category hierarchy

---

## IMPLEMENTATION PRIORITY

### Phase 1: Foundation (Week 1)
1. ✅ Database migration for nested categories
2. ✅ API updates for nested categories
3. ✅ Basic category tree display in Category Management page

### Phase 2: Integration (Week 2)
1. ✅ Quick Supplier Creation in Purchase Orders
2. ✅ Quick Supplier Creation in Inventory
3. ✅ Hierarchical category selection in Purchase Orders

### Phase 3: Polish (Week 3)
1. ✅ Hierarchical category selection in Inventory
2. ✅ Category filtering with hierarchy
3. ✅ Reports/analytics updates
4. ✅ Testing and bug fixes

---

## TECHNICAL CONSIDERATIONS

### Database Performance

**Nested Categories:**
- Use recursive CTE for tree queries (PostgreSQL supports this)
- Add indexes on `parent_id` for faster lookups
- Consider materialized path if tree is very deep

**Example Recursive Query:**
```sql
WITH RECURSIVE category_tree AS (
  -- Base case: root categories
  SELECT id, name, parent_id, 0 as level, ARRAY[id] as path
  FROM categories
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- Recursive case: children
  SELECT c.id, c.name, c.parent_id, ct.level + 1, ct.path || c.id
  FROM categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY path;
```

### Frontend Performance

**Category Tree Building:**
- Build tree structure on frontend from flat list
- Cache tree structure to avoid rebuilding
- Use memoization for expensive tree operations

**Example Tree Building:**
```typescript
function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>()
  const roots: CategoryNode[] = []
  
  // Create nodes
  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] })
  })
  
  // Build tree
  categories.forEach(cat => {
    const node = map.get(cat.id)!
    if (cat.parentId) {
      const parent = map.get(cat.parentId)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      roots.push(node)
    }
  })
  
  return roots
}
```

### Backward Compatibility

**Ensure:**
- Existing code using flat categories still works
- API returns both flat and tree formats (via query param)
- Migration doesn't break existing data
- Old purchase orders/inventory items still display correctly

---

## UI/UX MOCKUPS

### Category Management - Tree View

```
┌─────────────────────────────────────────────────────────────┐
│ Category Management                    [➕ Add New Category] │
├─────────────────────────────────────────────────────────────┤
│ Name              │ Description        │ Parent    │ Actions │
├─────────────────────────────────────────────────────────────┤
│ ▼ Kurtis (3)      │ Traditional kurtis │ -         │ ✏️ 🗑️   │
│   ├─ Anarkali     │ Flared style      │ Kurtis    │ ✏️ 🗑️   │
│   ├─ Straight     │ Straight cut      │ Kurtis    │ ✏️ 🗑️   │
│   └─ A-Line       │ A-line style      │ Kurtis    │ ✏️ 🗑️   │
│ ▼ Dresses (2)     │ Western dresses   │ -         │ ✏️ 🗑️   │
│   ├─ Casual       │ Casual wear       │ Dresses   │ ✏️ 🗑️   │
│   └─ Formal       │ Office wear       │ Dresses   │ ✏️ 🗑️   │
│ Sarees            │ Traditional sarees│ -         │ ✏️ 🗑️   │
└─────────────────────────────────────────────────────────────┘
```

### Purchase Order - Category Selection

```
┌─────────────────────────────────────┐
│ Purchase Order Item                │
├─────────────────────────────────────┤
│ Product Name: [___________]        │
│                                     │
│ Category: [Kurtis > Anarkali ▼]    │
│   ├─ Kurtis                        │
│   │   ├─ Anarkali                  │
│   │   ├─ Straight                   │
│   │   └─ A-Line                     │
│   ├─ Dresses                        │
│   │   ├─ Casual Dresses             │
│   │   └─ Formal Dresses             │
│   └─ Sarees                         │
│                                     │
│ Sizes: [___________]               │
│ ...                                 │
└─────────────────────────────────────┘
```

### Quick Supplier Creation

```
┌─────────────────────────────────────┐
│ Quick Add Supplier                  │
├─────────────────────────────────────┤
│ Name *                              │
│ [New Supplier Name        ]         │
│                                     │
│ Phone *                             │
│ [9876543210            ]            │
│                                     │
│ Email (Optional)                    │
│ [supplier@example.com  ]            │
│                                     │
│ Address (Optional)                  │
│ [123 Main St, City      ]           │
│                                     │
│ [▶ Show Advanced Options]           │
│                                     │
│ [Cancel] [Add Supplier]            │
└─────────────────────────────────────┘
```

---

## TESTING CHECKLIST

### Nested Categories
- [ ] Create root category
- [ ] Create sub-category under parent
- [ ] Create sub-category under sub-category (3 levels)
- [ ] Edit category name
- [ ] Move category to different parent
- [ ] Prevent circular reference (category as own parent)
- [ ] Prevent moving category to its descendant
- [ ] Delete category with children (should show error)
- [ ] Delete category without children (should work)
- [ ] Display category tree in Category Management page
- [ ] Select category in Purchase Order
- [ ] Select category in Inventory
- [ ] Filter purchase orders by category (parent and child)

### Quick Supplier Creation
- [ ] Click "+" button in Purchase Order form
- [ ] Create supplier with minimal fields (name, phone)
- [ ] Create supplier with all fields
- [ ] Verify supplier appears in dropdown after creation
- [ ] Verify newly created supplier is auto-selected
- [ ] Verify form data is preserved after supplier creation
- [ ] Handle duplicate supplier name/phone
- [ ] Handle API errors gracefully
- [ ] Click "+" button in Inventory form
- [ ] Verify supplier name is auto-filled in Inventory form

### Integration
- [ ] Create purchase order with nested category
- [ ] Create inventory item with nested category
- [ ] Filter by parent category shows all child categories
- [ ] Reports show category hierarchy correctly

---

## OPEN QUESTIONS FOR REVIEW

1. **Nesting Depth:** Should we limit nesting depth? (e.g., max 3 levels)
   - **Recommendation:** No limit, but warn if depth > 3

2. **Category Name Uniqueness:** Should category names be unique globally or per parent?
   - **Recommendation:** Unique per parent (e.g., "Anarkali" can exist under "Kurtis" and "Dresses")

3. **Deleting Categories with Children:** What should happen?
   - **Option A:** Prevent deletion, show error
   - **Option B:** Cascade delete all children
   - **Option C:** Move children to parent's parent (or root)
   - **Recommendation:** Option A (prevent deletion) with clear error message

4. **Display Order:** Should we add drag-and-drop reordering for sub-categories?
   - **Recommendation:** Phase 2 feature, use `display_order` for now

5. **Quick Supplier Modal:** Should it be a separate page or inline modal?
   - **Recommendation:** Inline modal (better UX, preserves form state)

6. **Supplier Auto-fill:** In Inventory, should we auto-fill supplier name or supplier ID?
   - **Recommendation:** Auto-fill supplier name (Inventory uses name, not ID)

7. **Category Selection:** Should we allow selecting parent category only, or require sub-category?
   - **Recommendation:** Allow both (flexibility for admin)

---

## NEXT STEPS

1. **Review this document** - Provide feedback on approach
2. **Clarify open questions** - Answer questions above
3. **Approve implementation plan** - Confirm approach is acceptable
4. **Begin implementation** - Start with Phase 1 (Database & API)

---

**Document Status:** Awaiting Review  
**Next Action:** User review and feedback

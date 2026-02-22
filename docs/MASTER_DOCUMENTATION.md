# 📋 Lalitha Garments Internal Tool — Documentation



This is the single source of truth combining all documentation for the **Lalitha Garments Inventory & Sales Management System (ERP)**.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Product Requirements (PRD)](#2-product-requirements-prd)
3. [System Architecture](#3-system-architecture)
4. [High Level Design (HLD)](#4-high-level-design-hld)
5. [Low Level Design (LLD)](#5-low-level-design-lld)
6. [RBAC — Role-Based Access Control](#6-rbac--role-based-access-control)
7. [Tenant Management Guide](#7-tenant-management-guide)
8. [Nested Categories & Quick Supplier Creation](#8-nested-categories--quick-supplier-creation)
9. [Research Module PRD](#9-research-module-prd)
10. [Multi-Branch Support PRD](#10-multi-branch-support-prd)
11. [YouTube Scripts — ERP Platform Launch](#11-youtube-scripts--erp-platform-launch)

# 1. Project Overview

Lalitha Garments is a **full-stack Next.js ERP application** built for a clothing retail business. It serves two user groups:

- **Admin Users (Internal):** Business owners and staff who manage inventory, purchases, sales, suppliers, and customers.
- **Public Users (Customers):** Browse the product catalogue and submit custom inquiries.

### Key Highlights

- 🎨 **Premium Design** — Modern UI with mobile-first responsive layout
- 📦 **Inventory Management** — Real-time stock tracking with multi-image support
- 🧾 **Sales & Purchases** — Full GST support, webcam sale proofs, Excel export
- 👥 **Multi-Tenant SaaS** — Supports multiple business tenants with data isolation
- 🔐 **RBAC Security** — Superadmin, Admin, and User roles
- 🤖 **AI Integration** — Groq-powered business AI assistant
- ☁️ **Cloudinary CDN** — All images stored and served via Cloudinary

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (via `pg`) |
| Images | Cloudinary |
| Auth | bcryptjs + Cookie Sessions |
| PDF/Excel | jspdf, xlsx (SheetJS) |
| AI | Groq (llama-3.3-70b-versatile) |

### Getting Started

```bash
npm install
npm run dev
# Open http://localhost:3000
```

**Environment Variables:**
```bash
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
AI_ADMIN_ROLLOUT_ENABLED=true
AI_TENANT_ROLLOUT_ENABLED=false
```

---

---

# 2. Product Requirements (PRD)

**Version:** 1.0 | **Status:** ✅ Production

## 2.1 Core Features

### Inventory Management
- Add / Edit / Delete inventory items
- Multiple images per product (via Cloudinary)
- Pricing: Standard, per piece, or per meter
- Product details: name, type, code, sizes, fabric, supplier
- Stock tracking: quantity in/out, current stock, bulk updates
- Search by code, name, or supplier
- Export to Excel

### Purchase Orders
- Create POs with multiple products
- Supplier management (multiple contact persons, GST config)
- GST calculation: percentage or fixed rupee amount
- Custom PO numbers + invoice image upload
- Filter by supplier, category, year/month
- Automatic stock increase on PO creation

### Sales Management
- Multi-item sales with customer linking
- Pricing: quantity-based or per meter
- Discount: percentage or rupee amount
- GST: percentage or fixed rupee amount
- Payment modes: Cash, UPI (PhonePe/Paytm), Bank Transfer
- Webcam sale proof capture with sticker overlay
- Automatic stock deduction on sale
- Profit calculation per sale
- Filter by month and year

### Supplier Management
- Add / Edit / Delete suppliers
- Multiple contact persons per supplier
- GST number, type (% or ₹), and value
- Contact details: address, email, phone, WhatsApp

### Customer Management
- Add / Edit / Delete customers
- Name, phone, email, address
- Link to sales for purchase history

### Catalogue Management
- Create catalogues / product collections
- Public-facing display for customers
- Category filters

### Business Setup
- Business profile: name, owner, contact, GST
- WhatsApp integration
- Guided setup wizard

### Custom Workflows
- Create workflows with multiple steps
- Visual drag-and-drop canvas
- Steps linked to app routes
- Displayed in setup wizard

### Dashboard
- Sales statistics (total sales, profit)
- Inventory overview (stock levels)
- Recent activity

### Authentication
- Admin login with bcrypt password hashing
- Cookie-based session management
- Multi-admin support

## 2.2 Technical Requirements

- **Image Storage:** Cloudinary (CDN, secure HTTPS URLs)
- **Database:** PostgreSQL with JSONB for arrays
- **Export:** Excel `.xlsx` with formatted columns
- **Performance:** Indexed DB columns, Cloudinary CDN, lazy-loaded images
- **Security:** bcrypt hashing, parameterized SQL queries, env vars for secrets

## 2.3 User Stories

| Role | Story |
|------|-------|
| Inventory Manager | Add products with multiple images, set pricing, track stock automatically |
| Purchase Manager | Create POs with multiple products, apply GST, upload invoice images |
| Sales Manager | Record sales with discount/GST, capture webcam proof, see profit |
| Business Owner | View dashboard stats, export to Excel, configure custom workflows |

## 2.4 Success Metrics

- All inventory items have images stored in Cloudinary
- Stock levels accurately tracked (in/out/current)
- Sales recorded with proof images
- Purchase orders linked to inventory
- Export functionality working
- All images served from Cloudinary CDN

---

---

# 3. System Architecture

**Version:** 1.0 | **Last Updated:** January 2025

## 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Admin UI   │  │  Public UI   │  │  Catalogue   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          └──────────────────┼──────────────────┘
                             │
          ┌─────────────────▼─────────────────┐
          │      Next.js Application           │
          │  ┌──────────────────────────────┐  │
          │  │     API Routes (Backend)     │  │
          │  │  - /api/inventory            │  │
          │  │  - /api/purchases            │  │
          │  │  - /api/sales                │  │
          │  │  - /api/suppliers            │  │
          │  │  - /api/customers            │  │
          │  │  - /api/upload               │  │
          │  │  - /api/auth                 │  │
          │  └──────────────┬───────────────┘  │
          └─────────────────┼──────────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │PostgreSQL │    │ Cloudinary │    │  File     │
    │ Database  │    │   (CDN)    │    │  System   │
    └───────────┘    └────────────┘    └───────────┘
```

## 3.2 Application Structure

```
/
├── app/
│   ├── admin/              # Admin dashboard pages
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── purchases/
│   │   ├── sales/
│   │   ├── suppliers/
│   │   ├── customers/
│   │   ├── catalogues/
│   │   ├── invoices/
│   │   ├── setup/
│   │   └── workflows/
│   ├── api/                # API routes
│   │   ├── auth/
│   │   ├── inventory/
│   │   ├── purchases/
│   │   ├── sales/
│   │   ├── suppliers/
│   │   ├── customers/
│   │   ├── catalogues/
│   │   ├── business/
│   │   ├── upload/
│   │   ├── stock-movements/
│   │   └── workflows/
│   ├── catalogue/          # Public catalogue
│   └── custom-inquiry/     # Public inquiry form
├── components/             # Shared React components
├── lib/                    # Utilities (db, auth, rbac)
├── scripts/                # DB init & migration scripts
├── docs/                   # Documentation (this file!)
└── migrations/             # SQL migration files
```

## 3.3 Data Flows

### Image Upload
```
User selects image → FormData → /api/upload →
Convert to base64 → Upload to Cloudinary →
Return secure URL → Store URL in PostgreSQL
```

### Purchase Order
```
Create PO → Validate → Calculate totals →
Insert purchase_orders → Insert purchase_order_items →
Update inventory (increase stock) → Return response
```

### Sale Recording
```
Record Sale → Calculate totals (discount + GST) →
Insert sales → Insert sale_items →
Update inventory (decrease stock) → Return response
```

## 3.4 Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `admins` | Admin user accounts |
| `business_profile` | Business information |
| `suppliers` | Supplier details with contacts |
| `customers` | Customer database |
| `inventory` | Product inventory |
| `purchase_orders` | Purchase order headers |
| `purchase_order_items` | Purchase order line items |
| `sales` | Sales headers |
| `sale_items` | Sales line items |
| `catalogues` | Product catalogues |
| `workflows` | Custom workflows |
| `workflow_steps` | Workflow step definitions |

### Relationships
```
suppliers (1) ──→ (many) purchase_orders
purchase_orders (1) ──→ (many) purchase_order_items
inventory (1) ──→ (many) sale_items
customers (1) ──→ (many) sales
sales (1) ──→ (many) sale_items
workflows (1) ──→ (many) workflow_steps
```

## 3.5 Security Architecture

- **Password Hashing:** bcryptjs (10 salt rounds)
- **Session Management:** HTTP-only cookie, 7-day expiry
- **Protected Routes:** All `/admin/*` pages require auth
- **SQL Injection:** Parameterized queries only
- **XSS Prevention:** React's built-in escaping

## 3.6 Deployment

**Recommended: Vercel / Render**
- Frontend: Next.js static/SSR
- API: Serverless functions
- Database: External PostgreSQL (Neon, Supabase, etc.)
- Images: Cloudinary (external CDN)

---

---

# 4. High Level Design (HLD)

**Version:** 1.0 | **Last Updated:** January 2025

## 4.1 Module Design

### Inventory Module
**Flow:** `User Action → Form Submit → API Route → Database → Response → UI Update`

**Key Features:**
- Multiple images per product
- Pricing options (piece / meter)
- Stock tracking (in/out)
- Supplier linking

### Purchase Order Module
**Flow:** `Create PO → Validate → Calculate Totals → Insert PO → Insert Items → Update Inventory → Return Response`

**Key Features:**
- Multi-product per order
- GST (percentage or rupees)
- Invoice image attachment
- Auto stock increase

### Sales Module
**Flow:** `Record Sale → Calculate Totals → Insert Sale → Insert Items → Update Inventory → Return Response`

**Key Features:**
- Multi-item sales
- Discount + GST options
- Per-meter pricing
- Webcam proof image
- Profit calculation

### Authentication Module
**Flow:** `Login → Validate → Create Session → Set Cookie → Redirect to Dashboard`

## 4.2 Data Models

### Inventory Item
```typescript
{
  id: string
  dressName: string
  dressType: string
  dressCode: string
  sizes: string[]
  wholesalePrice: number
  sellingPrice: number
  pricingUnit?: 'piece' | 'meter'
  pricePerPiece?: number
  pricePerMeter?: number
  productImages?: string[]  // Cloudinary URLs
  quantityIn: number
  quantityOut: number
  currentStock: number
}
```

### Purchase Order
```typescript
{
  id: string
  date: string
  supplierId: string
  supplierName: string
  customPoNumber?: string
  items: PurchaseOrderItem[]
  subtotal: number
  gstType?: 'percentage' | 'rupees'
  gstAmount?: number
  grandTotal: number
  invoiceImage?: string
}
```

### Sale
```typescript
{
  id: string
  date: string
  partyName: string
  customerId?: string
  billNumber: string
  items: SaleItem[]
  subtotal: number
  discountType?: 'percentage' | 'rupees'
  discountAmount?: number
  gstType?: 'percentage' | 'rupees'
  gstAmount?: number
  totalAmount: number
  saleImage?: string
}
```

## 4.3 API Endpoints

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List all items (with search) |
| POST | `/api/inventory` | Create item |
| PUT | `/api/inventory/[id]` | Update item |
| DELETE | `/api/inventory/[id]` | Delete item |

### Purchase Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchases` | List all orders (with filters) |
| POST | `/api/purchases` | Create order |
| PUT | `/api/purchases/[id]` | Update order |
| DELETE | `/api/purchases/[id]` | Delete order |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | List all sales (with filters) |
| POST | `/api/sales` | Create sale |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload image to Cloudinary |

### Standard Response Format
```json
{ "success": true, "data": { ... }, "message": "Optional message" }
```

## 4.4 Stock Management Design

| Operation | Effect |
|-----------|--------|
| Purchase Order Created | `quantity_in += qty`, `current_stock += qty` |
| Sale Recorded | `quantity_out += qty`, `current_stock -= qty` |
| Manual Adjustment | Direct stock update via API |

---

---

# 5. Low Level Design (LLD)

**Version:** 1.0 | **Last Updated:** January 2025

## 5.1 Database Schema (SQL)

### Inventory Table
```sql
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  dress_name VARCHAR(255) NOT NULL,
  dress_type VARCHAR(255) NOT NULL,
  dress_code VARCHAR(255) NOT NULL,
  sizes TEXT[] NOT NULL,
  wholesale_price DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  pricing_unit VARCHAR(20),
  price_per_piece DECIMAL(10, 2),
  price_per_meter DECIMAL(10, 2),
  image_url TEXT,
  product_images JSONB DEFAULT '[]',
  fabric_type VARCHAR(255),
  supplier_name VARCHAR(255),
  quantity_in INTEGER DEFAULT 0,
  quantity_out INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Purchase Orders Tables
```sql
CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  supplier_name VARCHAR(255) NOT NULL,
  custom_po_number VARCHAR(255),
  invoice_image TEXT,
  subtotal DECIMAL(10, 2),
  gst_type VARCHAR(20),
  gst_percentage DECIMAL(5, 2),
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  grand_total DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  sizes TEXT[],
  fabric_type VARCHAR(255),
  quantity INTEGER NOT NULL,
  price_per_piece DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  product_images TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sales Tables
```sql
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  party_name VARCHAR(255) NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  bill_number VARCHAR(255) NOT NULL,
  subtotal DECIMAL(10, 2),
  discount_type VARCHAR(20),
  discount_percentage DECIMAL(5, 2),
  discount_amount DECIMAL(10, 2),
  gst_type VARCHAR(20),
  gst_percentage DECIMAL(5, 2),
  gst_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2) NOT NULL,
  final_total DECIMAL(10, 2),
  payment_mode VARCHAR(50) NOT NULL,
  upi_transaction_id VARCHAR(255),
  sale_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  inventory_id INTEGER REFERENCES inventory(id),
  dress_name VARCHAR(255) NOT NULL,
  dress_type VARCHAR(255) NOT NULL,
  dress_code VARCHAR(255) NOT NULL,
  size VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  use_per_meter BOOLEAN DEFAULT FALSE,
  meters DECIMAL(10, 2),
  price_per_meter DECIMAL(10, 2),
  purchase_price DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  profit DECIMAL(10, 2) NOT NULL
);
```

## 5.2 Key Algorithms

### Stock Matching Algorithm (PO → Inventory)
```typescript
function matchInventoryItem(poItem, inventoryItems) {
  // 1. Exact dress code match
  const exactCode = inventoryItems.find(
    inv => inv.dressCode.toLowerCase() === poItem.productName.toLowerCase()
  )
  if (exactCode) return exactCode

  // 2. Exact name match
  const exactName = inventoryItems.find(
    inv => inv.dressName.toLowerCase() === poItem.productName.toLowerCase()
  )
  if (exactName) return exactName

  // 3. Partial name match
  const partial = inventoryItems.find(
    inv => inv.dressName.toLowerCase().includes(poItem.productName.toLowerCase())
  )
  if (partial) return partial

  // 4. Normalized match (remove special chars)
  const normPO = poItem.productName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  const normalized = inventoryItems.find(inv => {
    const normInv = inv.dressName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    return normInv === normPO
  })
  return normalized || null
}
```

### Sale Total Calculation
```typescript
// Subtotal (with per-meter support)
const subtotal = items.reduce((sum, item) => {
  const price = item.usePerMeter && item.meters
    ? item.pricePerMeter * item.meters
    : item.sellingPrice * item.quantity
  return sum + price
}, 0)

// Discount
const discount = discountType === 'percentage'
  ? (subtotal * discountValue) / 100
  : discountValue

const amountAfterDiscount = subtotal - discount

// GST
const gst = gstType === 'percentage'
  ? (amountAfterDiscount * gstValue) / 100
  : gstValue

const finalTotal = amountAfterDiscount + gst
```

### Stock Deduction (Sales)
```sql
UPDATE inventory SET
  quantity_out = quantity_out + $quantityToDeduct,
  current_stock = current_stock - $quantityToDeduct
WHERE id = $inventoryId
```

### Stock Addition (Purchase Orders)
```sql
UPDATE inventory SET
  quantity_in = quantity_in + $newQuantity,
  current_stock = current_stock + $newQuantity
WHERE id = $inventoryId
```

## 5.3 Utility Patterns

### Database Connection (`lib/db.ts`)
```typescript
import { Pool } from 'pg'
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
})
export async function query(text: string, params?: any[]) {
  return pool.query(text, params)
}
```

### Session Management
```typescript
// Create session
const token = Buffer.from(JSON.stringify({ adminId, email })).toString('base64')
response.cookies.set('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7 // 7 days
})
```

### Complex Join Query (Purchase Orders)
```sql
SELECT po.*,
  json_agg(
    json_build_object(
      'id', poi.id,
      'productName', poi.product_name,
      'quantity', poi.quantity,
      'pricePerPiece', poi.price_per_piece
    )
  ) FILTER (WHERE poi.id IS NOT NULL) as items
FROM purchase_orders po
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
GROUP BY po.id
ORDER BY po.date DESC
```

## 5.4 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Cloudinary credentials set
- [ ] Admin account created
- [ ] Images migrated to Cloudinary  
- [ ] Build passes without errors
- [ ] All API endpoints tested
- [ ] Export functionality tested

---

---

# 6. RBAC — Role-Based Access Control

## 6.1 Roles & Permissions

| Feature | Superadmin | Admin | User |
|---------|------------|-------|------|
| Inventory | ✅ Full | ✅ Full | ❌ |
| Purchases | ✅ Full | ✅ Full | ❌ |
| Sales | ✅ Full | ✅ Full | ❌ |
| Suppliers | ✅ Full | ✅ Full | ❌ |
| Customers | ✅ Full | ✅ Full | ❌ |
| Catalogues | ✅ Full | ✅ Full | ✅ View only |
| Admin Management | ✅ Full | ❌ | ❌ |
| User Management | ✅ Full | ✅ Create/Delete | ❌ |

## 6.2 Database Schema

```sql
-- Role column added to admins table
ALTER TABLE admins ADD COLUMN role VARCHAR(50) DEFAULT 'admin'
  CHECK (role IN ('superadmin', 'admin', 'user'));

-- Users table for regular users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6.3 Running the Migration

```bash
node scripts/run-migration.js
# Or manually:
psql $DATABASE_URL -f scripts/add-roles-migration.sql
```

## 6.4 RBAC Library (`lib/rbac.ts`)

```typescript
hasPermission(role: Role, resource: string, action: Permission['action']): boolean
canAccessRoute(role: Role, route: string): boolean
getCurrentUserRole(adminId: number): Promise<Role | null>
```

## 6.5 API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin` | Admin+ |
| POST | `/api/admin` | Superadmin only |
| PUT | `/api/admin` | Superadmin only |
| DELETE | `/api/admin` | Superadmin only |
| GET | `/api/users` | Admin+ |
| POST | `/api/users` | Admin+ |
| DELETE | `/api/users` | Admin+ |

## 6.6 Security Notes

1. Passwords hashed with bcrypt
2. Session includes role information
3. All API endpoints check role before executing
4. Users cannot delete their own admin account

---

---

# 7. Tenant Management Guide

> ⚠️ These features are available to **Superadmins only**

## 7.1 Edit Tenant Profile

1. Navigate to **Tenants** in sidebar
2. Click tenant name or **Manage** button
3. In "Business Information", click **Edit Profile**
4. Update: Business Name, Owner Name, Phone, WhatsApp, Address, GST Number, Subdomain
5. Click **Save Changes**

## 7.2 Delete a Tenant

### Soft Delete (Recommended)
- Marks tenant as "Cancelled"
- Removes their login access
- **Data is preserved** for records

### Hard Delete (Permanent)
- **Permanently removes** all tenant data including:
  - Account & credentials
  - Business profile
  - All sales & invoices
  - Inventory & products
  - Purchase orders & suppliers
  - Customers, reports & analytics
- ⚠️ This action is **irreversible**

**How to delete:**
1. From List View → click **Delete** button
2. From Details Page → scroll to "Danger Zone" → **Delete Tenant**
3. Type `SOFT` or `HARD` when prompted

## 7.3 Subscription Management

Click **Manage Plan** on Tenant Details page to:
- Upgrade/downgrade plans
- Change billing cycles
- Toggle specific modules

---

---

# 8. Nested Categories & Quick Supplier Creation

**Date:** 2026-01-17 | **Status:** ✅ Completed

## 8.1 Nested Categories

### Database Changes
```sql
ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0;
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
```

### How to Use
1. Go to **Admin → Categories**
2. Click **Add New Category**
3. Select a parent category (optional — empty = root)
4. Set display order (optional)
5. Save

### Tree View Example
```
▼ Kurtis (3)
    ├─ Anarkali
    ├─ Straight
    └─ A-Line
▼ Dresses (2)
    ├─ Casual
    └─ Formal
  Sarees
```

### Features
- ✅ Unlimited nesting levels
- ✅ Expand/collapse tree view
- ✅ Parent selection dropdown
- ✅ Prevents circular references
- ✅ Prevents deleting categories with children
- ✅ Backward compatible (existing categories unaffected)

## 8.2 Quick Supplier Creation

**Location:** "+ " button next to supplier dropdown in Purchase Orders

### How to Use
1. Start creating a purchase order
2. Click the green **"+"** next to the supplier dropdown
3. Fill in: Name (required), Phone (required), Email (optional), Address (optional)
4. Click **"Add Supplier"**
5. Supplier is created and **auto-selected**

### Features
- ✅ Minimal required fields (name + phone only)
- ✅ Preserves existing PO form data
- ✅ Auto-refreshes supplier list
- ✅ Auto-selects the new supplier

## 8.3 Files Modified

| File | Change |
|------|--------|
| `scripts/migrate-nested-categories.sql` | SQL migration |
| `app/api/categories/route.ts` | GET/POST with parentId |
| `app/api/categories/[id]/route.ts` | PUT/DELETE with validation |
| `app/admin/categories/page.tsx` | Tree view + expand/collapse |
| `app/admin/purchases/page.tsx` | Quick supplier modal + hierarchical category |

---

---

# 9. Research Module PRD

**Version:** 1.0 | **Status:** Planning | **Access:** Superadmin Only

## 9.1 Problem Statement

The Lalitha Garments team needs to:
- Track supplier research (videos, websites, contacts)
- Store material details (prices, images, descriptions)
- Organize research by supplier with map locations
- Quickly find and act on research when making purchase decisions

## 9.2 Key Features

### Research Entry Form
| Field | Required |
|-------|---------|
| Supplier Name | ✅ |
| Material Name | ✅ |
| Contact Number | Optional |
| Address | Optional |
| WhatsApp | Optional |
| Map Location (Google Maps link) | Optional |
| Material Type/Category | Optional |
| Price Information | Optional |
| Material Images (multiple) | Optional |
| Reference Links (YouTube, Website, etc.) | Optional |
| Research Notes | Optional |
| Status (New / Reviewed / Interested / Not Suitable) | Optional |
| Tags | Optional |
| Follow-up Date | Optional |

### Reference Link Embedding
- **YouTube:** Full embed with playable video (in-app)
- **Vimeo:** Embed support
- **Other websites:** Link preview + "Open in new tab"

### Map Integration
- Address input → "View on Map" opens Google Maps
- Group pin links for multiple supplier locations

### Research Actions
- View / Edit / Delete research entries
- **Convert to Supplier** (pre-fills supplier form with research data)
- **Convert to Purchase Order** (pre-fills PO form with material data)

## 9.3 Database Schema

```sql
CREATE TABLE research_entries (
  id SERIAL PRIMARY KEY,
  supplier_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50),
  address TEXT,
  email VARCHAR(255),
  whatsapp_number VARCHAR(50),
  map_location TEXT,
  map_pin_group VARCHAR(255),
  material_name VARCHAR(255) NOT NULL,
  material_type VARCHAR(100),
  material_description TEXT,
  price DECIMAL(10, 2),
  material_images JSONB,
  reference_links JSONB,
  research_notes TEXT,
  status VARCHAR(50) DEFAULT 'New',
  tags TEXT[],
  research_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  follow_up_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_id VARCHAR(255) DEFAULT NULL
);
```

## 9.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/research` | List all entries (with filters) |
| GET | `/api/research/[id]` | Get single entry |
| POST | `/api/research` | Create entry |
| PUT | `/api/research/[id]` | Update entry |
| DELETE | `/api/research/[id]` | Delete entry |
| POST | `/api/research/process-link` | Process/embed reference link |

## 9.5 Access Control

- **Superadmin:** Full access (CRUD)
- **Tenants:** No access (menu hidden, API returns 403)
- **Users:** No access

## 9.6 Implementation Phases

| Phase | Features |
|-------|---------|
| Phase 1 (MVP) | ✅ Research list, Add/Edit form, basic fields, image upload, search/filter |
| Phase 2 | YouTube embedding, map integration, Convert to Supplier |
| Phase 3 | Convert to PO, research analytics, export functionality |

---

---

# 10. Multi-Branch Support PRD

**Version:** 1.0 | **Status:** Planning | **Priority:** High

## 10.1 Problem Statement

Currently all data for a tenant/superadmin is mixed together. Businesses operating multiple locations need:
- Complete data isolation by branch
- Branch switching in the UI
- Branch-specific reports and stats

## 10.2 Key Principles

1. **Complete Isolation:** Each branch's data is independent
2. **Hierarchical Access:** Superadmin sees Lalitha Garments branches; tenants see only their own branches
3. **Branch Context:** All operations scoped to selected branch
4. **Backward Compatibility:** Existing data (without `branch_id`) accessible as "legacy"

## 10.3 Database Schema

```sql
CREATE TABLE IF NOT EXISTS branches (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  phone VARCHAR(50),
  email VARCHAR(255),
  whatsapp VARCHAR(50),
  map_location TEXT,
  tenant_id VARCHAR(255),      -- NULL for Lalitha Garments
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add branch_id to all data tables:
-- suppliers, customers, inventory, sales, purchase_orders,
-- catalogues, categories, business_profile, research_entries
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS branch_id VARCHAR(255);
-- (repeat for all tables above)
```

## 10.4 Access Control Matrix

| User Type | Branches Visible | Data Access |
|-----------|-----------------|-------------|
| Superadmin | All Lalitha Garments branches | Only LG branch data |
| Tenant | Only own tenant branches | Only own tenant branch data |
| User | All Lalitha Garments branches | Only LG branch data |

## 10.5 Branch Context API

```typescript
// lib/branch-context.ts
export function getBranchContext(request: NextRequest): BranchContext
export function buildBranchFilter(context: BranchContext): { where: string, params: any[] }
```

**Filtering Logic:**
- Superadmin: `WHERE tenant_id IS NULL AND branch_id = $1`
- Tenant: `WHERE tenant_id = $1 AND branch_id = $2`

## 10.6 Branch Management API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/branches` | List user's branches |
| POST | `/api/branches` | Create branch |
| PUT | `/api/branches/[id]` | Update branch |
| DELETE | `/api/branches/[id]` | Delete branch |
| POST | `/api/branches/[id]/set-default` | Set as default |
| GET | `/api/branches/current` | Get selected branch |
| POST | `/api/branches/switch` | Switch active branch |

## 10.7 Implementation Phases

| Phase | Timeline | Work |
|-------|----------|------|
| Phase 1 | Week 1–2 | DB schema, `branch-context.ts`, session updates |
| Phase 2 | Week 2–3 | All API routes updated with branch filtering |
| Phase 3 | Week 3–4 | Branch selector UI, management page |
| Phase 4 | Week 4–5 | All data views show branch context |
| Phase 5 | Week 5–6 | Testing, migration, production deploy |

## 10.8 Risk Matrix

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance degradation | High | Proper indexing, query optimization |
| Data migration complexity | Medium | Gradual migration, backward compatibility |
| User confusion | Medium | Clear UI, onboarding, documentation |
| Branch isolation bugs | High | Comprehensive testing, code reviews |

---

---

# 11. YouTube Scripts — ERP Platform Launch

> **Language:** Hinglish | **Series:** 4-video educational series

## 11.1 Video Series Overview

| # | Title | Duration | Purpose |
|---|-------|----------|---------|
| 1 | Clothing Business Ki Real Problems | 8–10 min | Awareness — identify pain points |
| 2 | Founder X Ki Journey | 10–12 min | Relatability — transformation story |
| 3 | ERP Solution Detailed Walkthrough | 12–15 min | Demonstration — feature showcase |
| 4 | Kaise Implement Karein | 10–12 min | Action — step-by-step guide |

## 11.2 Core Value Propositions

1. **Real Experience:** Built by a real clothing business (Lalitha Garments)
2. **Practical Features:** Only what Indian clothing businesses actually need
3. **Affordable:** Much cheaper than foreign ERP solutions
4. **Indian Market Fit:** GST, WhatsApp, Indian payment modes
5. **Complete Support:** Free setup, training, and ongoing help

## 11.3 Problem → Solution Mapping

| Problem | Solution |
|---------|---------|
| Inventory Chaos | Real-time tracking system |
| Sales Confusion | Automated analytics + reports |
| Customer Loss | CRM with purchase history |
| Supplier Issues | Purchase Order management |
| Scaling Blockers | Multi-location / multi-tenant support |

## 11.4 Video 1: Introduction to Business Problems

**Hook:** "Aaj main aapko batane wala hoon ki kyun 90% clothing business owners fail ho jaate hain..."

**5 Core Problems Covered:**
1. **Inventory Management Chaos** — Manual counting, stock confusion, lost sales
2. **Sales Tracking Nightmare** — Month-end register counting, no insights
3. **Customer Management Challenges** — Forgotten preferences, no history
4. **Supplier & Purchase Order Chaos** — Scattered POs, payment confusion
5. **Multi-Location & Scaling Issues** — No central control, data sync

**Key Message:** Manual processes + No centralized system = Business chaos

## 11.5 Video 2: Founder X Story (Rajesh's Journey)

**The Story Arc:**
- **Breaking Point:** Customer walks out due to confused inventory, month-end takes 2–3 days
- **Research Phase:** 3 weeks searching for Indian clothing business software
- **Discovery:** Found Lalitha Garments ERP built by real clothing business
- **Transformation:**
  - Week 1: Setup in 4 days
  - Week 2: Inventory time 80% reduced
  - Week 3: Month-end reporting 90% faster
  - Week 4: Customer retention up 40%
  - Month 2: Opened 2nd shop!

**Before vs After:**
| Metric | Before | After |
|--------|--------|-------|
| Inventory check | 2–3 days/month | Real-time |
| Sales report | 2–3 days | Instant |
| Decision making | Guesswork | Data-driven |
| Time saved | — | 15–20 hrs/month |

## 11.6 Video 3: ERP Solution Walkthrough

**Live Demo Sections:**
1. **Inventory Dashboard** — Real-time stock, low-stock alerts, category-wise organization
2. **Sales Dashboard** — Instant reports, category analytics, profit margins, invoice PDF
3. **Customer Management** — Complete CRM with purchase history, sales linking
4. **Purchase Management** — Supplier DB, PO creation, auto stock updates
5. **Business Dashboard** — Key metrics at a glance, visual analytics, trend charts

**Pricing Teaser:**
- Starter Plan (single shop)
- Growth Plan (multiple shops)
- Enterprise Plan (custom)
- ROI: Investment recovers in 2–3 months

## 11.7 Video 4: Implementation Guide

**5-Step Process:**

**Step 1: Contact & Demo** → WhatsApp / Website / Email → 30-min free demo → 14-day trial

**Step 2: Data Preparation** → Organize inventory, customers, suppliers in Excel → Team provides templates

**Step 3: System Setup (2–3 days)**
- Account creation + plan selection
- Business profile (name, address, GST, logo, WhatsApp)
- Manual data entry for accuracy
- Team user accounts + role setup

**Step 4: Training**
- Admin: 2–3 hours full system walkthrough
- Team: 1–2 hours role-specific training
- Documentation + video tutorials provided

**Step 5: Go Live**
- 1 week parallel (old + new systems)
- Gradual transition: inventory → sales → complete switch
- Daily review week 1, weekly review month 1

**Common Challenges & Solutions:**
| Challenge | Solution |
|-----------|---------|
| Team resistance | Proper training, show benefits |
| Data migration issues | Pre-migration review, support team |
| Learning curve | Step-by-step sessions, documentation |
| Technical issues | 24/7 support, remote assistance |

---

---

## 📌 Quick Reference

### Environment Setup
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GROQ_API_KEY=your_groq_api_key
```

### Run Dev Server
```bash
npm install && npm run dev
```

### Run Database Migrations
```bash
node scripts/init-db.js
node scripts/run-migration.js
node scripts/run-nested-categories-migration.js
```

### Contact / WhatsApp
WhatsApp: **+91 7204219541**

---

*Built with ❤️ for Lalitha Garments | Master Doc v1.0 — Feb 2026*

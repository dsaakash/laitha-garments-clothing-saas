# Product Requirements Document (PRD)
## Multi-Branch Support with Complete Isolation
### Lalitha Garments ERP Platform

**Version:** 1.0  
**Last Updated:** 2026-01-24  
**Status:** Planning  
**Priority:** High

---

## 1. Executive Summary

### 1.1 Problem Statement

Currently, the system supports:
- **Multi-tenancy**: Each tenant business has isolated data
- **Superadmin (Lalitha Garments)**: Has access to their own data (tenant_id IS NULL)

However, both Lalitha Garments and tenant businesses may operate from **multiple physical locations/branches**:
- Lalitha Garments may have branches in different cities (e.g., Bangalore Main, Bangalore Warehouse, Mumbai Branch)
- Tenant businesses may also have multiple locations (e.g., Store 1, Store 2, Warehouse)

**Current Limitation**: All data for a tenant/superadmin is mixed together. There's no way to:
- Isolate data by branch location
- Switch between branches to see branch-specific data
- Manage multiple branches independently
- Ensure complete isolation between branches

### 1.2 Solution Overview

Implement **Multi-Branch Support** that:
- Allows Lalitha Garments (superadmin) to create and manage multiple branches
- Allows tenant businesses to create and manage multiple branches
- Provides complete data isolation per branch
- Enables branch switching in the UI
- Maintains strict isolation: Lalitha Garments branches cannot access tenant branches and vice versa
- Filters all data queries by selected branch

### 1.3 Key Principles

1. **Complete Isolation**: Each branch's data is completely isolated from other branches
2. **Hierarchical Access**: 
   - Superadmin can see all Lalitha Garments branches
   - Tenants can see only their own branches
   - No cross-access between superadmin and tenant branches
3. **Branch Context**: All data operations are scoped to the currently selected branch
4. **Backward Compatibility**: Existing data (without branch_id) should be handled gracefully

---

## 2. User Stories

### 2.1 As Lalitha Garments Superadmin

1. **Branch Management**
   - "I want to create multiple branches for Lalitha Garments (e.g., Main Store, Warehouse, Mumbai Branch)"
   - "I want to see a list of all my branches"
   - "I want to edit branch details (name, address, contact)"
   - "I want to switch between branches to see branch-specific data"
   - "I want to see which branch I'm currently viewing"

2. **Branch-Specific Data**
   - "When I switch to 'Bangalore Main' branch, I should only see suppliers, customers, inventory, sales for that branch"
   - "When I create a sale in 'Mumbai Branch', it should be associated with that branch only"
   - "Inventory should be branch-specific - each branch has its own stock"
   - "Sales reports should be filtered by the selected branch"

3. **Isolation**
   - "I should NOT be able to see any tenant branch data"
   - "Each branch should be completely independent"

### 2.2 As a Tenant Business Owner

1. **Branch Management**
   - "I want to create multiple branches for my business (e.g., Store 1, Store 2, Warehouse)"
   - "I want to see only MY branches (not other tenants' branches)"
   - "I want to switch between my branches"
   - "I want to manage branch details"

2. **Branch-Specific Data**
   - "When I switch to 'Store 1', I should only see data for Store 1"
   - "Inventory in Store 1 should be separate from Store 2"
   - "Sales in Store 1 should not mix with Store 2"
   - "Each branch should have its own suppliers, customers, and transactions"

3. **Isolation**
   - "I should NOT be able to see Lalitha Garments branches"
   - "I should NOT be able to see other tenants' branches"
   - "My branches should be completely isolated"

---

## 3. Technical Architecture

### 3.1 Database Schema

#### 3.1.1 Branches Table

```sql
CREATE TABLE IF NOT EXISTS branches (
  id VARCHAR(255) PRIMARY KEY,
  
  -- Branch Information
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE, -- Optional: BR001, STORE-1, etc.
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  
  -- Contact Information
  phone VARCHAR(50),
  email VARCHAR(255),
  whatsapp VARCHAR(50),
  
  -- Location
  map_location TEXT, -- Google Maps link
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Association
  tenant_id VARCHAR(255), -- NULL for Lalitha Garments, tenant_id for tenant businesses
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- One default branch per tenant/superadmin
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(is_active);
CREATE INDEX IF NOT EXISTS idx_branches_default ON branches(tenant_id, is_default) WHERE is_default = true;

-- Constraints
-- Ensure only one default branch per tenant/superadmin
CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_unique_default 
ON branches(COALESCE(tenant_id, ''::VARCHAR), is_default) 
WHERE is_default = true;

-- Comments
COMMENT ON TABLE branches IS 'Stores branch/location information for both Lalitha Garments and tenant businesses';
COMMENT ON COLUMN branches.tenant_id IS 'NULL for Lalitha Garments branches, tenant_id for tenant business branches';
COMMENT ON COLUMN branches.is_default IS 'One default branch per tenant/superadmin. Used when no branch is explicitly selected';
```

#### 3.1.2 Add branch_id to All Data Tables

**Migration Strategy**: Add `branch_id` column to all tables that need branch isolation:

```sql
-- Tables that need branch_id:
-- 1. business_profile
-- 2. suppliers
-- 3. customers
-- 4. catalogues
-- 5. purchase_orders
-- 6. inventory
-- 7. sales
-- 8. categories
-- 9. bill_number_sequence (already has tenant_id, add branch_id)
-- 10. research_entries (Lalitha Garments only, but still needs branch_id)

-- Example migration:
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS branch_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_suppliers_branch_id ON suppliers(branch_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_branch ON suppliers(tenant_id, branch_id);

-- Repeat for all tables above
```

**Composite Filtering**: All queries will filter by BOTH `tenant_id` AND `branch_id`:
- Lalitha Garments: `WHERE tenant_id IS NULL AND branch_id = $1`
- Tenant: `WHERE tenant_id = $1 AND branch_id = $2`

### 3.2 Context Management

#### 3.2.1 Branch Context

Similar to `tenant-context.ts`, create `branch-context.ts`:

```typescript
// lib/branch-context.ts

export interface BranchContext {
  branchId: string | null
  branchName: string | null
  tenantId: string | null
  userType: 'superadmin' | 'tenant' | 'user'
  isSuperAdmin: boolean
  isTenant: boolean
}

export function getBranchContext(request: NextRequest): BranchContext {
  // Get from headers (set by middleware) or session cookie
  let branchId = request.headers.get('x-branch-id')
  
  // If not in headers, get from session cookie
  if (!branchId) {
    const sessionCookie = request.cookies.get('admin_session')
    if (sessionCookie) {
      // Parse branch_id from session
      // Format: userType:userId:email:tenantId:branchId
      const decoded = decodeBase64(sessionCookie.value)
      const parts = decoded.split(':')
      branchId = parts.length > 5 ? parts[5] : null
    }
  }
  
  const tenantContext = getTenantContext(request)
  
  return {
    branchId,
    branchName: null, // Will be loaded from database if needed
    tenantId: tenantContext.tenantId,
    userType: tenantContext.userType,
    isSuperAdmin: tenantContext.isSuperAdmin,
    isTenant: tenantContext.isTenant
  }
}

export function buildBranchFilter(
  context: BranchContext, 
  tableHasBranchId: boolean = true
) {
  // If table doesn't have branch_id, return tenant filter only
  if (!tableHasBranchId) {
    return buildTenantFilter(context, true)
  }
  
  // Build composite filter: tenant_id AND branch_id
  if (context.isSuperAdmin) {
    // Superadmin: tenant_id IS NULL AND branch_id = $1
    if (context.branchId) {
      return {
        where: 'WHERE tenant_id IS NULL AND branch_id = $1',
        params: [context.branchId]
      }
    } else {
      // No branch selected - show all Lalitha Garments data (backward compatibility)
      return {
        where: 'WHERE tenant_id IS NULL AND (branch_id IS NULL OR branch_id = \'\')',
        params: []
      }
    }
  }
  
  if (context.isTenant && context.tenantId) {
    // Tenant: tenant_id = $1 AND branch_id = $2
    if (context.branchId) {
      return {
        where: 'WHERE tenant_id = $1 AND branch_id = $2',
        params: [context.tenantId, context.branchId]
      }
    } else {
      // No branch selected - show all tenant data (backward compatibility)
      return {
        where: 'WHERE tenant_id = $1 AND (branch_id IS NULL OR branch_id = \'\')',
        params: [context.tenantId]
      }
    }
  }
  
  // No access
  return { where: 'WHERE 1=0', params: [] }
}
```

#### 3.2.2 Session Management

Update session cookie format to include `branch_id`:

```
Current: userType:userId:email:tenantId
New:     userType:userId:email:tenantId:branchId
```

Update login API to set default branch after login.

### 3.3 Middleware Updates

Update `middleware.ts` to:
1. Extract `branch_id` from session
2. Set `x-branch-id` header
3. Ensure branch belongs to the correct tenant/superadmin

### 3.4 API Route Updates

All API routes need to:
1. Get branch context
2. Use `buildBranchFilter` instead of (or in addition to) `buildTenantFilter`
3. Ensure branch isolation in all queries

**Example**:
```typescript
// Before
const filter = buildTenantFilter(context)
const result = await query(`SELECT * FROM suppliers ${filter.where}`, filter.params)

// After
const branchContext = getBranchContext(request)
const filter = buildBranchFilter(branchContext)
const result = await query(`SELECT * FROM suppliers ${filter.where}`, filter.params)
```

---

## 4. User Interface

### 4.1 Branch Selector Component

**Location**: Top navigation bar (next to business name)

**Design**:
```
[Business Name] | [Branch Selector ▼] | [User Menu]
```

**Functionality**:
- Dropdown showing all accessible branches
- Current branch highlighted
- Click to switch branches
- Shows branch name and location (city)
- "Manage Branches" link at bottom

### 4.2 Branch Management Page

**Route**: `/admin/branches` (for superadmin) or `/admin/settings/branches` (for tenants)

**Features**:
1. **List View**:
   - Table showing all branches
   - Columns: Name, Code, Location (City), Status, Default, Actions
   - "Add New Branch" button

2. **Create/Edit Branch**:
   - Form fields:
     - Branch Name * (required)
     - Branch Code (optional, auto-generated if not provided)
     - Address
     - City, State, Pincode, Country
     - Phone, Email, WhatsApp
     - Google Maps Location
     - Set as Default Branch (checkbox)
   - Validation: At least one branch must be default

3. **Branch Details**:
   - View branch information
   - Edit branch
   - Delete branch (with confirmation)
   - Set as default

### 4.3 Data Display Updates

All data views should:
- Show current branch name in page header
- Filter data by selected branch
- Show branch-specific counts/stats
- Allow switching branches without losing context

**Example - Dashboard**:
```
Dashboard - Bangalore Main Branch
[Switch Branch ▼]

Sales Today: ₹50,000 (Bangalore Main only)
Inventory Items: 150 (Bangalore Main only)
```

---

## 5. Data Migration Strategy

### 5.1 Existing Data Handling

**Problem**: Existing data doesn't have `branch_id`. How to handle?

**Solution**: 
1. Create a "Default" branch for each tenant/superadmin
2. Set `branch_id = NULL` for existing data (treat as "legacy" data)
3. When querying:
   - If branch selected: Show only data with that `branch_id`
   - If no branch selected: Show data with `branch_id IS NULL` (backward compatibility)

**Migration Script**:
```sql
-- Step 1: Create default branches for all tenants
INSERT INTO branches (id, name, tenant_id, is_default, is_active)
SELECT 
  'default-' || id,
  business_name || ' - Main Branch',
  id,
  true,
  true
FROM tenants;

-- Step 2: Create default branch for Lalitha Garments
INSERT INTO branches (id, name, tenant_id, is_default, is_active)
VALUES ('default-lalitha', 'Lalitha Garments - Main Branch', NULL, true, true);

-- Step 3: Update existing data (optional - can be done gradually)
-- Option A: Leave branch_id NULL (backward compatibility)
-- Option B: Assign to default branch
UPDATE suppliers 
SET branch_id = 'default-' || tenant_id 
WHERE tenant_id IS NOT NULL AND branch_id IS NULL;

UPDATE suppliers 
SET branch_id = 'default-lalitha' 
WHERE tenant_id IS NULL AND branch_id IS NULL;
```

### 5.2 Gradual Migration

- Phase 1: Add `branch_id` column (nullable)
- Phase 2: Create default branches
- Phase 3: Update UI to show branch selector
- Phase 4: Gradually assign existing data to branches
- Phase 5: Make `branch_id` required for new records

---

## 6. Implementation Phases

### Phase 1: Database & Core Infrastructure (Week 1-2)

1. Create `branches` table
2. Add `branch_id` column to all data tables
3. Create indexes
4. Create default branches for existing tenants
5. Update `branch-context.ts` utility
6. Update session management

### Phase 2: API Updates (Week 2-3)

1. Create branch management APIs:
   - `GET /api/branches` - List branches
   - `POST /api/branches` - Create branch
   - `GET /api/branches/[id]` - Get branch details
   - `PUT /api/branches/[id]` - Update branch
   - `DELETE /api/branches/[id]` - Delete branch
   - `POST /api/branches/[id]/set-default` - Set as default

2. Update all existing APIs to use branch filtering:
   - Suppliers API
   - Customers API
   - Inventory API
   - Sales API
   - Purchase Orders API
   - Categories API
   - Business Profile API

### Phase 3: Frontend - Branch Management (Week 3-4)

1. Create branch selector component
2. Create branch management page
3. Add branch switching functionality
4. Update middleware to handle branch context

### Phase 4: Frontend - Data Views (Week 4-5)

1. Update all data views to show branch context
2. Add branch filtering to all lists
3. Update dashboard with branch-specific stats
4. Update forms to auto-assign branch_id

### Phase 5: Testing & Migration (Week 5-6)

1. Test branch isolation
2. Test branch switching
3. Test data migration
4. User acceptance testing
5. Deploy to production

---

## 7. Security & Isolation Rules

### 7.1 Access Control Matrix

| User Type | Can See Branches | Can Access Data |
|-----------|------------------|-----------------|
| Superadmin | All Lalitha Garments branches | Only Lalitha Garments branch data |
| Tenant | Only own tenant branches | Only own tenant branch data |
| User (Lalitha staff) | All Lalitha Garments branches | Only Lalitha Garments branch data |

### 7.2 Isolation Rules

1. **Branch Selection Validation**:
   - User can only select branches that belong to their tenant/superadmin
   - API must validate branch ownership before allowing access

2. **Data Filtering**:
   - All queries MUST include branch filter
   - No cross-branch data leakage
   - Branch context must be validated on every request

3. **Default Branch**:
   - If no branch selected, use default branch
   - Default branch is set per tenant/superadmin
   - At least one branch must be default

---

## 8. API Specifications

### 8.1 Branch Management APIs

#### GET /api/branches
**Description**: Get all branches for current user (superadmin or tenant)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "branch-1",
      "name": "Bangalore Main",
      "code": "BLR-001",
      "address": "123 Main St",
      "city": "Bangalore",
      "state": "Karnataka",
      "phone": "+91-1234567890",
      "isDefault": true,
      "isActive": true
    }
  ]
}
```

#### POST /api/branches
**Description**: Create a new branch

**Request Body**:
```json
{
  "name": "Mumbai Branch",
  "code": "MUM-001",
  "address": "456 Mumbai St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "phone": "+91-9876543210",
  "email": "mumbai@lalithagarments.com",
  "mapLocation": "https://maps.google.com/...",
  "isDefault": false
}
```

#### PUT /api/branches/[id]
**Description**: Update branch details

#### DELETE /api/branches/[id]
**Description**: Delete branch (only if no data associated)

#### POST /api/branches/[id]/set-default
**Description**: Set branch as default

### 8.2 Branch Context API

#### GET /api/branches/current
**Description**: Get currently selected branch

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "branch-1",
    "name": "Bangalore Main",
    "code": "BLR-001"
  }
}
```

#### POST /api/branches/switch
**Description**: Switch to a different branch

**Request Body**:
```json
{
  "branchId": "branch-2"
}
```

**Response**: Updates session cookie with new branch_id

---

## 9. UI/UX Specifications

### 9.1 Branch Selector Component

**Location**: Top navigation (AdminLayout)

**Design**:
- Dropdown button showing current branch name
- Icon: MapPin or Building2
- Click to open dropdown
- Dropdown shows:
  - List of branches (name, city)
  - Current branch highlighted
  - Divider
  - "Manage Branches" link

**States**:
- No branch selected: Show "Select Branch"
- Branch selected: Show branch name
- Loading: Show spinner

### 9.2 Branch Management Page

**Layout**: Similar to tenant management page

**Sections**:
1. **Header**: "Branches" title, "Add New Branch" button
2. **Branches List**: Table with all branches
3. **Branch Form**: Create/Edit form (modal or separate page)

**Table Columns**:
- Name
- Code
- Location (City, State)
- Contact (Phone)
- Status (Active/Inactive)
- Default (Yes/No)
- Actions (Edit, Delete, Set Default)

### 9.3 Data Views with Branch Context

**All data pages should show**:
- Current branch name in page header
- Branch-specific data only
- Option to switch branch (via branch selector)

**Example - Suppliers Page**:
```
Suppliers - Bangalore Main Branch
[Switch Branch ▼]

[Add Supplier] [Export]

Table showing only suppliers for Bangalore Main branch...
```

---

## 10. Edge Cases & Considerations

### 10.1 Backward Compatibility

- Existing data without `branch_id` should still be accessible
- When no branch selected, show data with `branch_id IS NULL`
- Gradually migrate existing data to branches

### 10.2 Branch Deletion

- Cannot delete branch if it has associated data
- Option 1: Prevent deletion (show error)
- Option 2: Allow deletion but require data migration to another branch
- Option 3: Soft delete (mark as inactive)

### 10.3 Default Branch

- At least one branch must be default
- Cannot unset default if it's the only branch
- When setting new default, old default is automatically unset

### 10.4 Branch Switching

- Switching branch should maintain current page context
- Show confirmation if unsaved changes
- Update all data views immediately after switch

### 10.5 Data Integrity

- All new records MUST have `branch_id`
- API should auto-assign `branch_id` from context if not provided
- Validate `branch_id` belongs to correct tenant/superadmin

---

## 11. Testing Requirements

### 11.1 Unit Tests

- Branch context extraction
- Branch filter building
- Branch validation logic

### 11.2 Integration Tests

- Branch CRUD operations
- Branch switching
- Data isolation between branches
- Cross-branch access prevention

### 11.3 User Acceptance Tests

- Create multiple branches
- Switch between branches
- Verify data isolation
- Verify branch-specific reports
- Test with both superadmin and tenant users

---

## 12. Success Metrics

1. **Isolation**: 100% data isolation between branches
2. **Performance**: No significant performance degradation with branch filtering
3. **User Adoption**: Users can successfully create and switch branches
4. **Data Integrity**: All new records have correct `branch_id`
5. **Backward Compatibility**: Existing data remains accessible

---

## 13. Future Enhancements

1. **Branch-to-Branch Transfers**: Transfer inventory between branches
2. **Branch Reports**: Compare performance across branches
3. **Branch Permissions**: Role-based access to specific branches
4. **Branch Analytics**: Branch-specific dashboards and insights
5. **Multi-Branch Inventory**: View consolidated inventory across branches

---

## 14. Dependencies

- Current multi-tenant architecture
- Session management system
- Middleware infrastructure
- Database migration system

---

## 15. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance degradation with additional filtering | High | Proper indexing, query optimization |
| Data migration complexity | Medium | Gradual migration, backward compatibility |
| User confusion with branch switching | Medium | Clear UI, onboarding, documentation |
| Branch isolation bugs | High | Comprehensive testing, code reviews |

---

## 16. Appendix

### 16.1 Database Migration Scripts

See `migrations/008_add_branches_table.sql` and `migrations/009_add_branch_id_to_all_tables.sql`

### 16.2 API Endpoint Summary

- Branch Management: `/api/branches/*`
- Branch Context: `/api/branches/current`, `/api/branches/switch`

### 16.3 Related Documents

- `docs/PRD/01_PRODUCT_REQUIREMENTS_DOCUMENT.md` - Main PRD
- `docs/ARCHITECTURE/01_SYSTEM_ARCHITECTURE.md` - System architecture
- `lib/tenant-context.ts` - Current tenant isolation implementation

---

**Document Owner**: Development Team  
**Reviewers**: Product Owner, Tech Lead  
**Approval Status**: Pending

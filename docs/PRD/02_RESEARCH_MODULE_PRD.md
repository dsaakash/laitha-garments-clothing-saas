# Product Requirements Document (PRD)
## Research Module - Supplier & Material Research Management
### Lalitha Garments Internal Tool

**Version:** 1.0  
**Last Updated:** 2026-01-24  
**Status:** Planning  
**Access Level:** Superadmin Only (Lalitha Garments)

---

## 1. Executive Summary

### 1.1 Problem Statement

During supplier and material research, Lalitha Garments team often:
- Watches multiple supplier videos and forgets which supplier was featured
- Researches materials, prices, and images but loses track of sources
- Finds reference links (videos, websites) but can't easily access them later
- Needs to organize supplier contact details, addresses, and map locations
- Wants to group related research items together
- Requires quick access to research data when making purchase decisions

### 1.2 Solution Overview

A comprehensive **Research Module** that allows Lalitha Garments (superadmin) to:
- Save supplier research with all relevant details
- Store reference links (especially videos) that are embeddable/playable
- Organize materials, prices, and images per supplier
- Track supplier contact information and map locations
- Group related research items
- Quickly search and retrieve research data

### 1.3 Target User

- **Primary:** Lalitha Garments superadmin/owner
- **Access:** Superadmin only (NOT available for tenants)
- **Use Case:** Research phase before creating actual suppliers/purchase orders

---

## 2. User Stories

### 2.1 As a Researcher (Superadmin)

1. **Supplier Research Tracking**
   - "I want to save supplier details I find during research so I don't forget them"
   - "I want to attach reference videos/links to supplier research so I can review them later"
   - "I want to save material details, prices, and images I find during research"

2. **Reference Link Management**
   - "I want to save YouTube videos and other links that are embeddable/playable directly in the system"
   - "I want to organize reference links by supplier or material type"
   - "I want to quickly access videos I watched during research"

3. **Location & Map Integration**
   - "I want to save supplier addresses and get map redirection"
   - "I want to group suppliers by location using pin links"
   - "I want to see suppliers on a map view"

4. **Image & Material Details**
   - "I want to upload images of materials/products I'm researching"
   - "I want to save price information I find during research"
   - "I want to add notes about materials (fabric type, quality, etc.)"

5. **Search & Organization**
   - "I want to search research by supplier name, material type, or keywords"
   - "I want to filter research by date, supplier, or status"
   - "I want to mark research items as 'Reviewed', 'Interested', or 'Not Suitable'"

---

## 3. Feature Requirements

### 3.1 Research Dashboard

**Purpose:** Overview of all research items

**Features:**
- List view of all research entries
- Quick stats: Total research items, suppliers researched, pending reviews
- Filter options:
  - By supplier name
  - By material type
  - By status (New, Reviewed, Interested, Not Suitable)
  - By date range
- Search functionality
- Sort options (Date, Supplier Name, Status)

**UI Components:**
- Research list/grid view
- Filter panel
- Search bar
- Status badges
- Quick action buttons

---

### 3.2 Add/Edit Research Entry

**Purpose:** Create and manage research items

**Form Fields:**

#### 3.2.1 Supplier Information
- **Supplier Name** (Required)
- **Contact Number** (Optional)
- **Address** (Optional, Textarea)
- **Email** (Optional)
- **WhatsApp Number** (Optional)
- **Map Location** (Optional)
  - Address input with "Get Map Link" button
  - Google Maps integration
  - Save map pin/coordinates

#### 3.2.2 Material/Product Details
- **Material Name** (Required)
- **Material Type/Category** (Dropdown: Fabric, Accessories, etc.)
- **Description** (Optional, Textarea)
- **Price Information** (Optional)
  - Price per unit
  - Currency (default: ₹)
  - Price notes
- **Images** (Optional, Multiple)
  - Upload multiple images
  - Image preview
  - Image captions/notes

#### 3.2.3 Reference Links
- **Reference Links Section** (Multiple links allowed)
  - **Link Type** (Dropdown: YouTube Video, Website, Instagram, Other)
  - **Link URL** (Required)
  - **Link Title/Description** (Optional)
  - **Embed/Playable Support** (Auto-detect for YouTube, Vimeo, etc.)
  - **Add More Links** button

#### 3.2.4 Additional Information
- **Research Notes** (Optional, Rich text)
- **Status** (Dropdown: New, Reviewed, Interested, Not Suitable)
- **Tags** (Optional, Multiple tags for categorization)
- **Research Date** (Auto-filled, editable)
- **Follow-up Date** (Optional, Date picker)

---

### 3.3 Research Detail View

**Purpose:** View complete research entry with all details

**Features:**
- Full supplier information display
- Material details with images gallery
- Reference links section
  - **Embedded Videos:** YouTube videos playable directly in page
  - **Website Links:** Clickable links with preview
  - **Other Links:** Direct links with icons
- Map view (if location provided)
- Notes section
- Action buttons:
  - Edit
  - Delete
  - Convert to Supplier (create actual supplier from research)
  - Convert to Purchase Order (if material details available)
  - Share/Export

---

### 3.4 Reference Link Embedding

**Purpose:** Make reference links easily accessible and playable

**Supported Platforms:**
- **YouTube:** Full embed support with playable video
- **Vimeo:** Embed support
- **Instagram:** Embed support (if available)
- **Other Websites:** Link preview with thumbnail

**Implementation:**
- Auto-detect link type from URL
- Show embedded player for supported platforms
- Fallback to link preview for unsupported platforms
- "Open in New Tab" option for all links

---

### 3.5 Map Integration

**Purpose:** Location tracking and visualization

**Features:**
- **Address Input:** Text field for supplier address
- **Map Redirection:** "View on Map" button opens Google Maps
- **Group Pin Links:** 
  - Save multiple supplier locations
  - Group by area/region
  - View all pins on map
- **Map View:** (Future enhancement)
  - Interactive map showing all supplier locations
  - Click pin to see supplier details

---

### 3.6 Search & Filter

**Purpose:** Quickly find research items

**Search Options:**
- Search by supplier name
- Search by material name
- Search by tags
- Search by notes content
- Full-text search across all fields

**Filter Options:**
- By status (New, Reviewed, Interested, Not Suitable)
- By supplier name
- By material type
- By date range
- By tags
- By location/region

---

### 3.7 Convert to Supplier/Purchase Order

**Purpose:** Convert research into actionable items

**Features:**
- **Convert to Supplier:**
  - Button on research detail page
  - Pre-fill supplier form with research data
  - User can edit before saving
  - Original research entry remains (linked)

- **Convert to Purchase Order:**
  - If material details available
  - Pre-fill PO form with research data
  - Link to supplier (if converted)
  - Original research entry remains (linked)

---

## 4. Database Schema

### 4.1 Research Table

```sql
CREATE TABLE research_entries (
  id SERIAL PRIMARY KEY,
  
  -- Supplier Information
  supplier_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50),
  address TEXT,
  email VARCHAR(255),
  whatsapp_number VARCHAR(50),
  map_location TEXT, -- Google Maps link or coordinates
  map_pin_group VARCHAR(255), -- For grouping pins
  
  -- Material/Product Details
  material_name VARCHAR(255) NOT NULL,
  material_type VARCHAR(100),
  material_description TEXT,
  price DECIMAL(10, 2),
  price_currency VARCHAR(10) DEFAULT '₹',
  price_notes TEXT,
  
  -- Images (JSONB array of image URLs)
  material_images JSONB,
  
  -- Reference Links (JSONB array)
  reference_links JSONB, -- [{type: 'youtube', url: '', title: '', embeddable: true}]
  
  -- Additional Information
  research_notes TEXT,
  status VARCHAR(50) DEFAULT 'New', -- New, Reviewed, Interested, Not Suitable
  tags TEXT[], -- Array of tags
  research_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  follow_up_date TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255), -- Superadmin user ID
  
  -- Tenant Isolation (NULL for Lalitha Garments)
  tenant_id VARCHAR(255) DEFAULT NULL -- Always NULL for research module
);

-- Indexes
CREATE INDEX idx_research_supplier_name ON research_entries(supplier_name);
CREATE INDEX idx_research_status ON research_entries(status);
CREATE INDEX idx_research_material_type ON research_entries(material_type);
CREATE INDEX idx_research_tags ON research_entries USING GIN(tags);
CREATE INDEX idx_research_date ON research_entries(research_date);
CREATE INDEX idx_research_tenant_id ON research_entries(tenant_id); -- For future if needed
```

### 4.2 Reference Links Structure (JSONB)

```json
[
  {
    "type": "youtube",
    "url": "https://www.youtube.com/watch?v=...",
    "title": "Supplier Product Video",
    "description": "Video showing material quality",
    "embeddable": true,
    "thumbnail": "https://img.youtube.com/vi/.../default.jpg"
  },
  {
    "type": "website",
    "url": "https://example.com/supplier",
    "title": "Supplier Website",
    "description": "Main supplier website",
    "embeddable": false
  }
]
```

### 4.3 Material Images Structure (JSONB)

```json
[
  {
    "url": "https://cloudinary.com/image1.jpg",
    "caption": "Material close-up",
    "uploaded_at": "2026-01-24T10:00:00Z"
  }
]
```

---

## 5. API Endpoints

### 5.1 Research Entries

**GET `/api/research`**
- Get all research entries (superadmin only)
- Query parameters:
  - `status`: Filter by status
  - `supplier`: Filter by supplier name
  - `materialType`: Filter by material type
  - `search`: Full-text search
  - `tags`: Filter by tags
  - `dateFrom`, `dateTo`: Date range filter

**GET `/api/research/[id]`**
- Get single research entry by ID

**POST `/api/research`**
- Create new research entry
- Body: All form fields
- Auto-set `tenant_id` to NULL (Lalitha Garments only)

**PUT `/api/research/[id]`**
- Update existing research entry

**DELETE `/api/research/[id]`**
- Delete research entry

### 5.2 Reference Link Processing

**POST `/api/research/process-link`**
- Process reference link URL
- Detect link type (YouTube, Vimeo, etc.)
- Extract metadata (title, thumbnail, embed code)
- Return processed link data

---

## 6. UI/UX Requirements

### 6.1 Sidebar Navigation

**Location:** Add to AdminLayout sidebar
**Position:** After "Workflow", before "Suppliers"
**Icon:** `Search` or `BookOpen` or `FileSearch` from Lucide
**Label:** "Research"
**Route:** `/admin/research`
**Access:** Only visible for `roles: ['superadmin']`

### 6.2 Research List Page

**Layout:**
- Header with "Research" title and "+ Add Research" button
- Filter panel (collapsible)
- Search bar
- Research entries grid/list view
- Each card shows:
  - Supplier name
  - Material name
  - Status badge
  - Thumbnail image (if available)
  - Reference link count
  - Date
  - Quick actions (View, Edit, Delete)

### 6.3 Research Form Page

**Layout:**
- Multi-section form:
  1. Supplier Information
  2. Material/Product Details
  3. Reference Links (with add more functionality)
  4. Additional Information
- Image upload section with preview
- Map integration section
- Save/Cancel buttons

### 6.4 Research Detail Page

**Layout:**
- Full-width layout
- Supplier info card
- Material details with image gallery
- Reference links section with embedded players
- Map view (if location available)
- Notes section
- Action buttons (Edit, Delete, Convert to Supplier, Convert to PO)

---

## 7. Technical Requirements

### 7.1 Video Embedding

**YouTube:**
- Extract video ID from URL
- Use YouTube iframe embed API
- Support for:
  - Regular YouTube URLs
  - Short URLs (youtu.be)
  - Playlist links
  - Timestamp links

**Implementation:**
```typescript
// Extract YouTube video ID
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]
  // ... extraction logic
}

// Embed component
<iframe 
  src={`https://www.youtube.com/embed/${videoId}`}
  allowFullScreen
/>
```

### 7.2 Image Upload

- Use existing Cloudinary integration
- Multiple image upload
- Image preview before save
- Image captions/notes
- Image gallery view

### 7.3 Map Integration

**Google Maps:**
- Address to map link conversion
- "View on Map" button opens Google Maps
- Future: Embedded map view
- Group pin links for multiple suppliers

---

## 8. User Flow

### 8.1 Adding Research Entry

1. User clicks "Research" in sidebar
2. Clicks "+ Add Research" button
3. Fills supplier information
4. Adds material details and uploads images
5. Adds reference links (especially videos)
6. Adds map location if available
7. Adds notes and tags
8. Saves research entry
9. Redirected to research list

### 8.2 Viewing Research

1. User clicks on research entry
2. Views complete details:
   - Supplier info
   - Material details with images
   - Embedded videos (playable)
   - Map location
   - Notes
3. Can edit, delete, or convert to supplier/PO

### 8.3 Converting Research to Supplier

1. User views research entry
2. Clicks "Convert to Supplier"
3. Supplier form opens with pre-filled data
4. User reviews/edits data
5. Saves as actual supplier
6. Research entry remains (linked to supplier)

---

## 9. Access Control

### 9.1 Visibility

- **Research menu item:** Only visible for `superadmin` role
- **API routes:** Check for superadmin, return 403 for tenants/users
- **Database:** All research entries have `tenant_id = NULL`

### 9.2 Permissions

- **Superadmin:** Full access (Create, Read, Update, Delete)
- **Tenants:** No access (menu item hidden, API returns 403)
- **Users:** No access

---

## 10. Future Enhancements

### Phase 2 Features:
1. **Map View:** Interactive map showing all supplier locations
2. **Research Templates:** Pre-defined templates for common research types
3. **Bulk Import:** Import research from Excel/CSV
4. **Research Analytics:** Track research conversion rates
5. **Collaboration:** Share research with team members
6. **Research Workflow:** Status-based workflow (New → Review → Decision)
7. **Export Research:** Export research data to PDF/Excel
8. **Research Reminders:** Follow-up date reminders

---

## 11. Success Metrics

### 11.1 Usage Metrics
- Number of research entries created
- Research entries converted to suppliers
- Research entries converted to purchase orders
- Average time to convert research to action

### 11.2 Business Impact
- Reduction in forgotten supplier information
- Faster supplier onboarding (from research to supplier)
- Better decision making (all research data in one place)
- Time saved in re-researching suppliers

---

## 12. Implementation Priority

### Phase 1 (MVP):
1. ✅ Research list page
2. ✅ Add/Edit research form
3. ✅ Basic supplier and material fields
4. ✅ Image upload
5. ✅ Reference links (basic)
6. ✅ Search and filter

### Phase 2:
1. Video embedding (YouTube)
2. Map integration
3. Convert to Supplier functionality
4. Status management

### Phase 3:
1. Convert to Purchase Order
2. Advanced filtering
3. Research analytics
4. Export functionality

---

## 13. Design Considerations

### 13.1 UI Design
- Clean, organized layout
- Easy-to-use form with clear sections
- Visual indicators for status
- Image gallery with lightbox
- Embedded video players prominent
- Mobile-responsive design

### 13.2 Performance
- Lazy loading for images
- Pagination for research list
- Efficient search indexing
- Fast video embedding

### 13.3 User Experience
- Auto-save drafts (optional)
- Quick add shortcuts
- Keyboard shortcuts
- Bulk actions
- Undo/redo for deletions

---

## 14. Dependencies

### 14.1 External Services
- **Cloudinary:** Image storage (already integrated)
- **Google Maps API:** Map integration (future)
- **YouTube API:** Video metadata extraction (optional)

### 14.2 Internal Dependencies
- AdminLayout component (sidebar integration)
- Authentication system (superadmin check)
- Database connection (PostgreSQL)
- Image upload utilities

---

## 15. Testing Requirements

### 15.1 Functional Testing
- Create research entry
- Edit research entry
- Delete research entry
- Search functionality
- Filter functionality
- Video embedding
- Image upload
- Convert to supplier
- Access control (superadmin only)

### 15.2 Edge Cases
- Very long supplier names
- Multiple reference links
- Large image files
- Invalid video URLs
- Missing required fields
- Special characters in notes

---

## 16. Documentation Requirements

### 16.1 User Documentation
- How to add research entry
- How to add reference links
- How to upload images
- How to convert research to supplier
- How to search and filter

### 16.2 Technical Documentation
- API endpoint documentation
- Database schema
- Video embedding implementation
- Map integration guide

---

**Document Status:** Ready for Development  
**Next Steps:** 
1. Review and approve PRD
2. Create database migration
3. Design UI mockups
4. Implement Phase 1 features
5. Test and iterate

---

**Version:** 1.0  
**Created:** 2026-01-24  
**Author:** Product Team  
**Reviewers:** [To be assigned]

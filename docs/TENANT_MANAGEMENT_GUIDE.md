# Tenant Management User Guide

This guide explains how to use the new Tenant Management features in the **Lalitha Garments Internal Tool**. These features are available to **Superadmins** only.

## 1. Editing Tenant Profile

Superadmins can now edit the business details of any tenant.

### Steps:
1.  Navigate to **Tenants** in the sidebar.
2.  Click on the tenant's name or the **Manage** button to view their details.
3.  In the "Business Information" card, click the **Edit Profile** button.
4.  A modal will appear where you can update:
    *   Business Name
    *   Owner Name
    *   Owner Phone & WhatsApp
    *   Address
    *   GST Number
    *   Subdomain
5.  Click **Save Changes** to update the tenant's information.

## 2. Deleting a Tenant

Superadmins can delete tenants from the system. There are two types of deletion available: **Soft Delete** and **Hard Delete**.

### Option A: Soft Delete (Recommended)
Soft delete marks the tenant as "Cancelled" and removes their access to the system. The data is preserved in the database for historical records or potential reactivation.

*   **Action**: Choose "SOFT" in the deletion prompt.
*   **Result**: Tenant status changes to 'Cancelled'. User can no longer login.

### Option B: Hard Delete (Permanent)
Hard delete **permanently removes** the tenant and **ALL** associated data from the system. This action is **irreversible**.

**Data Removed Includes:**
*   Tenant Account & Credentials
*   Business Profile
*   All Sales & Invoices
*   Inventory & Products
*   Purchase Orders & Suppliers
*   Customers
*   Reports & Analytics

*   **Action**: Choose "HARD" in the deletion prompt.
*   **Confirm**: You will be asked to confirm a second time.
*   **Result**: Tenant is completely erased from the database.

### How to Delete:
1.  **From List View**: Click the **Delete** button next to a tenant in the Tenants list.
2.  **From Details Page**: Scroll to the "Danger Zone" at the bottom of the Tenant Details page and click **Delete Tenant**.
3.  **Choose Type**: Type `SOFT` or `HARD` in the prompt when asked.

## 3. Subscription Management
(Existing Feature)
You can still manage tenant subscriptions by clicking the **Manage Plan** button on the Tenant Details page to upgrade plans, change billing cycles, or toggle specific modules.

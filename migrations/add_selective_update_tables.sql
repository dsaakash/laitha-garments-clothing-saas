-- Migration: Add Purchase Order Selective Update Tables
-- Description: Creates tables for staged changes, product locks, and inventory sync logging
-- Date: 2026-04-21

-- ============================================================================
-- Table: staged_po_changes
-- Purpose: Store pending purchase order modifications before approval
-- ============================================================================
CREATE TABLE IF NOT EXISTS staged_po_changes (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255),
    purchase_order_id VARCHAR(255) NOT NULL,
    approval_request_id INTEGER REFERENCES approval_requests(id) ON DELETE CASCADE,
    requester_id INTEGER NOT NULL,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('selective', 'full')),
    affected_product_ids TEXT[],
    change_payload JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'cancelled')),
    CONSTRAINT fk_staged_changes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for staged_po_changes
CREATE INDEX idx_staged_changes_po ON staged_po_changes(purchase_order_id);
CREATE INDEX idx_staged_changes_approval ON staged_po_changes(approval_request_id);
CREATE INDEX idx_staged_changes_tenant ON staged_po_changes(tenant_id);
CREATE INDEX idx_staged_changes_status ON staged_po_changes(status);

-- ============================================================================
-- Table: po_product_locks
-- Purpose: Prevent concurrent modifications to the same products
-- ============================================================================
CREATE TABLE IF NOT EXISTS po_product_locks (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255),
    purchase_order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    locked_by_approval_id INTEGER REFERENCES approval_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(purchase_order_id, product_id),
    CONSTRAINT fk_product_locks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for po_product_locks
CREATE INDEX idx_product_locks_po ON po_product_locks(purchase_order_id);
CREATE INDEX idx_product_locks_approval ON po_product_locks(locked_by_approval_id);
CREATE INDEX idx_product_locks_tenant ON po_product_locks(tenant_id);

-- ============================================================================
-- Table: inventory_sync_log
-- Purpose: Track inventory synchronization operations and errors
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_sync_log (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255),
    approval_request_id INTEGER REFERENCES approval_requests(id) ON DELETE CASCADE,
    purchase_order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    inventory_id VARCHAR(255),
    sync_status VARCHAR(20) NOT NULL CHECK (sync_status IN ('success', 'failed', 'retry')),
    error_message TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    CONSTRAINT fk_sync_log_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for inventory_sync_log
CREATE INDEX idx_sync_log_approval ON inventory_sync_log(approval_request_id);
CREATE INDEX idx_sync_log_status ON inventory_sync_log(sync_status);
CREATE INDEX idx_sync_log_tenant ON inventory_sync_log(tenant_id);
CREATE INDEX idx_sync_log_po ON inventory_sync_log(purchase_order_id);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE staged_po_changes IS 'Stores pending purchase order modifications before approval';
COMMENT ON TABLE po_product_locks IS 'Prevents concurrent modifications to the same products';
COMMENT ON TABLE inventory_sync_log IS 'Tracks inventory synchronization operations and errors';

COMMENT ON COLUMN staged_po_changes.change_type IS 'Type of change: selective (specific products) or full (all products)';
COMMENT ON COLUMN staged_po_changes.affected_product_ids IS 'Array of product IDs affected by this change';
COMMENT ON COLUMN staged_po_changes.change_payload IS 'JSON containing originalData and modifiedData objects';
COMMENT ON COLUMN staged_po_changes.status IS 'Current status: pending, applied, or cancelled';

COMMENT ON COLUMN po_product_locks.locked_by_approval_id IS 'Approval request ID that locked these products';

COMMENT ON COLUMN inventory_sync_log.sync_status IS 'Sync result: success, failed, or retry';
COMMENT ON COLUMN inventory_sync_log.retry_count IS 'Number of retry attempts for failed syncs';

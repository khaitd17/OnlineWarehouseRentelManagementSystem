-- ============================================================================
-- Migration: Add Receipt Notes (Phiếu nhập/xuất kho)
-- Date: 2026-05-07
-- Description:
--   1. Add request_code, volume_warning to inventory_requests
--   2. Add receipt_note_id to inventory_transactions
--   3. Create receipt_notes table
--   4. Create receipt_items table
-- ============================================================================

-- ── 1. Thêm cột vào inventory_requests ─────────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'inventory_requests' AND COLUMN_NAME = 'request_code'
)
BEGIN
    ALTER TABLE inventory_requests ADD request_code NVARCHAR(30) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UQ_inventory_requests_code' AND object_id = OBJECT_ID('inventory_requests')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_inventory_requests_code
        ON inventory_requests(request_code)
        WHERE request_code IS NOT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'inventory_requests' AND COLUMN_NAME = 'volume_warning'
)
BEGIN
    ALTER TABLE inventory_requests ADD volume_warning BIT NOT NULL DEFAULT 0;
END
GO

-- Mở rộng status từ 20 → 30 ký tự (cho "PARTIALLY_COMPLETED")
ALTER TABLE inventory_requests ALTER COLUMN status NVARCHAR(30);
GO

-- ── 2. Thêm cột vào inventory_transactions ─────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'inventory_transactions' AND COLUMN_NAME = 'receipt_note_id'
)
BEGIN
    ALTER TABLE inventory_transactions ADD receipt_note_id INT NULL;
END
GO

-- ── 3. Tạo bảng receipt_notes ───────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'receipt_notes')
BEGIN
    CREATE TABLE receipt_notes (
        receipt_note_id        INT IDENTITY(1,1) NOT NULL,
        inv_req_id             INT NOT NULL,
        receipt_code           NVARCHAR(30) NOT NULL,
        received_by_staff_id   INT NOT NULL,
        received_at            DATETIME2 NOT NULL DEFAULT GETDATE(),
        staff_signature_base64 NVARCHAR(MAX) NULL,
        renter_signature_base64 NVARCHAR(MAX) NULL,
        status                 NVARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        notes                  NVARCHAR(MAX) NULL,
        capacity_overflow      DECIMAL(10,3) NULL,
        created_at             DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at             DATETIME2 NULL,

        CONSTRAINT PK_receipt_notes PRIMARY KEY (receipt_note_id),
        CONSTRAINT FK_receipt_notes_request FOREIGN KEY (inv_req_id)
            REFERENCES inventory_requests(inv_req_id),
        CONSTRAINT FK_receipt_notes_staff FOREIGN KEY (received_by_staff_id)
            REFERENCES users(user_id)
    );

    CREATE UNIQUE NONCLUSTERED INDEX UQ_receipt_notes_code
        ON receipt_notes(receipt_code);

    CREATE NONCLUSTERED INDEX idx_receipt_notes_request
        ON receipt_notes(inv_req_id);
END
GO

-- ── 4. Tạo bảng receipt_items ───────────────────────────────────────────────
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'receipt_notes')
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'receipt_notes' AND COLUMN_NAME = 'capacity_overflow'
    )
    BEGIN
        ALTER TABLE receipt_notes ADD capacity_overflow DECIMAL(10,3) NULL;
    END

    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'receipt_notes'
          AND COLUMN_NAME = 'status'
          AND CHARACTER_MAXIMUM_LENGTH < 30
    )
    BEGIN
        ALTER TABLE receipt_notes ALTER COLUMN status NVARCHAR(30) NOT NULL;
    END
END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'receipt_items')
BEGIN
    CREATE TABLE receipt_items (
        receipt_item_id     INT IDENTITY(1,1) NOT NULL,
        receipt_note_id     INT NOT NULL,
        inventory_item_id   INT NULL,
        asset_id            INT NULL,
        item_name           NVARCHAR(255) NOT NULL,
        expected_quantity   INT NOT NULL DEFAULT 0,
        received_quantity   INT NOT NULL DEFAULT 0,
        unit                NVARCHAR(50) NOT NULL DEFAULT N'cái',
        verified_volume     DECIMAL(10,3) NULL,
        measured_length     DECIMAL(10,3) NULL,
        measured_width      DECIMAL(10,3) NULL,
        verified_weight     DECIMAL(10,3) NULL,
        note                NVARCHAR(500) NULL,

        CONSTRAINT PK_receipt_items PRIMARY KEY (receipt_item_id),
        CONSTRAINT FK_receipt_items_note FOREIGN KEY (receipt_note_id)
            REFERENCES receipt_notes(receipt_note_id) ON DELETE CASCADE,
        CONSTRAINT FK_receipt_items_inv_item FOREIGN KEY (inventory_item_id)
            REFERENCES inventory_items(item_id),
        CONSTRAINT FK_receipt_items_asset FOREIGN KEY (asset_id)
            REFERENCES renter_assets(asset_id)
    );

    CREATE NONCLUSTERED INDEX idx_receipt_items_note
        ON receipt_items(receipt_note_id);
END
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'receipt_items')
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'receipt_items' AND COLUMN_NAME = 'measured_length'
    )
    BEGIN
        ALTER TABLE receipt_items ADD measured_length DECIMAL(10,3) NULL;
    END

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'receipt_items' AND COLUMN_NAME = 'measured_width'
    )
    BEGIN
        ALTER TABLE receipt_items ADD measured_width DECIMAL(10,3) NULL;
    END
END
GO

-- ── 5. FK cho inventory_transactions → receipt_notes ────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_inv_transactions_receipt_note'
)
BEGIN
    ALTER TABLE inventory_transactions
        ADD CONSTRAINT FK_inv_transactions_receipt_note
        FOREIGN KEY (receipt_note_id) REFERENCES receipt_notes(receipt_note_id);
END
GO

PRINT '✅ Migration add_receipt_notes completed successfully.';
GO

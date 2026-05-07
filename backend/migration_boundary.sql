-- ============================================================
-- Migration: Add BoundaryPoints column to Warehouses table
-- Each grid cell = 0.5m x 0.5m
-- Format: JSON array [{gx:int, gy:int}, ...]
-- NULL = fallback to full rectangle (backward compatible)
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.Warehouses') 
      AND name = N'BoundaryPoints'
)
BEGIN
    ALTER TABLE dbo.Warehouses 
    ADD BoundaryPoints NVARCHAR(MAX) NULL;
    PRINT 'SUCCESS: Added BoundaryPoints column to Warehouses.';
END
ELSE
    PRINT 'SKIPPED: BoundaryPoints already exists.';

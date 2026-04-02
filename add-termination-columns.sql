-- Add termination/close approval columns to contracts table
-- Run this script directly on your SQL Server database

-- Check if columns exist before adding
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[contracts]') AND name = 'termination_requested_by')
    ALTER TABLE contracts ADD termination_requested_by NVARCHAR(20) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[contracts]') AND name = 'termination_requested_at')
    ALTER TABLE contracts ADD termination_requested_at DATETIME2 NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[contracts]') AND name = 'renter_approved_termination')
    ALTER TABLE contracts ADD renter_approved_termination BIT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[contracts]') AND name = 'owner_approved_termination')
    ALTER TABLE contracts ADD owner_approved_termination BIT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[contracts]') AND name = 'early_termination_fee')
    ALTER TABLE contracts ADD early_termination_fee DECIMAL(18,2) NULL;

GO

-- Verify columns were added
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID(N'[dbo].[contracts]')
AND c.name IN ('termination_requested_by', 'termination_requested_at', 'renter_approved_termination', 'owner_approved_termination', 'early_termination_fee')
ORDER BY c.name;

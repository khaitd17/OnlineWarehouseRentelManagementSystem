-- Add termination/close approval columns to contracts and rental_contracts tables
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

-- rental_contracts currently maps these fields by PascalCase in EF entity
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[rental_contracts]') AND name = 'TerminatedAt')
    ALTER TABLE rental_contracts ADD TerminatedAt DATETIME2 NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[rental_contracts]') AND name = 'TerminationReason')
    ALTER TABLE rental_contracts ADD TerminationReason NVARCHAR(MAX) NULL;

-- task_types compatibility for newer seed logic
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[task_types]') AND name = 'is_manual')
    ALTER TABLE task_types ADD is_manual BIT NOT NULL CONSTRAINT DF_task_types_is_manual DEFAULT 0;

-- subscription_packages table (required by DatabaseSeeder)
IF OBJECT_ID(N'[dbo].[subscription_packages]', N'U') IS NULL
BEGIN
    CREATE TABLE subscription_packages
    (
        package_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        description NVARCHAR(MAX) NULL,
        duration_months INT NOT NULL CONSTRAINT DF_subscription_packages_duration_months DEFAULT 1,
        is_active BIT NOT NULL CONSTRAINT DF_subscription_packages_is_active DEFAULT 1,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_subscription_packages_created_at DEFAULT (GETDATE()),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_subscription_packages_updated_at DEFAULT (GETDATE())
    );
END

GO

-- Verify columns were added
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE (
    c.object_id IN (OBJECT_ID(N'[dbo].[contracts]'), OBJECT_ID(N'[dbo].[rental_contracts]'))
    AND c.name IN ('termination_requested_by', 'termination_requested_at', 'renter_approved_termination', 'owner_approved_termination', 'early_termination_fee', 'TerminatedAt', 'TerminationReason')
)
OR (c.object_id = OBJECT_ID(N'[dbo].[task_types]') AND c.name = 'is_manual')
OR (c.object_id = OBJECT_ID(N'[dbo].[subscription_packages]') AND c.name IN ('package_id', 'name', 'price', 'duration_months', 'is_active'))
ORDER BY c.name;

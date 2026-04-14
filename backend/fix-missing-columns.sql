-- ================================================
-- Fix: Sync EF Migrations History & Add Missing Columns
-- Run this script once to resolve the startup errors
-- ================================================

-- Step 1: Ensure __EFMigrationsHistory table exists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '__EFMigrationsHistory')
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
    PRINT 'Created __EFMigrationsHistory table';
END

-- Step 2: Fake-mark existing migrations as applied
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260410075728_InitialCreate')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20260410075728_InitialCreate', '9.0.3');
    PRINT 'Marked 20260410075728_InitialCreate as applied';
END

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260411045220_AddSubscriptionPackages')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20260411045220_AddSubscriptionPackages', '9.0.3');
    PRINT 'Marked 20260411045220_AddSubscriptionPackages as applied';
END

-- Step 3: Add missing columns to rental_payments
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_payments') AND name = 'RetryCount')
BEGIN
    ALTER TABLE rental_payments ADD RetryCount INT NOT NULL DEFAULT 0;
    PRINT 'Added RetryCount to rental_payments';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_payments') AND name = 'MaxRetry')
BEGIN
    ALTER TABLE rental_payments ADD MaxRetry INT NOT NULL DEFAULT 3;
    PRINT 'Added MaxRetry to rental_payments';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_payments') AND name = 'LastRetryAt')
BEGIN
    ALTER TABLE rental_payments ADD LastRetryAt DATETIME2 NULL;
    PRINT 'Added LastRetryAt to rental_payments';
END

-- Step 4: Add other missing columns from add-cancellation-tracking.sql (if not yet applied)
-- rental_requests
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_requests') AND name = 'CancellationReason')
BEGIN
    ALTER TABLE rental_requests ADD CancellationReason NVARCHAR(MAX) NULL;
    PRINT 'Added CancellationReason to rental_requests';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_requests') AND name = 'CancelledAt')
BEGIN
    ALTER TABLE rental_requests ADD CancelledAt DATETIME2 NULL;
    PRINT 'Added CancelledAt to rental_requests';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_requests') AND name = 'CancelledBy')
BEGIN
    ALTER TABLE rental_requests ADD CancelledBy NVARCHAR(MAX) NULL;
    PRINT 'Added CancelledBy to rental_requests';
END

-- rental_contracts
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'CancelledAt')
BEGIN
    ALTER TABLE rental_contracts ADD CancelledAt DATETIME2 NULL;
    PRINT 'Added CancelledAt to rental_contracts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'CancelledBy')
BEGIN
    ALTER TABLE rental_contracts ADD CancelledBy NVARCHAR(MAX) NULL;
    PRINT 'Added CancelledBy to rental_contracts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'GracePeriodHours')
BEGIN
    ALTER TABLE rental_contracts ADD GracePeriodHours INT NOT NULL DEFAULT 24;
    PRINT 'Added GracePeriodHours to rental_contracts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'CancellationFee')
BEGIN
    ALTER TABLE rental_contracts ADD CancellationFee DECIMAL(18,2) NULL;
    PRINT 'Added CancellationFee to rental_contracts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'RenterSignatureExpiry')
BEGIN
    ALTER TABLE rental_contracts ADD RenterSignatureExpiry DATETIME2 NULL;
    PRINT 'Added RenterSignatureExpiry to rental_contracts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'PaymentExpiry')
BEGIN
    ALTER TABLE rental_contracts ADD PaymentExpiry DATETIME2 NULL;
    PRINT 'Added PaymentExpiry to rental_contracts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'owner_signature_expiry')
BEGIN
    ALTER TABLE rental_contracts ADD owner_signature_expiry DATETIME2 NULL;
    PRINT 'Added owner_signature_expiry to rental_contracts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'TerminationRequestedBy')
BEGIN
    ALTER TABLE rental_contracts ADD TerminationRequestedBy NVARCHAR(MAX) NULL;
    PRINT 'Added TerminationRequestedBy to rental_contracts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'TerminationRequestedAt')
BEGIN
    ALTER TABLE rental_contracts ADD TerminationRequestedAt DATETIME2 NULL;
    PRINT 'Added TerminationRequestedAt to rental_contracts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'RenterApprovedTermination')
BEGIN
    ALTER TABLE rental_contracts ADD RenterApprovedTermination BIT NOT NULL DEFAULT 0;
    PRINT 'Added RenterApprovedTermination to rental_contracts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'OwnerApprovedTermination')
BEGIN
    ALTER TABLE rental_contracts ADD OwnerApprovedTermination BIT NOT NULL DEFAULT 0;
    PRINT 'Added OwnerApprovedTermination to rental_contracts';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'EarlyTerminationFee')
BEGIN
    ALTER TABLE rental_contracts ADD EarlyTerminationFee DECIMAL(18,2) NULL;
    PRINT 'Added EarlyTerminationFee to rental_contracts';
END

PRINT '=== Fix script completed successfully! ===';

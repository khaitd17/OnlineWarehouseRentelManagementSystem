-- Migration: AddCancellationTracking
-- Thêm các cột cancel tracking vào tables

-- 1. rental_requests - Cancel tracking
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_requests') AND name = 'CancellationReason')
BEGIN
    ALTER TABLE rental_requests ADD CancellationReason NVARCHAR(MAX) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_requests') AND name = 'CancelledAt')
BEGIN
    ALTER TABLE rental_requests ADD CancelledAt DATETIME2 NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_requests') AND name = 'CancelledBy')
BEGIN
    ALTER TABLE rental_requests ADD CancelledBy NVARCHAR(MAX) NULL;
END

-- 2. rental_payments - Retry tracking
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_payments') AND name = 'RetryCount')
BEGIN
    ALTER TABLE rental_payments ADD RetryCount INT NOT NULL DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_payments') AND name = 'MaxRetry')
BEGIN
    ALTER TABLE rental_payments ADD MaxRetry INT NOT NULL DEFAULT 3;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_payments') AND name = 'LastRetryAt')
BEGIN
    ALTER TABLE rental_payments ADD LastRetryAt DATETIME2 NULL;
END

-- 3. rental_contracts - Cancel tracking & expiry
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'CancelledAt')
BEGIN
    ALTER TABLE rental_contracts ADD CancelledAt DATETIME2 NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'CancelledBy')
BEGIN
    ALTER TABLE rental_contracts ADD CancelledBy NVARCHAR(MAX) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'GracePeriodHours')
BEGIN
    ALTER TABLE rental_contracts ADD GracePeriodHours INT NOT NULL DEFAULT 24;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'CancellationFee')
BEGIN
    ALTER TABLE rental_contracts ADD CancellationFee DECIMAL(18,2) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'RenterSignatureExpiry')
BEGIN
    ALTER TABLE rental_contracts ADD RenterSignatureExpiry DATETIME2 NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'PaymentExpiry')
BEGIN
    ALTER TABLE rental_contracts ADD PaymentExpiry DATETIME2 NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'owner_signature_expiry')
BEGIN
    ALTER TABLE rental_contracts ADD owner_signature_expiry DATETIME2 NULL;
END

-- 4. rental_contracts - Termination tracking (2-party approval)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'TerminationRequestedBy')
BEGIN
    ALTER TABLE rental_contracts ADD TerminationRequestedBy NVARCHAR(MAX) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'TerminationRequestedAt')
BEGIN
    ALTER TABLE rental_contracts ADD TerminationRequestedAt DATETIME2 NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'RenterApprovedTermination')
BEGIN
    ALTER TABLE rental_contracts ADD RenterApprovedTermination BIT NOT NULL DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'OwnerApprovedTermination')
BEGIN
    ALTER TABLE rental_contracts ADD OwnerApprovedTermination BIT NOT NULL DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'rental_contracts') AND name = 'EarlyTerminationFee')
BEGIN
    ALTER TABLE rental_contracts ADD EarlyTerminationFee DECIMAL(18,2) NULL;
END

PRINT 'Migration AddCancellationTracking applied successfully!';

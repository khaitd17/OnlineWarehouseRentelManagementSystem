-- Create cancellation_logs table

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cancellation_logs')
BEGIN
    CREATE TABLE cancellation_logs (
        log_id INT PRIMARY KEY IDENTITY(1,1),
        rental_request_id INT NULL,
        rental_contract_id INT NULL,
        cancelled_stage NVARCHAR(50) NOT NULL,
        cancelled_by NVARCHAR(50) NOT NULL,
        cancellation_reason NVARCHAR(MAX) NOT NULL,
        refund_amount DECIMAL(18,2) NULL,
        cancellation_fee DECIMAL(18,2) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        
        CONSTRAINT FK_cancellation_logs_rental_requests FOREIGN KEY (rental_request_id)
            REFERENCES rental_requests(request_id) ON DELETE CASCADE,
        CONSTRAINT FK_cancellation_logs_rental_contracts FOREIGN KEY (rental_contract_id)
            REFERENCES rental_contracts(contract_id) ON DELETE CASCADE,
        CONSTRAINT CHK_cancellation_logs_reference CHECK (
            rental_request_id IS NOT NULL OR rental_contract_id IS NOT NULL
        )
    );
    
    CREATE INDEX IX_cancellation_logs_rental_request_id ON cancellation_logs(rental_request_id);
    CREATE INDEX IX_cancellation_logs_rental_contract_id ON cancellation_logs(rental_contract_id);
    CREATE INDEX IX_cancellation_logs_created_at ON cancellation_logs(created_at DESC);
    
    PRINT 'Table cancellation_logs created successfully!';
END
ELSE
BEGIN
    PRINT 'Table cancellation_logs already exists.';
END

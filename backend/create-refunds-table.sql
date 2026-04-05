-- Create refunds table

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'refunds')
BEGIN
    CREATE TABLE refunds (
        refund_id INT PRIMARY KEY IDENTITY(1,1),
        payment_id INT NULL,
        contract_id INT NOT NULL,
        amount DECIMAL(18,2) NOT NULL CHECK (amount > 0),
        reason NVARCHAR(200) NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
        processed_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        
        CONSTRAINT FK_refunds_rental_payments FOREIGN KEY (payment_id)
            REFERENCES rental_payments(payment_id) ON DELETE SET NULL,
        CONSTRAINT FK_refunds_rental_contracts FOREIGN KEY (contract_id)
            REFERENCES rental_contracts(contract_id) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_refunds_payment_id ON refunds(payment_id);
    CREATE INDEX IX_refunds_contract_id ON refunds(contract_id);
    CREATE INDEX IX_refunds_status ON refunds(status);
    CREATE INDEX IX_refunds_created_at ON refunds(created_at DESC);
    
    PRINT 'Table refunds created successfully!';
END
ELSE
BEGIN
    PRINT 'Table refunds already exists.';
END

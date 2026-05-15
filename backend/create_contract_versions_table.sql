-- Create contract_versions table if it doesn't exist
IF OBJECT_ID('contract_versions', 'U') IS NULL
BEGIN
    CREATE TABLE contract_versions (
        version_id INT PRIMARY KEY IDENTITY(1,1),
        contract_id INT NOT NULL,
        version_number INT NOT NULL,
        snapshot_json NVARCHAR(MAX) NOT NULL,
        created_by INT NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (contract_id) REFERENCES contracts(contract_id),
        FOREIGN KEY (created_by) REFERENCES users(user_id)
    );
    
    -- Create indexes
    CREATE INDEX idx_contract_versions_contract ON contract_versions(contract_id);
    CREATE UNIQUE INDEX idx_contract_versions_contract_version ON contract_versions(contract_id, version_number);
    CREATE INDEX IX_contract_versions_created_by ON contract_versions(created_by);
    
    PRINT 'contract_versions table created successfully.';
END
ELSE
BEGIN
    PRINT 'contract_versions table already exists.';
END

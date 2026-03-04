-- =============================================
-- Script: Tạo bảng password_reset_tokens
-- Chạy script này trong SQL Server Management Studio
-- =============================================

IF NOT EXISTS (
    SELECT * FROM sysobjects 
    WHERE name='password_reset_tokens' AND xtype='U'
)
BEGIN
    CREATE TABLE password_reset_tokens (
        token_id     INT IDENTITY(1,1) PRIMARY KEY,
        user_id      INT NOT NULL,
        token        NVARCHAR(256) NOT NULL UNIQUE,
        expires_at   DATETIME2 NOT NULL,
        is_used      BIT NOT NULL DEFAULT 0,
        created_at   DATETIME2 NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_password_reset_tokens_user
            FOREIGN KEY (user_id) REFERENCES users(user_id)
    );

    CREATE INDEX idx_prt_token   ON password_reset_tokens(token);
    CREATE INDEX idx_prt_user_id ON password_reset_tokens(user_id);

    PRINT 'Table password_reset_tokens created successfully.';
END
ELSE
BEGIN
    PRINT 'Table password_reset_tokens already exists.';
END

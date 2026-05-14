-- ============================================================
-- Migration: Add AI Analysis Feature
-- Ngày tạo: 2026-04-18
-- Mô tả:
--   1. Thêm cột available_volume vào bảng warehouses (m²)
--   2. Tạo bảng ai_analysis_sessions để lưu lịch sử phân tích AI
-- ============================================================

-- 1. Thêm cột available_volume vào bảng warehouses
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'warehouses' AND COLUMN_NAME = 'available_volume'
)
BEGIN
    ALTER TABLE warehouses
    ADD available_volume FLOAT NULL;
    PRINT 'Added available_volume column to warehouses';
END
ELSE
    PRINT 'Column available_volume already exists in warehouses';

-- 2. Tạo bảng ai_analysis_sessions
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'ai_analysis_sessions'
)
BEGIN
    CREATE TABLE ai_analysis_sessions (
        session_id          INT IDENTITY(1,1) NOT NULL,
        user_id             INT NOT NULL,
        analyzed_at         DATETIME2 NOT NULL DEFAULT GETDATE(),
        image_urls          NVARCHAR(MAX) NULL,      -- JSON array of image URLs
        result_json         NVARCHAR(MAX) NULL,      -- Raw Gemini response JSON
        estimated_volume_m3 FLOAT NULL,
        suggested_type      NVARCHAR(100) NULL,
        special_notes       NVARCHAR(MAX) NULL,
        confidence          FLOAT NULL,

        CONSTRAINT PK_ai_analysis_sessions PRIMARY KEY (session_id),
        CONSTRAINT FK_ai_analysis_sessions_users
            FOREIGN KEY (user_id) REFERENCES users(user_id)
            ON DELETE NO ACTION
    );

    -- Indexes
    CREATE INDEX idx_ai_sessions_user ON ai_analysis_sessions (user_id);
    CREATE INDEX idx_ai_sessions_date ON ai_analysis_sessions (analyzed_at);

    PRINT 'Created table ai_analysis_sessions';
END
ELSE
    PRINT 'Table ai_analysis_sessions already exists';

PRINT 'Migration completed successfully';


-- =============================================
-- SEED: Tạo dữ liệu test cho Renter
-- Renter: renter@owrms.com (user_id = 8)
-- Warehouse: warehouse_id = 2
-- =============================================

USE OWRMS;
GO

-- Bước 1: Tạo rental_request với status APPROVED
-- (Không có cột start_date trong DB thực tế)
INSERT INTO rental_requests (renter_id, warehouse_id, requested_area, duration_months, status, notes, reviewed_by, reviewed_at)
VALUES (8, 2, 200.0, 12, 'APPROVED', N'Yêu cầu thuê kho test - seed data', 18, GETDATE());

DECLARE @RequestId INT = SCOPE_IDENTITY();
PRINT N'Đã tạo rental_request với request_id = ' + CAST(@RequestId AS NVARCHAR);

-- Bước 2: Tạo contract ACTIVE cho renter
-- Lưu ý: contracts có cột rental_area_id (kiểm tra xem có bắt buộc không)
INSERT INTO contracts (request_id, renter_id, warehouse_id, contract_number, start_date, end_date, monthly_payment, total_value, deposit_amount, status)
VALUES (
    @RequestId,
    8,          -- renter_id = renter@owrms.com
    2,          -- warehouse_id = Kho Lạnh Thực Phẩm
    'RTC-2025-TEST01',
    '2025-01-01',
    '2026-01-01',
    5000000.00,
    60000000.00,
    10000000.00,
    'ACTIVE'
);

DECLARE @ContractId INT = SCOPE_IDENTITY();
PRINT N'Đã tạo contract với contract_id = ' + CAST(@ContractId AS NVARCHAR);

-- Bước 3: Kiểm tra kết quả
SELECT 
    c.contract_id,
    u.email AS renter_email,
    w.name AS warehouse_name,
    c.contract_number,
    c.status,
    c.start_date,
    c.end_date,
    c.monthly_payment
FROM contracts c
JOIN users u ON c.renter_id = u.user_id
JOIN warehouses w ON c.warehouse_id = w.warehouse_id
WHERE c.renter_id = 8;

PRINT N'=== Seed data hoàn thành! ===';
GO

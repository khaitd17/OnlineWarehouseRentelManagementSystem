SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;

DECLARE @Renter1Id INT = (SELECT user_id FROM users WHERE email = 'nxhoa2003@gmail.com');
DECLARE @Renter2Id INT = (SELECT user_id FROM users WHERE email = 'renter2@owrms.com');
DECLARE @OwnerId INT = (SELECT user_id FROM users WHERE email = 'owner@owrms.com');

-- Cập nhật null cho EquipmentUsageLogs nếu có (Dù k thấy)
-- Hay cập nhật equipment?
-- Xác định các Rental Request cần xoá
DECLARE @RentalRequestIds TABLE (request_id INT);
INSERT INTO @RentalRequestIds
SELECT request_id FROM rental_requests
WHERE (renter_id = @Renter1Id OR renter_id = @Renter2Id)

-- Xác định các Contract cần xoá
DECLARE @ContractIds TABLE (contract_id INT);
INSERT INTO @ContractIds
SELECT contract_id FROM contracts
WHERE renter_id = @Renter1Id OR renter_id = @Renter2Id;

-- Xác định các Inventory Request cần xoá
DECLARE @InvReqIds TABLE (inv_req_id INT);
INSERT INTO @InvReqIds
SELECT inv_req_id FROM inventory_requests
WHERE renter_id = @Renter1Id OR renter_id = @Renter2Id;

-- Xoá Payment & Logs của Contract
DELETE FROM contract_extensions WHERE original_contract_id IN (SELECT contract_id FROM @ContractIds) OR new_contract_id IN (SELECT contract_id FROM @ContractIds);
DELETE FROM ratings WHERE contract_id IN (SELECT contract_id FROM @ContractIds);
DELETE FROM return_images WHERE return_id IN (SELECT return_id FROM warehouse_returns WHERE contract_id IN (SELECT contract_id FROM @ContractIds));
DELETE FROM warehouse_returns WHERE contract_id IN (SELECT contract_id FROM @ContractIds);

-- Disable FK checks tạm thời nếu cần, nhưng cẩn thận.
-- Xoá Contract
BEGIN TRY
	DELETE FROM contracts WHERE contract_id IN (SELECT contract_id FROM @ContractIds);
END TRY
BEGIN CATCH
	PRINT ERROR_MESSAGE()
END CATCH

-- Xoá Rental Request
BEGIN TRY
	DELETE FROM rental_requests WHERE request_id IN (SELECT request_id FROM @RentalRequestIds);
END TRY
BEGIN CATCH
	PRINT ERROR_MESSAGE()
END CATCH

-- Xoá dữ liệu tồn kho (assets/inventories) của Renter
BEGIN TRY
	DELETE FROM renter_assets WHERE renter_id IN (@Renter1Id, @Renter2Id);
	DELETE FROM renter_inventories WHERE renter_id IN (@Renter1Id, @Renter2Id);
END TRY
BEGIN CATCH
END CATCH

-- Xoá Membership của renter trong Warehouse đó (role Renter)
BEGIN TRY
	DELETE FROM warehouse_membership_skills WHERE membership_id IN (SELECT membership_id FROM warehouse_memberships WHERE user_id IN (@Renter1Id, @Renter2Id));
	DELETE FROM warehouse_membership_zones WHERE membership_id IN (SELECT membership_id FROM warehouse_memberships WHERE user_id IN (@Renter1Id, @Renter2Id));
	DELETE FROM warehouse_memberships WHERE user_id IN (@Renter1Id, @Renter2Id);
END TRY
BEGIN CATCH
END CATCH

PRINT 'Thực thi dọn dẹp dữ liệu dùng thử thành công!';

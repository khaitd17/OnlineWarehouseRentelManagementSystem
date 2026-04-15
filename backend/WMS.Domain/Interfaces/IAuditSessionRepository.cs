namespace WMS.Domain.Interfaces;

/// <summary>
/// Repository phụ trợ cho AuditSessionsController — chứa các query nhỏ
/// mà controller cần để kiểm tra quyền hoặc trả dữ liệu đơn giản.
/// Các nghiệp vụ phức tạp vẫn nằm trong handler (CreateAuditSessionHandler, v.v.)
/// </summary>
public interface IAuditSessionRepository
{
    /// <summary>Lấy thông tin cơ bản của phiên kiểm kê (WarehouseId, CreatedBy, Status).</summary>
    Task<AuditSessionBasicDto?> GetSessionBasicAsync(int auditId, CancellationToken ct = default);

    /// <summary>Lấy danh sách nhân viên có skill INVENTORY_OPERATOR trong kho (dùng cho form giao việc).</summary>
    Task<List<AuditStaffDto>> GetInventoryStaffAsync(int warehouseId, CancellationToken ct = default);

    /// <summary>Lấy danh sách hàng hóa trong kho (warehouse_inventories).</summary>
    Task<List<AuditInventoryItemDto>> GetWarehouseInventoryAsync(int warehouseId, CancellationToken ct = default);

    /// <summary>
    /// Lấy hàng hóa cần kiểm kê:
    /// - creatorRole == "RENTER" → chỉ lấy renter_inventories của người tạo
    /// - Các role khác (OWNER) → lấy cả warehouse_inventories + tất cả renter_inventories
    /// </summary>
    Task<List<AuditInventoryItemDto>> GetInventoryToAuditAsync(
        int auditId, int warehouseId, int createdBy, string creatorRole,
        CancellationToken ct = default);
}

public class AuditSessionBasicDto
{
    public int AuditId      { get; set; }
    public int WarehouseId  { get; set; }
    public int CreatedBy    { get; set; }
    public string? Status   { get; set; }
}

public class AuditStaffDto
{
    public int    UserId   { get; set; }
    public string FullName { get; set; } = null!;
    public string Email    { get; set; } = null!;
    public string? Phone   { get; set; }
}

public class AuditInventoryItemDto
{
    public string ItemName { get; set; } = null!;
    public int    Quantity { get; set; }
    public string? Unit    { get; set; }
}

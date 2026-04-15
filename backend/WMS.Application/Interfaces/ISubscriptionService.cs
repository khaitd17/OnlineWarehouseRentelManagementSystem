namespace WMS.Application.Interfaces;

public enum SubscriptionLimitType
{
    WarehouseCount,
    StaffCount,
    ZoneCount,
    TotalArea,
    EquipmentManagement
}

public interface ISubscriptionService
{
    /// <summary>
    /// Kiểm tra xem người dùng có gói dịch vụ đang hoạt động hay không (Real-time)
    /// </summary>
    Task<bool> IsSubscriptionActiveAsync(int userId);

    /// <summary>
    /// Kiểm tra xem thao tác sắp tới có vượt quá giới hạn của gói không
    /// </summary>
    Task<(bool IsAllowed, string Message)> CheckLimitAsync(int userId, SubscriptionLimitType limitType, decimal currentCount = 0);

    /// <summary>
    /// Lấy thông tin chi tiết về các giới hạn của gói hiện tại của người dùng
    /// </summary>
    Task<dynamic> GetUserSubscriptionStatusAsync(int userId);
    
    /// <summary>
    /// Dự đoán ngày kết thúc mới khi nâng cấp hoặc gia hạn gói cước
    /// </summary>
    Task<dynamic> PreviewSubscriptionAsync(int userId, string targetPlan);
}

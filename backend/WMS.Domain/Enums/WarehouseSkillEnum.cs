namespace WMS.Domain.Enums;

/// <summary>
/// Loại nhân viên kho — 3 loại hợp lệ.
/// </summary>
public enum WarehouseSkill
{
    /// <summary>Kiểm tra đơn hàng, nhận hàng, xuất hàng (Inbound / Outbound)</summary>
    CHECKER,

    /// <summary>Sắp xếp vị trí, xử lý kiểm kê</summary>
    INVENTORY_OPERATOR,

    /// <summary>Nhân viên phổ thông — chỉ quản lý ca (Shift)</summary>
    WAREHOUSE_WORKER,
}

public static class WarehouseSkillExtensions
{
    public static readonly string[] AllCodes = new[]
    {
        nameof(WarehouseSkill.CHECKER),
        nameof(WarehouseSkill.INVENTORY_OPERATOR),
        nameof(WarehouseSkill.WAREHOUSE_WORKER),
    };

    public static bool IsValid(string? code)
        => code != null && AllCodes.Contains(code, StringComparer.OrdinalIgnoreCase);

    public static string ToName(WarehouseSkill skill) => skill switch
    {
        WarehouseSkill.CHECKER            => "Kiểm tra / Nhận & Xuất hàng",
        WarehouseSkill.INVENTORY_OPERATOR => "Vận hành kho",
        WarehouseSkill.WAREHOUSE_WORKER   => "Nhân viên phổ thông",
        _                                 => skill.ToString()
    };
}

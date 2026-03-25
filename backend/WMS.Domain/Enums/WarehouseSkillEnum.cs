namespace WMS.Domain.Enums;

/// <summary>
/// Các bộ phận nghiệp vụ trong kho hàng.
/// Chỉ có 3 giá trị hợp lệ.
/// </summary>
public enum WarehouseSkill
{
    /// <summary>Kiểm tra đơn hàng</summary>
    CHECK_ORDER,

    /// <summary>Cất hàng vào vị trí</summary>
    PUTAWAY,

    /// <summary>Kiểm kê tồn kho</summary>
    INVENTORY_COUNT
}

public static class WarehouseSkillExtensions
{
    public static readonly string[] AllCodes = new[]
    {
        nameof(WarehouseSkill.CHECK_ORDER),
        nameof(WarehouseSkill.PUTAWAY),
        nameof(WarehouseSkill.INVENTORY_COUNT),
    };

    public static bool IsValid(string? code)
        => code != null && AllCodes.Contains(code, StringComparer.OrdinalIgnoreCase);

    public static string ToName(WarehouseSkill skill) => skill switch
    {
        WarehouseSkill.CHECK_ORDER     => "Kiểm tra đơn hàng",
        WarehouseSkill.PUTAWAY         => "Cất hàng vào vị trí",
        WarehouseSkill.INVENTORY_COUNT => "Kiểm kê tồn kho",
        _                              => skill.ToString()
    };
}

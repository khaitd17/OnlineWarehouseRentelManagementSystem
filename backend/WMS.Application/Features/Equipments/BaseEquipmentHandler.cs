using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Equipments;

public abstract class BaseEquipmentHandler
{
    protected readonly IWarehouseRepository WarehouseRepository;
    protected readonly IStaffMembershipRepository MembershipRepository;

    protected BaseEquipmentHandler(
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository)
    {
        WarehouseRepository = warehouseRepository;
        MembershipRepository = membershipRepository;
    }

    protected async Task<string> EnsureCanManageEquipment(int warehouseId, int userId, CancellationToken ct, bool isStaffAllowed = false, bool isDelete = false)
    {
        // Check if user is owner
        var ownerId = await WarehouseRepository.FindWarehouseOwnerById(warehouseId, ct);
        if (ownerId == userId) return "OWNER";

        // Check if user has staff/manager membership
        var membership = await MembershipRepository.GetCallerMembershipAsync(userId, warehouseId, ct);
        if (membership == null)
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập vào kho này.");

        var role = membership.RoleCode;

        if (isDelete)
        {
            // Owner is returned above. Manager/Operator/Staff cannot delete.
            throw new UnauthorizedAccessException("Chỉ Chủ kho (OWNER) mới có quyền xóa thiết bị.");
        }

        // isStaffAllowed == true means operations like Update Status, Maintenance, Read, etc.
        if (isStaffAllowed)
        {
            if (role == "MANAGER" || role == "OPERATOR" || role == "STAFF") return role;
        }

        // Add/Update info/Control/Assign: OWNER or MANAGER. Operator/Staff cannot do these core info changes.
        if (role == "MANAGER") return role;

        throw new UnauthorizedAccessException("Bạn không có quyền quản lý thông tin của thiết bị này.");
    }
}

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

    protected async Task EnsureCanManageEquipment(int warehouseId, int userId, CancellationToken ct, bool isStaffAllowed = false, bool isDelete = false)
    {
        // Check if user is owner
        var ownerId = await WarehouseRepository.FindWarehouseOwnerById(warehouseId, ct);
        if (ownerId == userId) return;

        // Check if user has staff/manager membership
        var membership = await MembershipRepository.GetCallerMembershipAsync(userId, warehouseId, ct);
        if (membership == null)
            throw new UnauthorizedAccessException("You don't have access to this warehouse.");

        var role = membership.RoleCode;
        
        if (isDelete)
        {
            // Delete: OWNER or OPERATOR only
            if (role == "OPERATOR") return;
            throw new UnauthorizedAccessException("Only OWNER or OPERATOR can delete equipment.");
        }

        // Add/Update info/Control: OWNER, OPERATOR, MANAGER
        if (role == "OPERATOR" || role == "MANAGER") return;

        // Update status or view: STAFF is allowed if specifically flagged
        if (isStaffAllowed && role == "STAFF") return;

        throw new UnauthorizedAccessException("You don't have permission to perform this equipment operation.");
    }
}

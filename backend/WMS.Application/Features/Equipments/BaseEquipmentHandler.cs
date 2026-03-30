using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Equipments;

public abstract class BaseEquipmentHandler
{
    protected readonly IWarehouseRepository WarehouseRepository;
    protected readonly IStaffMembershipRepository MembershipRepository;
    protected readonly IRentalContractRepository ContractRepository;

    protected BaseEquipmentHandler(
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository,
        IRentalContractRepository contractRepository)
    {
        WarehouseRepository = warehouseRepository;
        MembershipRepository = membershipRepository;
        ContractRepository = contractRepository;
    }

    protected async Task<string> EnsureCanManageEquipment(int warehouseId, int userId, CancellationToken ct, bool isStaffAllowed = false, bool isDelete = false)
    {
        // Check if user is owner
        var ownerId = await WarehouseRepository.FindWarehouseOwnerById(warehouseId, ct);
        if (ownerId == userId) return "OWNER";

        // Check if user has staff/manager membership
        var membership = await MembershipRepository.GetCallerMembershipAsync(userId, warehouseId, ct);
        if (membership != null)
        {
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
        }

        // Check if user is Renter of this warehouse
        var userContracts = await ContractRepository.GetByRenterIdAsync(userId);
        var hasActiveContractInWarehouse = userContracts.Any(c => c.WarehouseId == warehouseId && 
            (c.Status == "ACTIVE" || c.Status == "PENDING_PAYMENT"));

        if (hasActiveContractInWarehouse && isStaffAllowed && !isDelete)
        {
            return "RENTER";
        }

        throw new UnauthorizedAccessException("Bạn không có quyền truy cập hoặc quản lý thông tin của thiết bị này.");
    }
}

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
        // OPERATOR được làm tất cả vận hành thiết bị (add/update/delete/control/read)
        bool isOperator = await MembershipRepository.HasRoleAsync(userId, warehouseId, "OPERATOR", ct);
        if (isOperator)
        {
            return "OPERATOR";
        }

        // MANAGER: add/update/control/read — không được delete
        var managerMembership = await MembershipRepository.GetMembershipByRoleAsync(userId, warehouseId, "MANAGER", ct);
        if (managerMembership != null)
        {
            if (isDelete)
                throw new UnauthorizedAccessException("Chỉ OPERATOR mới có quyền xóa thiết bị.");
            return "MANAGER";
        }

        // STAFF/RENTER: chỉ được đọc và cập nhật trạng thái (isStaffAllowed = true)
        if (isStaffAllowed)
        {
            var membership = await MembershipRepository.GetCallerMembershipAsync(userId, warehouseId, ct);
            if (membership != null && (membership.RoleCode == "STAFF" || membership.RoleCode == "RENTER"))
                return membership.RoleCode;

            // Kiểm tra RENTER có hợp đồng hoạt động không
            var userContracts = await ContractRepository.GetByRenterIdAsync(userId);
            var inWarehouse = userContracts.Any(c => c.WarehouseId == warehouseId &&
                (c.Status == "ACTIVE" || c.Status == "PENDING_PAYMENT"));
            if (inWarehouse) return "RENTER";
        }

        throw new UnauthorizedAccessException("Bạn không có quyền quản lý thiết bị trong kho này.");
    }
}

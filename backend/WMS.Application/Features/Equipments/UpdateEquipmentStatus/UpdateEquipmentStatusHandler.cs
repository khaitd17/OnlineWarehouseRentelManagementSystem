using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Equipments.UpdateEquipmentStatus;

public class UpdateEquipmentStatusHandler : BaseEquipmentHandler, IRequestHandler<UpdateEquipmentStatusCommand>
{
    private readonly IEquipmentRepository _equipmentRepository;

    public UpdateEquipmentStatusHandler(
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository,
        IEquipmentRepository equipmentRepository) 
        : base(warehouseRepository, membershipRepository)
    {
        _equipmentRepository = equipmentRepository;
    }

    public async Task Handle(UpdateEquipmentStatusCommand request, CancellationToken cancellationToken)
    {
        var equipment = await _equipmentRepository.GetByIdAsync(request.EquipmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Equipment not found");

        var role = await EnsureCanManageEquipment(equipment.WarehouseId, request.RequestUserId, cancellationToken, isStaffAllowed: true);

        string currentStatus = equipment.Status ?? "AVAILABLE";
        string newStatus = request.Status.ToUpper();

        if (currentStatus == newStatus) return;

        if (role == "STAFF")
        {
            if (newStatus != "BROKEN" && newStatus != "MAINTENANCE")
                throw new UnauthorizedAccessException("Nhân viên (STAFF) chỉ có quyền báo cáo sự cố phần cứng (BROKEN, MAINTENANCE).");
        }
        else if (role == "OPERATOR")
        {
            if (newStatus != "BROKEN" && newStatus != "MAINTENANCE" && newStatus != "AVAILABLE")
                throw new UnauthorizedAccessException("Vận hành viên (OPERATOR) có quyền cập nhật trạng thái hoạt động nhưng KHÔNG ĐƯỢC thanh lý thiết bị (RETIRED).");
        }

        // Lifecycle validation
        bool isValid = false;
        switch (currentStatus)
        {
            case "AVAILABLE":
                isValid = true; // Can go anywhere from Available
                break;
            case "IN_USE":
                // In Use -> Available (Rental end), Broken
                if (newStatus == "AVAILABLE" || newStatus == "BROKEN") isValid = true;
                break;
            case "MAINTENANCE":
                // Maintenance -> Available, Broken
                if (newStatus == "AVAILABLE" || newStatus == "BROKEN") isValid = true;
                break;
            case "BROKEN":
                // Broken -> Maintenance, Retired
                if (newStatus == "MAINTENANCE" || newStatus == "RETIRED") isValid = true;
                break;
            case "RETIRED":
                isValid = false; // Cannot transition from Retired
                break;
        }

        if (!isValid)
            throw new InvalidOperationException($"Invalid status transition from {currentStatus} to {newStatus}");

        // Rule: Only allow IN_USE transition if rental context is provided (handled elsewhere usually, but let's check)
        // For now, allow staff to set it if they know what they are doing, but history will track it.

        await _equipmentRepository.UpdateStatusAsync(request.EquipmentId, newStatus, cancellationToken);

        // Add history record
        await _equipmentRepository.AddHistoryAsync(new EquipmentHistory
        {
            EquipmentId = request.EquipmentId,
            PreviousStatus = currentStatus,
            NewStatus = newStatus,
            ChangedBy = request.RequestUserId,
            Note = request.Note ?? $"Status updated from {currentStatus} to {newStatus}"
        }, cancellationToken);
    }
}

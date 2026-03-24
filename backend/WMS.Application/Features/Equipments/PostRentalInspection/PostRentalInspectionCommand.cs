using MediatR;
using System.Collections.Generic;

namespace WMS.Application.Features.Equipments.PostRentalInspection;

public class PostRentalInspectionCommand : IRequest
{
    public int ContractId { get; set; }
    public List<EquipmentInspectionResult> Inspections { get; set; } = new();
    public int RequestUserId { get; set; }
}

public class EquipmentInspectionResult
{
    public int EquipmentId { get; set; }
    public string NewStatus { get; set; } = null!; // AVAILABLE, BROKEN, MAINTENANCE
    public string? Note { get; set; }
}

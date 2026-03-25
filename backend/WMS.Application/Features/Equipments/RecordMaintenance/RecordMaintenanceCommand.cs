using MediatR;
using System;

namespace WMS.Application.Features.Equipments.RecordMaintenance;

public class RecordMaintenanceCommand : IRequest
{
    public int EquipmentId { get; set; }
    public DateTime? MaintenanceDate { get; set; }
    public string? MaintenanceType { get; set; }
    public string? Description { get; set; }
    public decimal? TotalCost { get; set; }
    public string? PerformedBy { get; set; }
    public string? ResolutionStatus { get; set; }
    public string? Note { get; set; }
    public string? NewEquipmentStatus { get; set; } // e.g., Set to AVAILABLE after maintenance
    public int RequestUserId { get; set; }
}

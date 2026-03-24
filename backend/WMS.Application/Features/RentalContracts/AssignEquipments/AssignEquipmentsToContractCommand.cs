using MediatR;
using System.Collections.Generic;

namespace WMS.Application.Features.RentalContracts.AssignEquipments;

public class AssignEquipmentsToContractCommand : IRequest
{
    public int ContractId { get; set; }
    public List<int> EquipmentIds { get; set; } = new();
    public int RequestUserId { get; set; }
}

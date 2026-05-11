using MediatR;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class UpdateContractRevisionStatusCommand : IRequest<Unit>
{
    public int ThreadId { get; set; }
    public int UserId { get; set; }
    public string Status { get; set; } = null!;
}

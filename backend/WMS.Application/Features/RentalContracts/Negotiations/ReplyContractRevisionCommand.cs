using MediatR;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class ReplyContractRevisionCommand : IRequest<Unit>
{
    public int ThreadId { get; set; }
    public int UserId { get; set; }
    public string Message { get; set; } = null!;
}

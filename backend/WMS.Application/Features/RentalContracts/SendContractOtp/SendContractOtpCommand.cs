using MediatR;

namespace WMS.Application.Features.RentalContracts.SendContractOtp;

public class SendContractOtpCommand : IRequest<Unit>
{
    public int ContractId { get; set; }
    public int UserId { get; set; }
}

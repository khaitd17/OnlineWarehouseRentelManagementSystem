using MediatR;

namespace WMS.Application.Features.RentalContracts.VerifyContractOtp;

public class VerifyContractOtpCommand : IRequest<Unit>
{
    public int ContractId { get; set; }
    public int UserId { get; set; }
    public string OtpCode { get; set; } = null!;
}

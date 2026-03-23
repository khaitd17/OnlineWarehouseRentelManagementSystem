using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.VerifyContractOtp;

public class VerifyContractOtpHandler : IRequestHandler<VerifyContractOtpCommand, Unit>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IContractVerificationRepository _verificationRepo;
    private readonly IContractLogRepository _logRepo;

    public VerifyContractOtpHandler(
        IRentalContractRepository contractRepo,
        IContractVerificationRepository verificationRepo,
        IContractLogRepository logRepo)
    {
        _contractRepo = contractRepo;
        _verificationRepo = verificationRepo;
        _logRepo = logRepo;
    }

    public async Task<Unit> Handle(VerifyContractOtpCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        if (contract.RenterId != request.UserId)
            throw new UnauthorizedAccessException("Only the renter can verify OTP");

        var verification = await _verificationRepo.GetLatestByContractAndUserAsync(request.ContractId, request.UserId)
            ?? throw new InvalidOperationException("No OTP found. Please request a new one.");

        if (verification.IsVerified)
            throw new InvalidOperationException("OTP already verified");

        if (verification.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("OTP has expired. Please request a new one.");

        if (verification.OtpCode != request.OtpCode)
            throw new InvalidOperationException("Invalid OTP code");

        await _verificationRepo.MarkAsVerifiedAsync(verification.VerificationId);

        await _logRepo.AddAsync(new ContractLog
        {
            ContractId = request.ContractId,
            UserId = request.UserId,
            Action = "OTP_VERIFIED"
        });

        return Unit.Value;
    }
}

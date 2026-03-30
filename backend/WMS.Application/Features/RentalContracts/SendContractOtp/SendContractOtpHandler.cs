using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.SendContractOtp;

public class SendContractOtpHandler : IRequestHandler<SendContractOtpCommand, Unit>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IContractVerificationRepository _verificationRepo;
    private readonly IContractLogRepository _logRepo;
    private readonly IUserRepository _userRepo;
    private readonly IEmailService _emailService;

    public SendContractOtpHandler(
        IRentalContractRepository contractRepo,
        IContractVerificationRepository verificationRepo,
        IContractLogRepository logRepo,
        IUserRepository userRepo,
        IEmailService emailService)
    {
        _contractRepo = contractRepo;
        _verificationRepo = verificationRepo;
        _logRepo = logRepo;
        _userRepo = userRepo;
        _emailService = emailService;
    }

    public async Task<Unit> Handle(SendContractOtpCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        if (contract.RenterId != request.UserId)
            throw new UnauthorizedAccessException("Only the renter can sign the contract");

        if (contract.Status != "DRAFT" && contract.Status != "PENDING_RENTER_SIGNATURE")
            throw new InvalidOperationException($"Cannot send OTP for contract with status {contract.Status}");

        var user = await _userRepo.GetByIdAsync(request.UserId, cancellationToken)
            ?? throw new InvalidOperationException("User not found");

        // Generate 6-digit OTP
        var otp = new Random().Next(100000, 999999).ToString();

        var verification = new ContractVerification
        {
            ContractId = request.ContractId,
            UserId = request.UserId,
            OtpCode = otp,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5)
        };
        await _verificationRepo.AddAsync(verification);

        // Update contract status to PENDING_SIGNATURE
        contract.MarkPendingSignature();
        await _contractRepo.UpdateAsync(contract);

        // Send OTP email
        var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; border-top: 4px solid #0095c7;'>
    <h2 style='color: #0f172a; text-align: center;'>Xac nhan ky hop dong</h2>
    <p style='color: #64748b; font-size: 14px;'>Xin chao {user.FullName},</p>
    <p style='color: #64748b; font-size: 14px;'>Ma OTP cua ban de ky hop dong <strong>{contract.ContractNumber}</strong>:</p>
    <div style='text-align: center; margin: 24px 0;'>
        <span style='font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0095c7; background: #f0f9ff; padding: 12px 24px; border-radius: 8px;'>
            {otp}
        </span>
    </div>
    <p style='color: #94a3b8; font-size: 12px; text-align: center;'>Ma OTP co hieu luc trong 5 phut.</p>
</div>";

        await _emailService.SendInfo(user.Email, user.FullName, "Ma OTP ky hop dong - OWRMS", htmlContent);

        // Log
        await _logRepo.AddAsync(new ContractLog
        {
            ContractId = request.ContractId,
            UserId = request.UserId,
            Action = "OTP_SENT",
            Details = $"OTP sent to {user.Email}"
        });

        return Unit.Value;
    }
}

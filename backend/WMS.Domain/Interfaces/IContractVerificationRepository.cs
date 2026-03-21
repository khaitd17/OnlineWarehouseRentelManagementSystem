using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IContractVerificationRepository
{
    Task<int> AddAsync(ContractVerification verification);
    Task<ContractVerification?> GetLatestByContractAndUserAsync(int contractId, int userId);
    Task MarkAsVerifiedAsync(int verificationId);
}

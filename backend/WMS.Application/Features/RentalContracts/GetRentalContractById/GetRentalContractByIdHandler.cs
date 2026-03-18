using MediatR;
using WMS.Application.Features.RentalContracts.Common;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.GetRentalContractById;

public class GetRentalContractByIdHandler : IRequestHandler<GetRentalContractByIdQuery, RentalContractDto?>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IUserRepository _userRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IRentalRequestRepository _rentalRequestRepo;

    public GetRentalContractByIdHandler(
        IRentalContractRepository contractRepo,
        IUserRepository userRepo,
        IWarehouseRepository warehouseRepo,
        IRentalRequestRepository rentalRequestRepo)
    {
        _contractRepo = contractRepo;
        _userRepo = userRepo;
        _warehouseRepo = warehouseRepo;
        _rentalRequestRepo = rentalRequestRepo;
    }

    public async Task<RentalContractDto?> Handle(
        GetRentalContractByIdQuery request,
        CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId);
        if (contract == null) return null;

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);

        // Only the renter or the warehouse owner can view the contract
        var isRenter = contract.RenterId == request.UserId;
        var isOwner = warehouse?.OwnerId == request.UserId;
        if (!isRenter && !isOwner)
            throw new UnauthorizedAccessException("Access denied");

        var renter = await _userRepo.GetByIdAsync(contract.RenterId, cancellationToken);
        var owner = warehouse != null
            ? await _userRepo.GetByIdAsync(warehouse.OwnerId, cancellationToken)
            : null;
        var rentalRequest = await _rentalRequestRepo.GetByIdAsync(contract.RentalRequestId);

        return new RentalContractDto
        {
            ContractId = contract.ContractId,
            RentalRequestId = contract.RentalRequestId,
            ContractNumber = contract.ContractNumber,
            RenterId = contract.RenterId,
            RenterName = renter?.FullName ?? "Unknown",
            RenterEmail = renter?.Email ?? "",
            OwnerName = owner?.FullName ?? "",
            WarehouseId = contract.WarehouseId,
            WarehouseName = warehouse?.Name ?? "Unknown",
            WarehouseAddress = warehouse?.Address ?? "",
            StartDate = contract.StartDate,
            EndDate = contract.EndDate,
            MonthlyPayment = contract.MonthlyPayment,
            TotalValue = contract.TotalValue,
            DepositAmount = contract.DepositAmount,
            Status = contract.Status,
            Terms = contract.Terms,
            ContractFileUrl = contract.ContractFileUrl,
            SignedFileUrl = contract.SignedFileUrl,
            ContractImageUrl = rentalRequest?.ContractImageUrl,
            SignedAt = contract.SignedAt,
            OwnerSignedFileUrl = contract.OwnerSignedFileUrl,
            OwnerSignedAt = contract.OwnerSignedAt,
            OwnerSignatureBase64 = contract.OwnerSignatureBase64,
            CreatedAt = contract.CreatedAt
        };
    }
}

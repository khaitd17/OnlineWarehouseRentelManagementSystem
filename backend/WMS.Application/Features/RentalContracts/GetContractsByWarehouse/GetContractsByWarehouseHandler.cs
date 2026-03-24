using MediatR;
using WMS.Application.Features.RentalContracts.Common;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.GetContractsByWarehouse;

public class GetContractsByWarehouseHandler : IRequestHandler<GetContractsByWarehouseQuery, IEnumerable<RentalContractDto>>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IRentalRequestRepository _requestRepo;
    private readonly IUserRepository _userRepo;
    private readonly IWarehouseRepository _warehouseRepo;

    public GetContractsByWarehouseHandler(
        IRentalContractRepository contractRepo,
        IRentalRequestRepository requestRepo,
        IUserRepository userRepo,
        IWarehouseRepository warehouseRepo)
    {
        _contractRepo = contractRepo;
        _requestRepo = requestRepo;
        _userRepo = userRepo;
        _warehouseRepo = warehouseRepo;
    }

    public async Task<IEnumerable<RentalContractDto>> Handle(
        GetContractsByWarehouseQuery request,
        CancellationToken cancellationToken)
    {
        var warehouse = await _warehouseRepo.GetByIdAsync(request.WarehouseId, cancellationToken)
            ?? throw new InvalidOperationException("Warehouse not found");

        if (warehouse.OwnerId != request.OwnerId)
            throw new UnauthorizedAccessException("Only warehouse owner can view contracts");

        var contracts = await _contractRepo.GetByWarehouseIdAsync(request.WarehouseId);

        var result = new List<RentalContractDto>();
        foreach (var contract in contracts)
        {
            var renter = await _userRepo.GetByIdAsync(contract.RenterId, cancellationToken);
            var rentalRequest = await _requestRepo.GetByIdAsync(contract.RentalRequestId);

            result.Add(new RentalContractDto
            {
                ContractId = contract.ContractId,
                RentalRequestId = contract.RentalRequestId,
                ContractNumber = contract.ContractNumber,
                RenterId = contract.RenterId,
                RenterName = renter?.FullName ?? "Unknown",
                RenterEmail = renter?.Email ?? "",
                WarehouseId = contract.WarehouseId,
                WarehouseName = warehouse.Name,
                WarehouseAddress = warehouse.Address,
                StartDate = contract.StartDate,
                EndDate = contract.EndDate,
                MonthlyPayment = contract.MonthlyPayment,
                TotalValue = contract.TotalValue,
                DepositAmount = contract.DepositAmount,
                Status = contract.Status,
                Terms = contract.Terms,
                RentalAreaId = rentalRequest?.RentalAreaId,
                RequestedArea = rentalRequest?.RequestedArea ?? 0,
                CreatedAt = contract.CreatedAt
            });
        }

        return result;
    }
}

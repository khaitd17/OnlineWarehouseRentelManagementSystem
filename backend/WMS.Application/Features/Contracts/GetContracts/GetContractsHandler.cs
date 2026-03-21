using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Contracts.GetContracts
{
    public class GetContractsHandler : IRequestHandler<GetContractsQuery, GetContractsResponse>
    {
        private readonly IRentalContractRepository _contractRepository;

        public GetContractsHandler(IRentalContractRepository contractRepository)
        {
            _contractRepository = contractRepository;
        }

        public async Task<GetContractsResponse> Handle(GetContractsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Get contracts with filtering and pagination
                var contracts = await _contractRepository.GetPagedAsync(
                    pageNumber: request.PageNumber,
                    pageSize: request.PageSize,
                    userId: request.UserId,
                    status: request.Status,
                    startDateFrom: request.StartDateFrom,
                    startDateTo: request.StartDateTo);

                var totalCount = await _contractRepository.CountAsync(
                    userId: request.UserId,
                    status: request.Status,
                    startDateFrom: request.StartDateFrom,
                    startDateTo: request.StartDateTo);

                return new GetContractsResponse
                {
                    Success = true,
                    Message = "Contracts retrieved successfully",
                    Contracts = contracts.Select(c => new ContractSummaryDto
                    {
                        ContractId = c.ContractId,
                        ContractNumber = c.ContractNumber,
                        Status = c.Status,
                        RenterName = "Renter", // TODO: Get from related entities
                        WarehouseName = "Warehouse", // TODO: Get from related entities
                        StartDate = c.StartDate,
                        EndDate = c.EndDate,
                        MonthlyPayment = c.MonthlyPayment,
                        TotalValue = c.TotalValue,
                        CreatedAt = c.CreatedAt,
                        SignedAt = c.SignedAt,
                        ParentContractId = c.ParentContractId
                    }).ToList(),
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                };
            }
            catch (Exception ex)
            {
                return new GetContractsResponse
                {
                    Success = false,
                    Message = $"Error retrieving contracts: {ex.Message}"
                };
            }
        }
    }
}
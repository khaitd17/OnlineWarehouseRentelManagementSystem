using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Staff.ListStaff
{
    public class ListStaffHandler : IRequestHandler<ListStaffCommand, ListStaffResponse>
    {
        private readonly IStaffAssigmentRepository _staffAssignmentRepository;
        private readonly IWarehouseRepository _warehouseRepository;

        public ListStaffHandler(
            IStaffAssigmentRepository staffAssignmentRepository,
            IWarehouseRepository warehouseRepository
        )
        {
            _staffAssignmentRepository = staffAssignmentRepository;
            _warehouseRepository = warehouseRepository;
        }

        public async Task<ListStaffResponse> Handle(
            ListStaffCommand request,
            CancellationToken cancellationToken)
        {
            // If WarehouseId is provided, check authorization
            if (request.WarehouseId.HasValue)
            {
                var warehouseOwnerId = await _warehouseRepository.FindWarehouseOwnerById(
                    request.WarehouseId.Value, cancellationToken);

                if (warehouseOwnerId == null)
                    throw new Exception($"Warehouse with id {request.WarehouseId} not found");

                // Check if current user is the owner of the warehouse
                if (warehouseOwnerId.Value != request.OwnerId)
                    throw new Exception($"User {request.OwnerId} is not the owner of warehouse {request.WarehouseId}");

                // Get staff by warehouse
                var staffData = await _staffAssignmentRepository.GetStaffByWarehouseIdAsync(
                    request.WarehouseId.Value, request.PageNumber, request.PageSize, cancellationToken);

                var totalCount = await _staffAssignmentRepository.GetTotalCountByWarehouseIdAsync(
                    request.WarehouseId.Value, cancellationToken);

                return MapToResponse(staffData, totalCount, request.PageNumber, request.PageSize);
            }
            else
            {
                // Get all staff by owner
                var staffData = await _staffAssignmentRepository.GetStaffByOwnerIdAsync(
                    request.OwnerId, request.PageNumber, request.PageSize, cancellationToken);

                var totalCount = await _staffAssignmentRepository.GetTotalCountByOwnerIdAsync(
                    request.OwnerId, cancellationToken);

                return MapToResponse(staffData, totalCount, request.PageNumber, request.PageSize);
            }
        }

        private ListStaffResponse MapToResponse(
            List<StaffAssignmentDto> staffData,
            int totalCount,
            int pageNumber,
            int pageSize)
        {
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            return new ListStaffResponse
            {
                Data = staffData.Select(s => new StaffDto
                {
                    AssignmentId = s.AssignmentId,
                    StaffId = s.StaffId,
                    WarehouseId = s.WarehouseId,
                    FullName = s.FullName,
                    Email = s.Email,
                    Phone = s.Phone,
                    Status = s.Status,
                    AssignedAt = s.AssignedAt,
                    EndDate = s.EndDate,
                    Notes = s.Notes
                }).ToList(),
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = totalPages
            };
        }
    }
}

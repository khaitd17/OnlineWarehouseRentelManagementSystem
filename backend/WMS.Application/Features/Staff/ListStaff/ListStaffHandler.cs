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
                List<StaffAssignmentDto> staffData;

                if (!string.IsNullOrEmpty(request.SearchKeyword))
                {
                    staffData = await _staffAssignmentRepository.SearchStaffByWarehouseIdAsync(
                        request.WarehouseId.Value, request.SearchKeyword, cancellationToken);
                }
                else
                {
                    staffData = await _staffAssignmentRepository.GetStaffByWarehouseIdAsync(
                        request.WarehouseId.Value, cancellationToken);
                }

                return MapToResponse(staffData, request.PageNumber, request.PageSize);
            }
            else
            {
                // Get all staff by owner (get all data, paginate in-memory)
                List<StaffAssignmentDto> staffData;

                if (!string.IsNullOrEmpty(request.SearchKeyword))
                {
                    staffData = await _staffAssignmentRepository.SearchStaffByOwnerIdAsync(
                        request.OwnerId, request.SearchKeyword, cancellationToken);
                }
                else
                {
                    staffData = await _staffAssignmentRepository.GetStaffByOwnerIdAsync(
                        request.OwnerId, cancellationToken);
                }

                return MapToResponse(staffData, request.PageNumber, request.PageSize);
            }
        }

        private ListStaffResponse MapToResponse(
            List<StaffAssignmentDto> staffData,
            int pageNumber,
            int pageSize)
        {
            // Filter only ACTIVE assignments
            var activeAssignments = staffData
                .Where(s => s.Status == "ACTIVE")
                .ToList();

            var totalCount = activeAssignments.Count;
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            // Apply pagination
            var pagedAssignments = activeAssignments
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            // Map to response DTOs
            var staffDtos = pagedAssignments.Select(s => new StaffDto
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
            }).ToList();

            return new ListStaffResponse
            {
                Data = staffDtos,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = totalPages
            };
        }
    }
}

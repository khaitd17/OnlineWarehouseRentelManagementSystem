using MediatR;

namespace WMS.Application.Features.Staff.ListStaff
{
    public class ListStaffCommand : IRequest<ListStaffResponse>
    {
        public int? WarehouseId { get; set; }
        public int OwnerId { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }

        public ListStaffCommand(int? warehouseId, int ownerId, int pageNumber = 1, int pageSize = 10)
        {
            WarehouseId = warehouseId;
            OwnerId = ownerId;
            PageNumber = pageNumber > 0 ? pageNumber : 1;
            PageSize = pageSize > 0 ? pageSize : 10;
        }
    }

    public class ListStaffResponse
    {
        public List<StaffDto> Data { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class StaffDto
    {
        public int AssignmentId { get; set; }
        public int StaffId { get; set; }
        public int WarehouseId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Status { get; set; }
        public DateOnly? AssignedAt { get; set; }
        public DateOnly? EndDate { get; set; }
        public string? Notes { get; set; }
    }
}

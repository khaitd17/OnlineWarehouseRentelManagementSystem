using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces
{
    public interface IStaffAssigmentRepository
    {
        Task<StaffAssignment> AddAsync(StaffAssignment assignment,CancellationToken tk);
        Task<List<StaffAssignmentDto>> GetStaffByWarehouseIdAsync(int warehouseId, int pageNumber, int pageSize, CancellationToken tk = default);
        Task<List<StaffAssignmentDto>> GetStaffByOwnerIdAsync(int ownerId, int pageNumber, int pageSize, CancellationToken tk = default);
        Task<int> GetTotalCountByWarehouseIdAsync(int warehouseId, CancellationToken tk = default);
        Task<int> GetTotalCountByOwnerIdAsync(int ownerId, CancellationToken tk = default);
    }

    public record StaffAssignmentDto(
        int AssignmentId,
        int StaffId,
        int WarehouseId,
        string FullName,
        string Email,
        string? Phone,
        string? Status,
        DateOnly? AssignedAt,
        DateOnly? EndDate,
        string? Notes
    );
}

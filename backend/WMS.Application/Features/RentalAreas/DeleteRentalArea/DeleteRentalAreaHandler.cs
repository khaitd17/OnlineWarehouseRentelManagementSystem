using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalAreas.DeleteRentalArea;

public class DeleteRentalAreaHandler : IRequestHandler<DeleteRentalAreaCommand, bool>
{
    private readonly IRentalAreaRepository _rentalAreaRepository;

    public DeleteRentalAreaHandler(IRentalAreaRepository rentalAreaRepository)
    {
        _rentalAreaRepository = rentalAreaRepository;
    }

    public async Task<bool> Handle(DeleteRentalAreaCommand request, CancellationToken cancellationToken)
    {
        var rentalArea = await _rentalAreaRepository.GetByIdAsync(request.Id, cancellationToken);
        if (rentalArea == null)
            throw new Exception("Không tìm thấy khu vực này.");

        var isOccupied = await _rentalAreaRepository.IsAreaOccupiedAsync(request.Id, cancellationToken);
        if (isOccupied)
            throw new Exception("Không thể xóa khu vực đang có hợp đồng thuê hoạt động.");

        await _rentalAreaRepository.DeleteAsync(rentalArea, cancellationToken);
        return true;
    }
}

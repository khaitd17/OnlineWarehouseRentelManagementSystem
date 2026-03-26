using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Ratings.CreateRating;

public class CreateRatingHandler : IRequestHandler<CreateRatingCommand, int>
{
    private readonly IRatingRepository _ratingRepository;

    public CreateRatingHandler(IRatingRepository ratingRepository)
    {
        _ratingRepository = ratingRepository;
    }

    public async Task<int> Handle(CreateRatingCommand request, CancellationToken cancellationToken)
    {
        // Validate star range
        if (request.Star < 1 || request.Star > 5)
            throw new ArgumentException("Số sao phải từ 1 đến 5.");

        // Check duplicate: one rating per contract
        if (request.ContractId.HasValue)
        {
            var existing = await _ratingRepository.GetByContractIdAsync(request.ContractId.Value, cancellationToken);
            if (existing != null)
                throw new InvalidOperationException("Bạn đã đánh giá hợp đồng này rồi.");
        }

        var rating = new Rating
        {
            WarehouseId = request.WarehouseId,
            RenterId    = request.RenterId,
            ContractId  = request.ContractId,
            Star        = request.Star,
            Comment     = request.Comment,
            IsHidden    = false,
            CreatedAt   = DateTime.UtcNow,
            UpdatedAt   = DateTime.UtcNow,
        };

        return await _ratingRepository.CreateAsync(rating, cancellationToken);
    }
}

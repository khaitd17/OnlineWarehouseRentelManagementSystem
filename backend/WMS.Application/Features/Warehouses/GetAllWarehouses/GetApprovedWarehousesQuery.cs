using MediatR;

namespace WMS.Application.Features.Warehouses.GetAllWarehouses;

public class GetApprovedWarehousesQuery : IRequest<List<ApprovedWarehouseDto>>
{
    public int Limit { get; set; } = 6;
}

// Search with filters
public class SearchWarehousesQuery : IRequest<SearchWarehouseResult>
{
    public string? Province      { get; set; }
    public string? District      { get; set; }    // Quận/Huyện mới
    public string? WarehouseType { get; set; }
    public double? MinArea       { get; set; }
    public double? MaxArea       { get; set; }
    public decimal? MinPrice     { get; set; }    // Lọc theo giá mới
    public decimal? MaxPrice     { get; set; }    // Lọc theo giá mới
    public bool? Is24Hours       { get; set; }    // Lọc kho 24/7 mới
    public double? MinRating     { get; set; }    // Lọc theo đánh giá mới
    public bool FilterByAvailable { get; set; } = true; // Lọc theo AvailableArea (fix bug)
    public string? SortBy        { get; set; } = "newest";
    public int Page              { get; set; } = 1;
    public int PageSize          { get; set; } = 12;
}

public class SearchWarehouseResult
{
    public int Total    { get; set; }
    public int Page     { get; set; }
    public int PageSize { get; set; }
    public List<ApprovedWarehouseDto> Items { get; set; } = new();
}

public class ApprovedWarehouseDto
{
    public int       WarehouseId   { get; set; }
    public string    Name          { get; set; } = null!;
    public string    Address       { get; set; } = null!;
    public string?   Description   { get; set; }
    public double    TotalArea     { get; set; }
    public double    AvailableArea { get; set; }
    public string?   ImageUrl      { get; set; }
    public DateTime  CreatedAt     { get; set; }
    public decimal?  PricePerM2    { get; set; }
    public bool      Is24HoursAccess { get; set; }
    public string?   OperatingHours  { get; set; }
    public double?   AverageRating   { get; set; }  // Rating mới
    public int       RatingCount     { get; set; }  // Rating mới
}

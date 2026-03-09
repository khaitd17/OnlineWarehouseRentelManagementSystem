using MediatR;
using Microsoft.AspNetCore.Http;

public class AddWarehouseMediaCommand : IRequest
{
    public int WarehouseId { get; set; }

    public IFormFile File { get; set; } = null!;

    public string MediaType { get; set; } = "IMAGE";

    public bool IsPrimary { get; set; }
}
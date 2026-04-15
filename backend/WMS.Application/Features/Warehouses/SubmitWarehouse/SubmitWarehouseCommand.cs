using MediatR;

public class SubmitWarehouseCommand : IRequest
{
    public int WarehouseId { get; set; }
    public int RequestUserId { get; set; }
}
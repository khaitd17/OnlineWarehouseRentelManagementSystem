using MediatR;

namespace WMS.Application.Features.Returns.UpdateInspection
{
    public class UpdateInspectionCommand : IRequest<UpdateInspectionResponse>
    {
        public int ReturnId { get; set; }
        public int InspectorId { get; set; }
        public bool IsClean { get; set; }
        public bool IsEquipmentIntact { get; set; }
        public bool IsNoOutstandingDebt { get; set; }
        public string? Notes { get; set; }
        public decimal? DamageFee { get; set; }
        public decimal? PenaltyFee { get; set; }
    }
}
using MediatR;

namespace WMS.Application.Features.ContractExtensions.ReviewExtension
{
    public class ReviewExtensionCommand : IRequest<ReviewExtensionResponse>
    {
        public int ExtensionId { get; set; }
        public int ReviewerId { get; set; }
        public string Decision { get; set; } = string.Empty; // "APPROVE" or "REJECT"
        public string? RejectionReason { get; set; }
        public decimal? ApprovedMonthlyPayment { get; set; } // For approved extensions
    }
}
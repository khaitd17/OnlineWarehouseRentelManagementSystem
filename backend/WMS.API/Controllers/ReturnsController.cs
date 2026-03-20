using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.Features.Returns.SubmitWarehouseReturn;
using WMS.Application.Features.Returns.UpdateInspection;

namespace WMS.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class ReturnsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ReturnsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        public async Task<ActionResult<SubmitWarehouseReturnResponse>> SubmitWarehouseReturn([FromBody] SubmitWarehouseReturnRequest request)
        {
            var command = new SubmitWarehouseReturnCommand
            {
                ContractId = request.ContractId,
                RenterId = int.Parse(HttpContext.Items["UserId"]?.ToString() ?? "0"),
                IsClean = request.IsClean,
                IsEquipmentIntact = request.IsEquipmentIntact,
                IsNoOutstandingDebt = request.IsNoOutstandingDebt,
                Notes = request.Notes,
                Images = request.Images
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/inspection")]
        public async Task<ActionResult<UpdateInspectionResponse>> UpdateInspection(int id, [FromBody] UpdateInspectionRequest request)
        {
            var command = new UpdateInspectionCommand
            {
                ReturnId = id,
                InspectorId = int.Parse(HttpContext.Items["UserId"]?.ToString() ?? "0"),
                IsClean = request.IsClean,
                IsEquipmentIntact = request.IsEquipmentIntact,
                IsNoOutstandingDebt = request.IsNoOutstandingDebt,
                Notes = request.Notes,
                DamageFee = request.DamageFee,
                PenaltyFee = request.PenaltyFee
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }

    // Request models
    public class SubmitWarehouseReturnRequest
    {
        public int ContractId { get; set; }
        public bool IsClean { get; set; }
        public bool IsEquipmentIntact { get; set; }
        public bool IsNoOutstandingDebt { get; set; }
        public string? Notes { get; set; }
        public List<ReturnImageDto> Images { get; set; } = new();
    }

    public class UpdateInspectionRequest
    {
        public bool IsClean { get; set; }
        public bool IsEquipmentIntact { get; set; }
        public bool IsNoOutstandingDebt { get; set; }
        public string? Notes { get; set; }
        public decimal? DamageFee { get; set; }
        public decimal? PenaltyFee { get; set; }
    }
}
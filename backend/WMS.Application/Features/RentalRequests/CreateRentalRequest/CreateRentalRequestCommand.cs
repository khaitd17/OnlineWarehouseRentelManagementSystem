using MediatR;

namespace WMS.Application.Features.RentalRequests.CreateRentalRequest;

public class CreateRentalRequestCommand : IRequest<int>
{
    public int RenterId { get; set; }
    public int WarehouseId { get; set; }
    public int? RentalAreaId { get; set; }
    public double RequestedArea { get; set; }
    public DateTime StartDate { get; set; }
    public int DurationMonths { get; set; }
    public string? Notes { get; set; }

    // ── Custom Area: renter self-arranges zone ────────────────────────────
    /// <summary>Set to true when the renter draws/resizes their own zone on the map.</summary>
    public bool IsCustomArea { get; set; } = false;

    /// <summary>X offset (metres) from warehouse origin of the proposed zone.</summary>
    public double? ProposedPositionX { get; set; }

    /// <summary>Y offset (metres) from warehouse origin of the proposed zone.</summary>
    public double? ProposedPositionY { get; set; }

    /// <summary>Width (metres) of the proposed zone.</summary>
    public double? ProposedWidth { get; set; }

    /// <summary>Length/depth (metres) of the proposed zone.</summary>
    public double? ProposedLength { get; set; }

    /// <summary>
    /// ID of an existing RentalArea the renter carved a portion from.
    /// Used by the activation handler to shrink the source area.
    /// </summary>
    public int? BaseRentalAreaId { get; set; }

    // ── Extension Zone (L-shaped layout) ───────────────────────────────────
    /// <summary>True when a secondary extension rectangle supplements the primary custom zone.</summary>
    public bool HasExtensionZone { get; set; } = false;
    public double? ExtensionPositionX { get; set; }
    public double? ExtensionPositionY { get; set; }
    public double? ExtensionWidth { get; set; }
    public double? ExtensionLength { get; set; }
    // ──────────────────────────────────────────────────────────────────────

    // ── Multi-zone (additional non-adjacent rectangles as JSON array) ───
    /// <summary>
    /// JSON array of additional zone rectangles. Each element: { "x", "y", "w", "l", "areaId"? }
    /// </summary>
    public string? AdditionalZonesJson { get; set; }
    // ──────────────────────────────────────────────────────────────────────
}

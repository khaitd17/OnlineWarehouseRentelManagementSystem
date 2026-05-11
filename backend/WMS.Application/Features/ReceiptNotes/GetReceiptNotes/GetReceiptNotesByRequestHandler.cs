using MediatR;
using WMS.Application.Features.ReceiptNotes.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.ReceiptNotes.GetReceiptNotes;

public record GetReceiptNotesByRequestQuery : IRequest<List<ReceiptNoteDto>>
{
    public int InvReqId { get; init; }
}

public class GetReceiptNotesByRequestHandler
    : IRequestHandler<GetReceiptNotesByRequestQuery, List<ReceiptNoteDto>>
{
    private readonly IReceiptNoteRepository _repo;

    public GetReceiptNotesByRequestHandler(IReceiptNoteRepository repo)
        => _repo = repo;

    public async Task<List<ReceiptNoteDto>> Handle(
        GetReceiptNotesByRequestQuery query, CancellationToken ct)
    {
        var notes = await _repo.GetByRequestIdAsync(query.InvReqId, ct);
        return notes.Select(ReceiptNoteMapper.ToDto).ToList();
    }
}

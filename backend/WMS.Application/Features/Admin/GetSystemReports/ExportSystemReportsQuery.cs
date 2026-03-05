using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.GetSystemReports;

public class ExportSystemReportsQuery : IRequest<ApiResponse<byte[]>>
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

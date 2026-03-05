using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Audit.ExportAuditReport;

public record ExportAuditReportQuery(int AuditId) : IRequest<ApiResponse<ExportAuditReportResult>>;

public record ExportAuditReportResult(
    byte[] FileContent,
    string FileName
);

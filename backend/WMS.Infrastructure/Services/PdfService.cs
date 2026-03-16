using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using iText.Kernel.Font;
using iText.IO.Font;
using iText.IO.Image;
using iText.Kernel.Colors;
using Microsoft.AspNetCore.Hosting;
using WMS.Application.Interfaces;

namespace WMS.Infrastructure.Services;

public class PdfService : IPdfService
{
    private readonly IWebHostEnvironment _env;

    public PdfService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> GenerateContractPdfAsync(ContractPdfData data)
    {
        var contractsDir = Path.Combine(_env.ContentRootPath, "uploads", "contracts");
        if (!Directory.Exists(contractsDir))
            Directory.CreateDirectory(contractsDir);

        var fileName = $"contract_{data.ContractId}_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
        var filePath = Path.Combine(contractsDir, fileName);

        await Task.Run(() =>
        {
            using var writer = new PdfWriter(filePath);
            using var pdf = new PdfDocument(writer);
            using var document = new Document(pdf);

            var font = PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA);
            var fontBold = PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA_BOLD);

            // Title
            document.Add(new Paragraph("HOP DONG THUE KHO HANG")
                .SetFont(fontBold)
                .SetFontSize(18)
                .SetTextAlignment(TextAlignment.CENTER)
                .SetMarginBottom(5));

            document.Add(new Paragraph($"So: {data.ContractNumber}")
                .SetFont(font)
                .SetFontSize(11)
                .SetTextAlignment(TextAlignment.CENTER)
                .SetMarginBottom(20));

            // Separator
            document.Add(new LineSeparator(new iText.Kernel.Pdf.Canvas.Draw.SolidLine())
                .SetMarginBottom(15));

            // Section: Parties
            document.Add(new Paragraph("BEN CHO THUE (Ben A)")
                .SetFont(fontBold).SetFontSize(12).SetMarginBottom(5));
            document.Add(new Paragraph($"Ho va ten: {data.OwnerName}")
                .SetFont(font).SetFontSize(10));
            document.Add(new Paragraph($"Kho hang: {data.WarehouseName}")
                .SetFont(font).SetFontSize(10));
            document.Add(new Paragraph($"Dia chi: {data.WarehouseAddress}")
                .SetFont(font).SetFontSize(10).SetMarginBottom(15));

            document.Add(new Paragraph("BEN THUE (Ben B)")
                .SetFont(fontBold).SetFontSize(12).SetMarginBottom(5));
            document.Add(new Paragraph($"Ho va ten: {data.RenterName}")
                .SetFont(font).SetFontSize(10));
            document.Add(new Paragraph($"Email: {data.RenterEmail}")
                .SetFont(font).SetFontSize(10).SetMarginBottom(15));

            // Section: Contract details
            document.Add(new Paragraph("DIEU KHOAN HOP DONG")
                .SetFont(fontBold).SetFontSize(12).SetMarginBottom(10));

            var table = new Table(2).UseAllAvailableWidth();
            table.SetMarginBottom(15);

            AddTableRow(table, font, fontBold, "Ngay bat dau", data.StartDate.ToString("dd/MM/yyyy"));
            AddTableRow(table, font, fontBold, "Ngay ket thuc", data.EndDate.ToString("dd/MM/yyyy"));
            AddTableRow(table, font, fontBold, "Gia thue/thang", FormatCurrency(data.MonthlyPayment));
            AddTableRow(table, font, fontBold, "Tong gia tri hop dong", FormatCurrency(data.TotalValue));
            if (data.DepositAmount.HasValue)
                AddTableRow(table, font, fontBold, "Tien dat coc", FormatCurrency(data.DepositAmount.Value));

            document.Add(table);

            // Terms
            if (!string.IsNullOrWhiteSpace(data.Terms))
            {
                document.Add(new Paragraph("DIEU KHOAN BO SUNG")
                    .SetFont(fontBold).SetFontSize(12).SetMarginBottom(5));
                document.Add(new Paragraph(data.Terms)
                    .SetFont(font).SetFontSize(10).SetMarginBottom(15));
            }

            // Signature area
            document.Add(new LineSeparator(new iText.Kernel.Pdf.Canvas.Draw.SolidLine())
                .SetMarginTop(30).SetMarginBottom(15));

            var signTable = new Table(2).UseAllAvailableWidth();
            signTable.AddCell(new Cell().SetBorder(iText.Layout.Borders.Border.NO_BORDER)
                .Add(new Paragraph("BEN CHO THUE (Ben A)").SetFont(fontBold).SetFontSize(11).SetTextAlignment(TextAlignment.CENTER))
                .Add(new Paragraph("(Ky va ghi ro ho ten)").SetFont(font).SetFontSize(9).SetTextAlignment(TextAlignment.CENTER))
                .Add(new Paragraph("\n\n\n").SetFont(font)));

            signTable.AddCell(new Cell().SetBorder(iText.Layout.Borders.Border.NO_BORDER)
                .Add(new Paragraph("BEN THUE (Ben B)").SetFont(fontBold).SetFontSize(11).SetTextAlignment(TextAlignment.CENTER))
                .Add(new Paragraph("(Ky va ghi ro ho ten)").SetFont(font).SetFontSize(9).SetTextAlignment(TextAlignment.CENTER))
                .Add(new Paragraph("\n\n\n").SetFont(font)));

            document.Add(signTable);
        });

        return $"/uploads/contracts/{fileName}";
    }

    public async Task<string> EmbedSignatureInPdfAsync(string pdfRelativeUrl, string signatureBase64)
    {
        var contractsDir = Path.Combine(_env.ContentRootPath, "uploads", "contracts");
        // pdfRelativeUrl is like /uploads/contracts/contract_1_xxx.pdf
        var originalFileName = Path.GetFileName(pdfRelativeUrl);
        var originalPath = Path.Combine(contractsDir, originalFileName);

        if (!File.Exists(originalPath))
            throw new InvalidOperationException("Contract PDF file not found");

        var signedFileName = $"signed_{originalFileName}";
        var signedPath = Path.Combine(contractsDir, signedFileName);

        await Task.Run(() =>
        {
            using var reader = new PdfReader(originalPath);
            using var writer = new PdfWriter(signedPath);
            using var pdf = new PdfDocument(reader, writer);
            using var document = new Document(pdf);

            // Decode base64 signature image
            var signatureBytes = Convert.FromBase64String(signatureBase64);
            var imageData = ImageDataFactory.Create(signatureBytes);
            var signatureImage = new Image(imageData);

            // Place signature in the bottom-right area of the last page
            var lastPage = pdf.GetLastPage();
            var pageSize = lastPage.GetPageSize();

            signatureImage
                .SetWidth(150)
                .SetHeight(60)
                .SetFixedPosition(
                    pdf.GetNumberOfPages(),
                    pageSize.GetWidth() / 2 + 50,  // Right side
                    80                              // Bottom area
                );

            document.Add(signatureImage);
        });

        return $"/uploads/contracts/{signedFileName}";
    }

    private static void AddTableRow(Table table, PdfFont font, PdfFont fontBold, string label, string value)
    {
        table.AddCell(new Cell()
            .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
            .SetPadding(5)
            .Add(new Paragraph(label).SetFont(fontBold).SetFontSize(10)));
        table.AddCell(new Cell()
            .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
            .SetPadding(5)
            .Add(new Paragraph(value).SetFont(font).SetFontSize(10)));
    }

    private static string FormatCurrency(decimal amount)
    {
        return amount.ToString("N0") + " VND";
    }
}

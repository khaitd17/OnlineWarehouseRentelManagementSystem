using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using iText.Kernel.Font;
using iText.IO.Font;
using iText.IO.Image;
using Microsoft.AspNetCore.Hosting;
using WMS.Application.Interfaces;

namespace WMS.Infrastructure.Services;

public class PdfService : IPdfService
{
    private readonly IWebHostEnvironment _env;

    // Vị trí ô ký Bên B (người thuê) - dùng chung cho cả GenerateContract và EmbedSignature
    private const float BenBSignatureX = 366f;    // pageWidth * 0.75 - 80
    private const float BenASignatureX = 69f;     // pageWidth * 0.25 - 80
    private const float BenBSignatureY = 75f;
    private const float SignatureImageWidth = 160f;
    private const float SignatureImageHeight = 55f;

    public PdfService(IWebHostEnvironment env)
    {
        _env = env;
    }

    private static PdfFont CreateVietnameseFont(bool bold = false, bool italic = false)
    {
        string fontPath = (bold, italic) switch
        {
            (true, true) => @"C:\Windows\Fonts\timesbi.ttf",
            (true, false) => @"C:\Windows\Fonts\timesbd.ttf",
            (false, true) => @"C:\Windows\Fonts\timesi.ttf",
            (false, false) => @"C:\Windows\Fonts\times.ttf",
        };

        return PdfFontFactory.CreateFont(fontPath, PdfEncodings.IDENTITY_H,
            PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
    }

    public async Task<string> GenerateContractPdfAsync(ContractPdfData data, string? signatureBase64 = null)
    {
        var contractsDir = Path.Combine(_env.ContentRootPath, "uploads", "contracts");
        if (!Directory.Exists(contractsDir))
            Directory.CreateDirectory(contractsDir);

        var prefix = (signatureBase64 != null) ? "signed_contract" : "contract";
        var fileName = $"{prefix}_{data.ContractId}_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
        var filePath = Path.Combine(contractsDir, fileName);

        await Task.Run(() =>
        {
            string? tempRenterImgPath = null;
            try
            {
            using var writer = new PdfWriter(filePath);
            using var pdf = new PdfDocument(writer);
            using var document = new Document(pdf, iText.Kernel.Geom.PageSize.A4);
            document.SetMargins(40, 50, 180, 50); // bottom 180pt dành cho ô ký

            var font = CreateVietnameseFont();
            var fontBold = CreateVietnameseFont(bold: true);
            var fontItalic = CreateVietnameseFont(italic: true);
            var fontBoldItalic = CreateVietnameseFont(bold: true, italic: true);

            var pageWidth = iText.Kernel.Geom.PageSize.A4.GetWidth(); // 595

            // ===== HEADER QUỐC GIA =====
            document.Add(new Paragraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM")
                .SetFont(fontBold).SetFontSize(13)
                .SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(0));
            document.Add(new Paragraph("Độc lập - Tự do - Hạnh phúc")
                .SetFont(fontBoldItalic).SetFontSize(12)
                .SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(2));
            document.Add(new Paragraph("──────────────────")
                .SetFont(font).SetFontSize(12)
                .SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(15));

            // ===== TIÊU ĐỀ HỢP ĐỒNG =====
            document.Add(new Paragraph("HỢP ĐỒNG THUÊ KHO HÀNG")
                .SetFont(fontBold).SetFontSize(16)
                .SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(3));
            document.Add(new Paragraph($"Số: {data.ContractNumber}")
                .SetFont(fontItalic).SetFontSize(11)
                .SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(3));
            document.Add(new Paragraph($"Ngày {data.StartDate:dd} tháng {data.StartDate:MM} năm {data.StartDate:yyyy}")
                .SetFont(fontItalic).SetFontSize(11)
                .SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(10));

            // Separator
            document.Add(new LineSeparator(new iText.Kernel.Pdf.Canvas.Draw.SolidLine())
                .SetMarginBottom(10));

            // ===== ĐIỀU 1: CÁC BÊN THAM GIA =====
            document.Add(new Paragraph("Điều 1. CÁC BÊN THAM GIA HỢP ĐỒNG")
                .SetFont(fontBold).SetFontSize(12).SetMarginBottom(5));

            document.Add(new Paragraph("1. BÊN CHO THUÊ (Bên A):")
                .SetFont(fontBold).SetFontSize(11).SetMarginBottom(2));
            document.Add(new Paragraph($"    - Họ và tên: {data.OwnerName}")
                .SetFont(font).SetFontSize(10));
            document.Add(new Paragraph($"    - Kho hàng: {data.WarehouseName}")
                .SetFont(font).SetFontSize(10));
            document.Add(new Paragraph($"    - Địa chỉ: {data.WarehouseAddress}")
                .SetFont(font).SetFontSize(10).SetMarginBottom(8));

            document.Add(new Paragraph("2. BÊN THUÊ (Bên B):")
                .SetFont(fontBold).SetFontSize(11).SetMarginBottom(2));
            document.Add(new Paragraph($"    - Họ và tên: {data.RenterName}")
                .SetFont(font).SetFontSize(10));
            document.Add(new Paragraph($"    - Email: {data.RenterEmail}")
                .SetFont(font).SetFontSize(10).SetMarginBottom(10));

            // ===== ĐIỀU 2: NỘI DUNG HỢP ĐỒNG =====
            document.Add(new Paragraph("Điều 2. NỘI DUNG HỢP ĐỒNG")
                .SetFont(fontBold).SetFontSize(12).SetMarginBottom(5));

            var table = new Table(new float[] { 1, 1 }).UseAllAvailableWidth();
            table.SetMarginBottom(10);

            // Header row
            table.AddHeaderCell(new Cell().SetBackgroundColor(iText.Kernel.Colors.ColorConstants.LIGHT_GRAY)
                .SetPadding(5).Add(new Paragraph("Nội dung").SetFont(fontBold).SetFontSize(10)));
            table.AddHeaderCell(new Cell().SetBackgroundColor(iText.Kernel.Colors.ColorConstants.LIGHT_GRAY)
                .SetPadding(5).Add(new Paragraph("Chi tiết").SetFont(fontBold).SetFontSize(10)));

            AddTableRow(table, font, fontBold, "Ngày bắt đầu", data.StartDate.ToString("dd/MM/yyyy"));
            AddTableRow(table, font, fontBold, "Ngày kết thúc", data.EndDate.ToString("dd/MM/yyyy"));
            AddTableRow(table, font, fontBold, "Giá thuê hàng tháng", FormatCurrency(data.MonthlyPayment));
            AddTableRow(table, font, fontBold, "Tổng giá trị hợp đồng", FormatCurrency(data.TotalValue));
            if (data.DepositAmount.HasValue)
                AddTableRow(table, font, fontBold, "Tiền đặt cọc", FormatCurrency(data.DepositAmount.Value));

            document.Add(table);

            // ===== ĐIỀU 3: ĐIỀU KHOẢN BỔ SUNG (nếu có) =====
            if (!string.IsNullOrWhiteSpace(data.Terms))
            {
                document.Add(new Paragraph("Điều 3. ĐIỀU KHOẢN BỔ SUNG")
                    .SetFont(fontBold).SetFontSize(12).SetMarginBottom(5));
                document.Add(new Paragraph(data.Terms)
                    .SetFont(font).SetFontSize(10).SetMarginBottom(10));
            }

            // ===== ĐIỀU 4: ĐIỀU KHOẢN CHUNG =====
            var dieuSo = string.IsNullOrWhiteSpace(data.Terms) ? 3 : 4;
            document.Add(new Paragraph($"Điều {dieuSo}. ĐIỀU KHOẢN CHUNG")
                .SetFont(fontBold).SetFontSize(12).SetMarginBottom(5));
            document.Add(new Paragraph(
                "- Hợp đồng có hiệu lực kể từ ngày ký.\n" +
                "- Hợp đồng được lập thành 02 bản, mỗi bên giữ 01 bản có giá trị pháp lý như nhau.\n" +
                "- Hai bên đã đọc, hiểu rõ và đồng ý với toàn bộ các điều khoản trên.")
                .SetFont(font).SetFontSize(10).SetMarginBottom(10));

            // ===== Ô KÝ TÊN - Cố định ở bottom page =====
            var pageNum = pdf.GetNumberOfPages();

            // ===== Chữ ký Bên B (Người thuê - Renter) hoặc Owner =====
            if (signatureBase64 != null)
            {
                if (signatureBase64.Contains(','))
                    signatureBase64 = signatureBase64[(signatureBase64.IndexOf(',') + 1)..];

                var sigBytes = Convert.FromBase64String(signatureBase64);
                tempRenterImgPath = Path.Combine(contractsDir, $"tmp_sig_{Guid.NewGuid():N}.png");
                File.WriteAllBytes(tempRenterImgPath, sigBytes);

                var sigImg = new Image(ImageDataFactory.Create(tempRenterImgPath));
                sigImg.SetFixedPosition(pageNum, BenBSignatureX, BenBSignatureY);
                sigImg.SetWidth(SignatureImageWidth);
                sigImg.SetHeight(SignatureImageHeight);
                document.Add(sigImg);
            }

            // Separator line
            document.ShowTextAligned(
                new Paragraph("─────────────────────────────────────────────────────────────────────")
                    .SetFont(font).SetFontSize(8),
                pageWidth / 2, 170, pageNum, TextAlignment.CENTER, VerticalAlignment.BOTTOM, 0);

            // Bên A (25% page width)
            float benACenterX = pageWidth * 0.25f;
            document.ShowTextAligned(
                new Paragraph("BÊN CHO THUÊ (Bên A)").SetFont(fontBold).SetFontSize(11),
                benACenterX, 155, pageNum, TextAlignment.CENTER, VerticalAlignment.BOTTOM, 0);
            document.ShowTextAligned(
                new Paragraph("(Ký và ghi rõ họ tên)").SetFont(fontItalic).SetFontSize(9),
                benACenterX, 140, pageNum, TextAlignment.CENTER, VerticalAlignment.BOTTOM, 0);
            document.ShowTextAligned(
                new Paragraph(data.OwnerName).SetFont(fontBold).SetFontSize(10),
                benACenterX, 50, pageNum, TextAlignment.CENTER, VerticalAlignment.BOTTOM, 0);

            // Bên B (75% page width)
            float benBCenterX = pageWidth * 0.75f;
            document.ShowTextAligned(
                new Paragraph("BÊN THUÊ (Bên B)").SetFont(fontBold).SetFontSize(11),
                benBCenterX, 155, pageNum, TextAlignment.CENTER, VerticalAlignment.BOTTOM, 0);
            document.ShowTextAligned(
                new Paragraph("(Ký và ghi rõ họ tên)").SetFont(fontItalic).SetFontSize(9),
                benBCenterX, 140, pageNum, TextAlignment.CENTER, VerticalAlignment.BOTTOM, 0);
            document.ShowTextAligned(
                new Paragraph(data.RenterName).SetFont(font).SetFontSize(10),
                benBCenterX, 50, pageNum, TextAlignment.CENTER, VerticalAlignment.BOTTOM, 0);

            } // close try
            catch (Exception ex)
            {
                Console.Error.WriteLine("=== PDF GENERATION INNER ERROR ===");
                Console.Error.WriteLine(ex.ToString());
                throw;
            }
            finally
            {
                // Xóa file ảnh tạm dù thành công hay thất bại
                if (tempRenterImgPath != null && File.Exists(tempRenterImgPath))
                    File.Delete(tempRenterImgPath);
            }
        });

        return $"/uploads/contracts/{fileName}";
    }

    public bool PdfFileExists(string pdfRelativeUrl)
    {
        if (string.IsNullOrWhiteSpace(pdfRelativeUrl)) return false;
        var fileName = Path.GetFileName(pdfRelativeUrl);
        var filePath = Path.Combine(_env.ContentRootPath, "uploads", "contracts", fileName);
        return File.Exists(filePath);
    }

    public async Task<string> CreateSignedDocumentFromImageAsync(string imageRelativeUrl, string signatureBase64)
    {
        var fileName = Path.GetFileName(imageRelativeUrl);

        var wwwrootPath = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, "uploads", "contracts", fileName);
        var contentRootPath = Path.Combine(_env.ContentRootPath, "uploads", "contracts", fileName);

        var imagePath = File.Exists(wwwrootPath) ? wwwrootPath
                      : File.Exists(contentRootPath) ? contentRootPath
                      : throw new InvalidOperationException($"Contract image file not found at {wwwrootPath} or {contentRootPath}");

        var outputDir = Path.Combine(_env.ContentRootPath, "uploads", "contracts");
        if (!Directory.Exists(outputDir)) Directory.CreateDirectory(outputDir);

        var outputFileName = $"signed_{Path.GetFileNameWithoutExtension(fileName)}_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
        var outputPath = Path.Combine(outputDir, outputFileName);

        await Task.Run(() =>
        {
            var imageBytes = File.ReadAllBytes(imagePath);
            var signatureBytes = Convert.FromBase64String(signatureBase64);

            using var writer = new PdfWriter(outputPath);
            using var pdf = new PdfDocument(writer);
            using var document = new Document(pdf, iText.Kernel.Geom.PageSize.A4);
            document.SetMargins(10, 10, 80, 10);

            // Ảnh hợp đồng
            var contractImage = new Image(ImageDataFactory.Create(imageBytes));
            contractImage.SetAutoScale(true);
            contractImage.SetMaxWidth(575f);
            document.Add(contractImage);

            // Chữ ký đặt đúng vị trí Bên B (góc dưới phải)
            var signatureImage = new Image(ImageDataFactory.Create(signatureBytes));
            signatureImage.SetFixedPosition(BenBSignatureX, BenBSignatureY);
            signatureImage.SetWidth(SignatureImageWidth);
            signatureImage.SetHeight(SignatureImageHeight);
            document.Add(signatureImage);
        });

        return $"/uploads/contracts/{outputFileName}";
    }

    public async Task<string> EmbedSignatureInPdfAsync(string pdfRelativeUrl, string signatureBase64)
    {
        var contractsDir = Path.Combine(_env.ContentRootPath, "uploads", "contracts");
        var originalFileName = Path.GetFileName(pdfRelativeUrl);
        var originalPath = Path.Combine(contractsDir, originalFileName);

        if (!File.Exists(originalPath))
            throw new InvalidOperationException($"Contract PDF file not found at {originalPath}");

        var signedFileName = $"signed_{originalFileName}";
        var signedPath = Path.Combine(contractsDir, signedFileName);

        await Task.Run(() =>
        {
            var signatureBytes = Convert.FromBase64String(signatureBase64);

            // Read the original PDF into memory to avoid file lock issues
            var pdfBytes = File.ReadAllBytes(originalPath);
            using var memStream = new MemoryStream(pdfBytes);
            using var reader = new PdfReader(memStream);
            using var writer = new PdfWriter(signedPath);
            using var pdf = new PdfDocument(reader, writer);
            using var document = new Document(pdf);

            var lastPageNum = pdf.GetNumberOfPages();

            // Đặt chữ ký vào đúng ô Bên B dùng Document/Image approach
            var signatureImage = new Image(ImageDataFactory.Create(signatureBytes));
            signatureImage.SetFixedPosition(lastPageNum, BenBSignatureX, BenBSignatureY);
            signatureImage.SetWidth(SignatureImageWidth);
            signatureImage.SetHeight(SignatureImageHeight);
            document.Add(signatureImage);
        });

        return $"/uploads/contracts/{signedFileName}";
    }

    private static void AddTableRow(Table table, PdfFont font, PdfFont fontBold, string label, string value)
    {
        table.AddCell(new Cell().SetPadding(5)
            .Add(new Paragraph(label).SetFont(fontBold).SetFontSize(10)));
        table.AddCell(new Cell().SetPadding(5)
            .Add(new Paragraph(value).SetFont(font).SetFontSize(10)));
    }

    private static string FormatCurrency(decimal amount)
    {
        return amount.ToString("N0") + " VNĐ";
    }
}

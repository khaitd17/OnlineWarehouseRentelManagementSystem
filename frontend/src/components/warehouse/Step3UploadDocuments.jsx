import React, { useState, useRef } from "react";
import {
  uploadWarehouseDocument,
  submitWarehouse
} from "../../services/warehouseService";

const Step3UploadDocuments = ({ warehouseId, finish }) => {
  const [hasDocument, setHasDocument] = useState(true);
  const [documentType, setDocumentType] = useState("BUSINESS_LICENSE");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (hasDocument && file) {
        await uploadWarehouseDocument(
          warehouseId,
          file,
          documentType
        );
      }

      await submitWarehouse(warehouseId);
      finish();
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Xử lý hồ sơ không thành công. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: "40px",
        borderRadius: "24px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "'Inter', sans-serif",
        border: "1px solid #f1f5f9"
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>
          Hồ sơ pháp lý
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Bạn có thể bổ sung tài liệu ngay bây giờ hoặc cập nhật sau khi kho đã được tạo.
        </p>
      </div>

      <div style={{ 
        display: "flex", 
        gap: "10px", 
        marginBottom: "30px", 
        padding: "8px", 
        backgroundColor: "#f1f5f9", 
        borderRadius: "16px" 
      }}>
        <button
          onClick={() => setHasDocument(true)}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: hasDocument ? "#fff" : "transparent",
            color: hasDocument ? "#00b2d6" : "#64748b",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: hasDocument ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.2s"
          }}
        >
          Đã có tài liệu
        </button>
        <button
          onClick={() => { setHasDocument(false); setFile(null); }}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: !hasDocument ? "#fff" : "transparent",
            color: !hasDocument ? "#f59e0b" : "#64748b",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: !hasDocument ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.2s"
          }}
        >
          Đang chờ cấp / Bổ sung sau
        </button>
      </div>

      {hasDocument ? (
        <>
          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "0.95rem", fontWeight: 700, color: "#334155", marginBottom: "10px" }}>
              Loại giấy tờ pháp lý
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#fff",
                  fontSize: "1rem",
                  color: "#1e293b",
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  transition: "all 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#00b2d6"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              >
                <option value="BUSINESS_LICENSE">Giấy phép kinh doanh</option>
                <option value="WAREHOUSE_CERT">Giấy chứng nhận quyền sử dụng kho</option>
                <option value="FIRE_SAFETY">Chứng nhận phòng cháy chữa cháy</option>
                <option value="OTHER">Tài liệu bổ sung khác</option>
              </select>
              <span className="material-symbols-outlined" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8" }}>
                expand_more
              </span>
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#00b2d6"; e.currentTarget.style.backgroundColor = "#f0f9ff"; }}
            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.backgroundColor = "#f8fafc"; }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.backgroundColor = "#f8fafc";
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                setFile(e.dataTransfer.files[0]);
              }
            }}
            style={{
              border: "2px dashed",
              borderColor: file ? "#22c55e" : "#e2e8f0",
              borderRadius: "20px",
              padding: "50px 20px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: file ? "#f0fdf4" : "#f8fafc",
              position: "relative"
            }}
          >
            <div style={{ color: file ? "#22c55e" : "#00b2d6", marginBottom: "16px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "56px", opacity: 0.8 }}>
                {file ? "verified" : "upload_file"}
              </span>
            </div>
            
            {file ? (
              <div>
                <div style={{ fontWeight: 700, color: "#166534", fontSize: "1.1rem", marginBottom: "6px" }}>
                  {file.name}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#22c55e", fontWeight: 500 }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 700, color: "#334155", fontSize: "1.1rem", marginBottom: "6px" }}>
                  Tải hồ sơ lên hệ thống (Tùy chọn)
                </div>
                <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  Nhấn để chọn hoặc kéo thả tệp vào đây
                </div>
              </div>
            )}
            <input type="file" ref={fileInputRef} accept=".pdf,image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </div>
        </>
      ) : (
        <div style={{ 
          padding: "40px", 
          backgroundColor: "#fff9f2", 
          borderRadius: "20px", 
          border: "1px solid #ffedd5",
          textAlign: "center" 
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#f59e0b", marginBottom: "16px" }}>
            hourglass_empty
          </span>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#92400e", marginBottom: "8px" }}>
            Trạng thái: Đang chờ cấp hồ sơ
          </h3>
          <p style={{ color: "#b45309", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Bạn vẫn có thể tạo kho ngay bây giờ. Tuy nhiên, kho của bạn sẽ cần bổ sung hồ sơ pháp lý trước khi được phê duyệt để cho thuê chính thức.
          </p>
        </div>
      )}

      <div style={{ marginTop: "50px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "30px" }}>
        <button
          style={{ background: "none", border: "none", color: "#64748b", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" }}
          onClick={() => window.history.back()}
        >
          Quay lại
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: "14px 40px",
            background: hasDocument ? "#00b2d6" : "#f59e0b",
            color: "#fff",
            border: "none",
            borderRadius: "14px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.3s ease",
            boxShadow: hasDocument ? "0 8px 25px rgba(0, 178, 214, 0.25)" : "0 8px 25px rgba(245, 158, 11, 0.25)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: "22px" }}>sync</span>
              Đang hoàn tất...
            </>
          ) : (
            <>
              <span>{hasDocument ? (file ? "Tải lên & Hoàn tất" : "Hoàn tất hồ sơ") : "Tiếp tục & Hoàn tất sau"}</span>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                {hasDocument ? (file ? "cloud_upload" : "check_circle") : "forward"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step3UploadDocuments;
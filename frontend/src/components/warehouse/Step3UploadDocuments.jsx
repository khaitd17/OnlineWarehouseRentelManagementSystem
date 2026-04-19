import React, { useState, useRef } from "react";
import { uploadWarehouseDocument, submitWarehouse } from "../../services/warehouseService";

/* ── styles ── */
const card = {
  background: "#fff", borderRadius: "20px",
  boxShadow: "0 4px 32px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9",
  padding: "40px", maxWidth: "780px", margin: "0 auto", fontFamily: "'Inter', sans-serif"
};
const footerBar = {
  marginTop: "40px", display: "flex", justifyContent: "space-between",
  alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "24px"
};
const btnBack = {
  background: "none", border: "1.5px solid #e2e8f0", color: "#475569",
  fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
  padding: "10px 22px", borderRadius: "10px", transition: "all 0.2s"
};

/* Required documents config */
const REQUIRED_DOCS = [
  {
    key: "BUSINESS_LICENSE",
    label: "Giấy phép kinh doanh",
    hint: "Giấy phép kinh doanh hoặc đăng ký doanh nghiệp"
  },
  {
    key: "WAREHOUSE_CERT",
    label: "Giấy chứng nhận quyền sử dụng kho",
    hint: "Quyền sở hữu / sử dụng mặt bằng kho"
  },
  {
    key: "FIRE_SAFETY",
    label: "Chứng nhận phòng cháy chữa cháy",
    hint: "Chứng nhận PCCC còn hiệu lực"
  }
];

/* Single document upload zone */
const DocUploadZone = ({ docKey, label, hint, file, pending, onFile, onPendingChange }) => {
  const fileInputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  return (
    <div style={{
      border: `1.5px solid ${file ? "#22c55e" : pending ? "#f59e0b" : "#e2e8f0"}`,
      borderRadius: "14px", overflow: "hidden",
      background: file ? "#f0fdf4" : pending ? "#fffbeb" : "#fafafa",
      transition: "all 0.2s"
    }}>
      {/* Header row */}
      <div style={{
        padding: "14px 18px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        borderBottom: `1px solid ${file ? "#bbf7d0" : pending ? "#fde68a" : "#f1f5f9"}`
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#1e293b" }}>{label}</div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 2 }}>{hint}</div>
        </div>
        {/* Status badge */}
        {file && (
          <span style={{ background: "#dcfce7", color: "#16a34a", fontWeight: 700, fontSize: "0.72rem", padding: "3px 10px", borderRadius: "20px" }}>
            ĐÃ TẢI LÊN
          </span>
        )}
        {!file && pending && (
          <span style={{ background: "#fef9c3", color: "#ca8a04", fontWeight: 700, fontSize: "0.72rem", padding: "3px 10px", borderRadius: "20px" }}>
            CHỜ CẤP
          </span>
        )}
        {!file && !pending && (
          <span style={{ background: "#fee2e2", color: "#dc2626", fontWeight: 700, fontSize: "0.72rem", padding: "3px 10px", borderRadius: "20px" }}>
            CHƯA CÓ
          </span>
        )}
      </div>

      {/* Body: either drop-zone OR pending checkbox only */}
      {!pending ? (
        <>
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => {
              e.preventDefault(); setDrag(false);
              if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
            }}
            style={{
              padding: "20px 18px", cursor: "pointer", textAlign: "center",
              background: drag ? "#f0f9ff" : "transparent",
              borderTop: drag ? "1px dashed #00b2d6" : "none"
            }}
          >
            {file ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "8px",
                  background: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", fontWeight: 900, color: "#16a34a", flexShrink: 0
                }}>✓</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 700, color: "#166534", fontSize: "0.88rem" }}>{file.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "#22c55e" }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB · Nhấn để thay đổi
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  width: 40, height: 40, borderRadius: "10px",
                  background: "linear-gradient(135deg,#e0f2fe,#bae6fd)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 10px", fontSize: "1.2rem", fontWeight: 900, color: "#0284c7"
                }}>↑</div>
                <div style={{ fontWeight: 600, color: "#334155", fontSize: "0.88rem", marginBottom: 4 }}>
                  Kéo thả hoặc nhấn để tải lên
                </div>
                <div style={{ fontSize: "0.76rem", color: "#94a3b8" }}>PDF, JPG, PNG</div>
              </div>
            )}
            <input type="file" ref={fileInputRef} accept=".pdf,image/*"
              onChange={e => e.target.files[0] && onFile(e.target.files[0])}
              style={{ display: "none" }} />
          </div>

          {/* "Đang chờ cấp" option at bottom */}
          <div
            onClick={() => onPendingChange(true)}
            style={{
              padding: "10px 18px", display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer", borderTop: "1px solid #f1f5f9",
              color: "#94a3b8", fontSize: "0.8rem"
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: "3px",
              border: "1.5px solid #cbd5e1", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center"
            }} />
            <span>Đang chờ cấp giấy phép / Bổ sung sau</span>
          </div>
        </>
      ) : (
        /* Pending mode: just a checkbox to undo */
        <div
          onClick={() => onPendingChange(false)}
          style={{
            padding: "16px 18px", display: "flex", alignItems: "center", gap: 12,
            cursor: "pointer"
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: "4px",
            background: "#f59e0b", border: "1.5px solid #f59e0b",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 900, fontSize: "0.75rem", flexShrink: 0
          }}>✓</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#92400e" }}>Đang chờ cấp giấy phép</div>
            <div style={{ fontSize: "0.75rem", color: "#b45309", marginTop: 2 }}>
              Nhấn để huỷ và tải file lên thay thế
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────── */
const Step3UploadDocuments = ({ warehouseId, onComplete, onBack }) => {
  // files: { BUSINESS_LICENSE: File|null, WAREHOUSE_CERT: File|null, FIRE_SAFETY: File|null }
  const [files,    setFiles]    = useState({ BUSINESS_LICENSE: null, WAREHOUSE_CERT: null, FIRE_SAFETY: null });
  // pendingKeys: set of keys that are "waiting for license"
  const [pending,  setPending]  = useState({});
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const setFile    = (key, file) => setFiles(prev => ({ ...prev, [key]: file }));
  const setPend    = (key, val)  => {
    setPending(prev => ({ ...prev, [key]: val }));
    if (val) setFiles(prev => ({ ...prev, [key]: null })); // clear file if marking pending
  };

  const handleSubmit = async () => {
    setError("");
    // Validate: each doc must either have a file OR be marked pending
    const missing = REQUIRED_DOCS.filter(d => !files[d.key] && !pending[d.key]);
    if (missing.length > 0) {
      setError(`Vui lòng tải lên hoặc đánh dấu "Đang chờ cấp" cho: ${missing.map(d => d.label).join(", ")}`);
      return;
    }

    try {
      setLoading(true);
      // Upload each file that has been selected
      for (const doc of REQUIRED_DOCS) {
        if (files[doc.key]) {
          await uploadWarehouseDocument(warehouseId, files[doc.key], doc.key);
        }
      }
      await submitWarehouse(warehouseId);
      onComplete({ files, pending });
    } catch (err) {
      console.error(err);
      setError("Có lỗi khi tải tài liệu lên. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const hasAll    = REQUIRED_DOCS.every(d => files[d.key] || pending[d.key]);
  const uploadedN = REQUIRED_DOCS.filter(d => files[d.key]).length;
  const pendingN  = REQUIRED_DOCS.filter(d => pending[d.key]).length;

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid #f1f5f9" }}>
        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#00b2d6", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" }}>
          Bước 3 / 3
        </p>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Hồ sơ pháp lý</h2>
        <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "6px 0 0" }}>
          Cần tải lên <strong>3 loại giấy tờ</strong> bắt buộc. Nếu chưa có, tích vào "Đang chờ cấp".
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.8rem", fontWeight: 600 }}>
          <span style={{ color: "#1e293b" }}>Tiến độ hồ sơ</span>
          <span style={{ color: uploadedN === 3 ? "#16a34a" : "#64748b" }}>
            {uploadedN} tải lên · {pendingN} chờ cấp · {3 - uploadedN - pendingN} còn thiếu
          </span>
        </div>
        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4, transition: "width 0.4s ease",
            width: `${((uploadedN + pendingN) / 3) * 100}%`,
            background: hasAll ? "#22c55e" : "linear-gradient(90deg,#00b2d6,#0284c7)"
          }} />
        </div>
      </div>

      {/* Document upload zones */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
        {REQUIRED_DOCS.map(doc => (
          <DocUploadZone
            key={doc.key}
            docKey={doc.key}
            label={doc.label}
            hint={doc.hint}
            file={files[doc.key]}
            pending={!!pending[doc.key]}
            onFile={f => setFile(doc.key, f)}
            onPendingChange={v => setPend(doc.key, v)}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "12px", color: "#dc2626", fontSize: "0.85rem", fontWeight: 500,
          marginBottom: "16px"
        }}>
          {error}
        </div>
      )}

      {/* Warning if all pending */}
      {pendingN > 0 && uploadedN < 3 && (
        <div style={{
          padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: "12px", color: "#b45309", fontSize: "0.82rem", marginBottom: "16px"
        }}>
          Kho của bạn sẽ được tạo nhưng cần bổ sung hồ sơ còn thiếu trước khi được duyệt chính thức.
        </div>
      )}

      {/* Footer */}
      <div style={footerBar}>
        <button style={btnBack} onClick={onBack}
          onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
          Quay lại
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !hasAll}
          style={{
            padding: "12px 36px", border: "none", borderRadius: "12px",
            background: hasAll ? "linear-gradient(135deg,#00b2d6,#0284c7)" : "#e2e8f0",
            color: hasAll ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: "0.95rem",
            cursor: hasAll ? "pointer" : "not-allowed", transition: "all 0.25s ease",
            boxShadow: hasAll ? "0 6px 20px rgba(0,178,214,0.28)" : "none"
          }}
          onMouseEnter={e => { if (hasAll) e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {loading ? "Đang xử lý..." : uploadedN > 0 ? `Tải lên & Hoàn tất (${uploadedN} file)` : "Hoàn tất"}
        </button>
      </div>
    </div>
  );
};

export default Step3UploadDocuments;
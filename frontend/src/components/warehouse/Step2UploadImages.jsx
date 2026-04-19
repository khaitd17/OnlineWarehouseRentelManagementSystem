import React, { useState, useRef } from "react";
import { uploadWarehouseImage } from "../../services/warehouseService";

/* ── shared tokens ── */
const card = {
  background: "#fff",
  borderRadius: "20px",
  boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
  border: "1px solid #f1f5f9",
  padding: "40px",
  maxWidth: "760px",
  margin: "0 auto",
  fontFamily: "'Inter', sans-serif"
};
const sectionTitle = { fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: 0 };
const sectionSub   = { fontSize: "0.93rem", color: "#64748b", margin: "6px 0 0" };
const footerBar    = { marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "24px" };

const btnBack = {
  background: "none", border: "1.5px solid #e2e8f0", color: "#475569",
  fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
  padding: "10px 22px", borderRadius: "10px", transition: "all 0.2s"
};

/* ─────────────────────────────────────── */
const Step2UploadImages = ({ onImagesSelected, onBack, warehouseId, existingImages = [] }) => {
  const [files,   setFiles]   = useState([]);
  const [preview, setPreview] = useState(existingImages.map(img => img.url || img.mediaUrl));
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = (newFiles) => {
    const valid = newFiles.filter(f => f.type.startsWith("image/"));
    if (valid.length < newFiles.length) alert("Một số tệp không phải hình ảnh và đã bị bỏ qua.");
    const total = files.length + existingImages.length + valid.length;
    if (total > 10) { alert("Tối đa 10 ảnh."); return; }
    setFiles(prev => [...prev, ...valid]);
    setPreview(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
  };

  const removeFile = (i) => {
    URL.revokeObjectURL(preview[existingImages.length + i]);
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreview(prev => prev.filter((_, idx) => idx !== existingImages.length + i));
  };

  const handleContinue = async () => {
    if (files.length === 0 && existingImages.length === 0) {
      alert("Vui lòng chọn ít nhất một hình ảnh của kho"); return;
    }
    try {
      setLoading(true);
      for (let i = 0; i < files.length; i++) {
        await uploadWarehouseImage(warehouseId, files[i], i === 0 && existingImages.length === 0);
      }
      onImagesSelected(files);
    } catch (err) {
      console.error(err);
      alert("Tải lên hình ảnh không thành công. Vui lòng thử lại.");
    } finally { setLoading(false); }
  };

  const canProceed = files.length > 0 || existingImages.length > 0;

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ marginBottom: "32px", paddingBottom: "20px", borderBottom: "1px solid #f1f5f9" }}>
        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#00b2d6", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" }}>
          Bước 2 / 3
        </p>
        <h2 style={sectionTitle}>Hình ảnh kho bãi</h2>
        <p style={sectionSub}>Hình ảnh thực tế giúp khách hàng tin tưởng và đưa ra quyết định nhanh hơn.</p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false);
          addFiles(Array.from(e.dataTransfer.files));
        }}
        style={{
          border: `2px dashed ${dragging ? "#00b2d6" : "#d1d5db"}`,
          borderRadius: "16px",
          padding: "48px 24px",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: dragging ? "#f0f9ff" : "#fafafa",
          transition: "all 0.25s ease"
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#00b2d6"; e.currentTarget.style.backgroundColor = "#f0f9ff"; }}
        onMouseLeave={e => { if (!dragging) { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.backgroundColor = "#fafafa"; } }}
      >
        {/* Upload visual — NO icon, just styled text blocks */}
        <div style={{
          width: 64, height: 64, borderRadius: "16px",
          background: "linear-gradient(135deg,#e0f2fe,#bae6fd)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", fontSize: "1.6rem", fontWeight: 900, color: "#0284c7"
        }}>+</div>
        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem", marginBottom: 6 }}>
          Kéo thả hoặc nhấn để tải ảnh lên
        </div>
        <div style={{ fontSize: "0.83rem", color: "#94a3b8" }}>JPG · PNG · WEBP — tối đa 10 ảnh</div>
        <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={e => addFiles(Array.from(e.target.files))} style={{ display: "none" }} />
      </div>

      {/* Preview grid */}
      {preview.length > 0 && (
        <div style={{ marginTop: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>Danh sách ảnh ({preview.length})</span>
            <span style={{ fontSize: "0.78rem", color: "#00b2d6", fontWeight: 600, background: "#e0f2fe", padding: "3px 12px", borderRadius: "20px" }}>
              Ảnh đầu = ảnh đại diện
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px" }}>
            {/* Existing images (no remove) */}
            {existingImages.map((img, i) => (
              <div key={`ex-${i}`} style={{
                position: "relative", borderRadius: "12px", overflow: "hidden",
                aspectRatio: "1", boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                border: i === 0 ? "2.5px solid #00b2d6" : "1px solid #e2e8f0"
              }}>
                <img src={img.url || img.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {i === 0 && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#00b2d6", color: "#fff", fontSize: "9px", fontWeight: 800, textAlign: "center", padding: "3px 0", letterSpacing: "0.5px" }}>
                    ĐẠI DIỆN
                  </div>
                )}
              </div>
            ))}
            {/* New files */}
            {files.map((_, i) => (
              <div key={`new-${i}`} style={{
                position: "relative", borderRadius: "12px", overflow: "hidden",
                aspectRatio: "1", boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                border: existingImages.length === 0 && i === 0 ? "2.5px solid #00b2d6" : "1px solid #e2e8f0"
              }}>
                <img src={preview[existingImages.length + i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  onClick={e => { e.stopPropagation(); removeFile(i); }}
                  style={{
                    position: "absolute", top: 7, right: 7,
                    width: 26, height: 26, borderRadius: "50%",
                    background: "rgba(255,255,255,0.92)", border: "none",
                    cursor: "pointer", color: "#ef4444", fontWeight: 800,
                    fontSize: "14px", lineHeight: 1, boxShadow: "0 1px 6px rgba(0,0,0,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >✕</button>
                {existingImages.length === 0 && i === 0 && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#00b2d6", color: "#fff", fontSize: "9px", fontWeight: 800, textAlign: "center", padding: "3px 0" }}>
                    ĐẠI DIỆN
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={footerBar}>
        <button style={btnBack} onClick={onBack}
          onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
          Quay lại
        </button>
        <button
          onClick={handleContinue}
          disabled={loading || !canProceed}
          style={{
            padding: "12px 36px",
            background: canProceed ? "linear-gradient(135deg,#00b2d6,#0284c7)" : "#e2e8f0",
            color: canProceed ? "#fff" : "#94a3b8",
            border: "none", borderRadius: "12px", cursor: canProceed ? "pointer" : "not-allowed",
            fontWeight: 700, fontSize: "0.95rem", transition: "all 0.25s ease",
            boxShadow: canProceed ? "0 6px 20px rgba(0,178,214,0.28)" : "none"
          }}
          onMouseEnter={e => { if (canProceed) e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {loading ? "Đang tải lên..." : "Tiếp tục →"}
        </button>
      </div>
    </div>
  );
};

export default Step2UploadImages;
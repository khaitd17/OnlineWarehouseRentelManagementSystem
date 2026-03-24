import React, { useState, useRef } from "react";
import { uploadWarehouseImage } from "../../services/warehouseService";

const Step2UploadImages = ({ onImagesSelected, warehouseId, existingImages = [] }) => {
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState(existingImages.map(img => img.url));
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const selected = Array.from(e.target.files);
    addFiles(selected);
  };

  const addFiles = (newFiles) => {
    // Basic validation for image type
    const validImages = newFiles.filter(file => file.type.startsWith("image/"));
    if (validImages.length < newFiles.length) {
      alert("Một số tệp không phải là hình ảnh và đã được bỏ qua.");
    }
    
    setFiles(prev => [...prev, ...validImages]);
    const urls = validImages.map(file => URL.createObjectURL(file));
    setPreview(prev => [...prev, ...urls]);
  };

  const removeFile = (index) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(preview[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (files.length === 0 && existingImages.length === 0) {
      alert("Vui lòng chọn ít nhất một hình ảnh của kho");
      return;
    }

    try {
      setLoading(true);
      // Upload ONLY new files sequentially to the existing warehouseId
      for (let i = 0; i < files.length; i++) {
        await uploadWarehouseImage(
          warehouseId,
          files[i],
          i === 0 && existingImages.length === 0 // Mark as primary only if no existing images
        );
      }
      onImagesSelected(files);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Tải lên hình ảnh không thành công. Vui lòng thử lại.");
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
          Hình ảnh kho bãi
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Hình ảnh thực tế giúp khách hàng tin tưởng và đưa ra quyết định nhanh hơn.
        </p>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#00b2d6"; e.currentTarget.style.backgroundColor = "#f0f9ff"; }}
        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.backgroundColor = "#f8fafc"; }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = "#e2e8f0";
          e.currentTarget.style.backgroundColor = "#f8fafc";
          const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
          addFiles(droppedFiles);
        }}
        style={{
          border: "2px dashed #e2e8f0",
          borderRadius: "20px",
          padding: "50px 20px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
          backgroundColor: "#f8fafc",
          position: "relative"
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00b2d6"; e.currentTarget.style.backgroundColor = "#f0f9ff"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.backgroundColor = "#f8fafc"; }}
      >
        <div style={{ color: "#00b2d6", marginBottom: "16px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "56px", opacity: 0.8 }}>
            add_photo_alternate
          </span>
        </div>
        <div style={{ fontWeight: 700, color: "#334155", fontSize: "1.1rem", marginBottom: "6px" }}>
          Kéo thả hoặc nhấn để tải ảnh lên
        </div>
        <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
          Hỗ trợ JPG, PNG, WEBP (Tối đa 10 ảnh)
        </div>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*"
          onChange={handleChange}
          style={{ display: "none" }}
        />
      </div>

      {preview.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
              Danh sách ảnh ({preview.length})
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#00b2d6", fontWeight: 600, backgroundColor: "#e0f7fa", padding: "4px 12px", borderRadius: "20px" }}>
              Ảnh đầu tiên sẽ là ảnh đại diện
            </span>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px" }}>
            {preview.map((img, i) => (
              <div 
                key={i} 
                style={{ 
                  position: "relative", 
                  borderRadius: "16px", 
                  overflow: "hidden", 
                  aspectRatio: "1/1",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  border: i === 0 ? "3px solid #00b2d6" : "1px solid #e2e8f0",
                  transition: "transform 0.2s"
                }}
              >
                <img
                  src={img}
                  alt={`Kho ${i}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "rgba(255, 255, 255, 0.9)",
                    border: "none",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#ef4444",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                </button>
                {i === 0 && (
                  <div style={{
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    right: "0",
                    background: "#00b2d6",
                    color: "#fff",
                    textAlign: "center",
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "4px 0",
                    letterSpacing: "0.5px"
                  }}>
                    ẢNH ĐẠI DIỆN
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "50px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "30px" }}>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.95rem"
          }}
          onClick={() => window.history.back()}
        >
          Quay lại
        </button>
        <button
          onClick={handleContinue}
          disabled={loading || files.length === 0}
          style={{
            padding: "14px 40px",
            background: files.length > 0 ? "#00b2d6" : "#cbd5e1",
            color: "#fff",
            border: "none",
            borderRadius: "14px",
            cursor: files.length > 0 ? "pointer" : "not-allowed",
            fontWeight: 700,
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.3s ease",
            boxShadow: files.length > 0 ? "0 8px 25px rgba(0, 178, 214, 0.25)" : "none"
          }}
          onMouseEnter={(e) => { if (files.length > 0) e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: "22px" }}>progress_activity</span>
              Đang tải lên...
            </>
          ) : (
            <>
              <span>Tiếp tục bước cuối</span>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step2UploadImages;
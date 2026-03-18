import React, { useEffect, useState } from "react";
import api from "../services/axiosClient";
import { useNavigate } from "react-router-dom";

const OwnerWarehouseList = () => {

  const [warehouses, setWarehouses] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const ownerId = user?.userId;

  const loadWarehouses = async () => {
    try {
      const res = await api.get(`/Warehouse/owner/${ownerId}`);
      setWarehouses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (warehouseId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa kho này không? Hành động này không thể hoàn tác.")) {
      try {
        await api.delete(`/Warehouse/${warehouseId}`);
        alert("Xóa kho thành công!");
        loadWarehouses(); // Refresh list after deletion
      } catch (err) {
        alert("Có lỗi khi xóa kho: " + (err.response?.data?.message || err.message));
      }
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return <span style={{ padding: "4px 12px", background: "#dcfce7", color: "#166534", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>Đã Phê Duyệt</span>;
      case "PENDING":
        return <span style={{ padding: "4px 12px", background: "#fef9c3", color: "#854d0e", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>Đang Chờ Duyệt</span>;
      case "REJECTED":
        return <span style={{ padding: "4px 12px", background: "#fee2e2", color: "#991b1b", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>Bị Từ Chối</span>;
      case "HIDDEN":
        return <span style={{ padding: "4px 12px", background: "#f1f5f9", color: "#475569", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>Chưa Duyệt</span>;
      case "DELETED":
        return <span style={{ padding: "4px 12px", background: "#f9fafb", color: "#9ca3af", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>Đã Xóa</span>;
      default:
        return <span style={{ padding: "4px 12px", background: "#f1f5f9", color: "#475569", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>{status || "Không rõ"}</span>;
    }
  };

  return (
    <div style={{ padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "2.2rem", fontWeight: 800, color: "#0f172a" }}>Kho Của Tôi</h1>
          <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: "1.05rem" }}>Quản lý và giám sát các cơ sở kho bãi của bạn</p>
        </div>
        <button
          onClick={() => navigate("/create-warehouse")}
          style={{
            padding: "12px 24px",
            background: "linear-gradient(135deg, #0284c7 0%, #00b2d6 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 8px 16px rgba(2, 132, 199, 0.25)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add_box</span>
          Tạo Kho Mới
        </button>
      </div>

      <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "24px"
        }}
      >
        {warehouses.map((w) => (
          <div
            key={w.warehouseId}
            style={{
              background: "#fff",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
              border: "1px solid #e2e8f0",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              display: "flex",
              flexDirection: "column",
              cursor: "default"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.04)";
            }}
          >
            {/* Header / Thumbnail Area */}
            {(() => {
              const media = w.warehouseMedia || w.WarehouseMedia || [];
              const primary = media.find(m => m.isPrimary || m.IsPrimary) || media[0];
              const rawUrl = primary?.mediaUrl || primary?.MediaUrl;
              const imgUrl = rawUrl
                ? (rawUrl.startsWith('http') ? rawUrl : `http://localhost:5276${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`)
                : null;

              return (
                <div style={{ height: "180px", position: "relative", overflow: "hidden", borderBottom: "1px solid #e2e8f0" }}>
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={w.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.style.background = "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)"; }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 56, color: "#bae6fd" }}>warehouse</span>
                    </div>
                  )}
                  {/* Overlay badges */}
                  <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    {getStatusBadge(w.status)}
                    <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)", padding: "4px 10px", borderRadius: "8px", fontWeight: "bold", color: "#0ea5e9", fontSize: "0.85rem", boxShadow: "0 2px 5px rgba(0,0,0,0.08)" }}>
                      {w.warehouseId && `#WHS-${w.warehouseId.toString().padStart(4, '0')}`}
                    </div>
                  </div>
                  {/* Name overlay at bottom */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)", padding: "20px 16px 12px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</h3>
                  </div>
                </div>
              );
            })()}

            {/* Body Info */}
            <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", color: "#475569" }}>
                <span className="material-symbols-outlined" style={{ color: "#94a3b8", fontSize: "20px" }}>location_on</span>
                <span style={{ fontSize: "0.95rem", lineHeight: "1.4" }}>{w.address}</span>
              </div>

              <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                <div style={{ flex: 1, backgroundColor: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>TỔNG DIỆN TÍCH</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b" }}>{w.totalArea} <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>m²</span></div>
                </div>
                <div style={{ flex: 1, backgroundColor: "#f0fdf4", padding: "12px", borderRadius: "12px", border: "1px solid #dcfce7" }}>
                  <div style={{ fontSize: "0.8rem", color: "#166534", marginBottom: "4px", fontWeight: 600 }}>CÒN TRỐNG</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#15803d" }}>{w.availableArea} <span style={{ fontSize: "0.9rem", color: "#86efac" }}>m²</span></div>
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div style={{ padding: "20px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", gap: "12px" }}>
              <button
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  color: "#334155",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                onClick={() => navigate(`/owner-warehouse/${w.warehouseId}`)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>dashboard</span>
                Chi tiết
              </button>

              <button
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#fef3c7",
                  border: "1px solid #fde68a",
                  borderRadius: "10px",
                  color: "#d97706",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#fde68a"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fef3c7"}
                onClick={() => navigate(`/warehouse-edit/${w.warehouseId}`)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                Sửa
              </button>

              <button
                style={{
                  padding: "10px",
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  color: "#ef4444",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s"
                }}
                title="Xóa Kho"
                onMouseEnter={(e) => e.currentTarget.style.background = "#fecaca"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fee2e2"}
                onClick={() => handleDelete(w.warehouseId)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {warehouses.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "#fff", borderRadius: "20px", border: "1px dashed #cbd5e1" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#cbd5e1", marginBottom: "16px" }}>inventory_2</span>
          <h3 style={{ margin: "0 0 8px 0", color: "#475569" }}>Bạn chưa có kho nào</h3>
          <p style={{ margin: 0, color: "#94a3b8" }}>Hãy bắt đầu thêm kho trên hệ thống để chia sẻ không gian ngay thôi!</p>
        </div>
      )}

    </div>
  );
};

export default OwnerWarehouseList;
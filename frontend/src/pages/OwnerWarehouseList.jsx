import React, { useEffect, useState } from "react";
import api from "../services/axiosClient";
import { useNavigate } from "react-router-dom";
import subscriptionService from "../services/subscriptionService";
import { Modal, message } from "antd";

const OwnerWarehouseList = () => {

  const [warehouses, setWarehouses] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, warehouseId: null, warehouseName: "", loading: false });
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [toast, setToast] = useState(null);
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

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    setDeleteModal(p => ({ ...p, loading: true }));
    try {
      await api.delete(`/Warehouse/${deleteModal.warehouseId}`);
      setDeleteModal({ open: false, warehouseId: null, warehouseName: "", loading: false });
      showToast("Xóa kho thành công!", "success");
      loadWarehouses();
    } catch (err) {
      setDeleteModal(p => ({ ...p, loading: false }));
      showToast("Lỗi: " + (err.response?.data?.message || err.message), "error");
    }
  };

  useEffect(() => {
    loadWarehouses();
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const res = await subscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(res.data);
    } catch (err) {
      console.error("Failed to load subscription status", err);
    }
  };

  const handleCreateWarehouse = () => {
    if (!subscriptionStatus) {
      message.loading("Đang kiểm tra gói dịch vụ...");
      loadSubscriptionStatus();
      return;
    }

    if (!subscriptionStatus.isActive) {
      Modal.warning({
        title: 'Yêu cầu Gói dịch vụ',
        content: 'Bạn cần kích hoạt gói dịch vụ (Basic hoặc Premium) để có thể tạo kho mới.',
        okText: 'Mua gói dịch vụ',
        onOk: () => navigate('/subscription')
      });
      return;
    }

    if (subscriptionStatus.currentWarehouses >= subscriptionStatus.maxWarehouses) {
      Modal.warning({
        title: 'Giới hạn Gói dịch vụ',
        content: `Gói ${subscriptionStatus.plan} hiện tại của bạn chỉ cho phép sở hữu tối đa ${subscriptionStatus.maxWarehouses} kho. Bạn đã đạt giới hạn này.`,
        okText: 'Nâng cấp lên Premium',
        showCancel: true,
        cancelText: 'Hủy',
        onOk: () => navigate('/subscription')
      });
      return;
    }

    navigate("/create-warehouse");
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return <span style={{ padding: "4px 12px", background: "#dcfce7", color: "#166534", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>Đã Phê Duyệt</span>;
      case "PENDING":
        return <span style={{ padding: "4px 12px", background: "#fef9c3", color: "#854d0e", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>Đang Chờ Duyệt</span>;
      case "REJECTED":
        return <span style={{ padding: "4px 12px", background: "#fee2e2", color: "#991b1b", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>Bị Từ Chối</span>;
      case "HIDDEN":
        return <span style={{ padding: "4px 12px", background: "#f1f5f9", color: "#475569", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>Chờ Duyệt</span>;
      case "DRAFT":
        return <span style={{ padding: "4px 12px", background: "#fff7ed", color: "#c2410c", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>Bản nháp</span>;
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
          onClick={handleCreateWarehouse}
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

              {/* Status banners */}
              {w.status?.toUpperCase() === "PENDING" && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  background: "linear-gradient(135deg,#fffbeb,#fef3c7)",
                  border: "1px solid #fde68a", borderRadius: "12px",
                  padding: "12px 14px",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#d97706", flexShrink: 0 }}>schedule</span>
                  <div>
                    <div style={{ fontWeight: 700, color: "#92400e", fontSize: "0.9rem", marginBottom: 2 }}>Đang chờ Admin xét duyệt</div>
                    <div style={{ color: "#b45309", fontSize: "0.82rem" }}>Kho của bạn đã được nộp và đang trong hàng đợi xét duyệt. Vui lòng chờ phản hồi từ hệ thống.</div>
                  </div>
                </div>
              )}

              {w.status?.toUpperCase() === "REJECTED" && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  background: "linear-gradient(135deg,#fff1f2,#fee2e2)",
                  border: "1px solid #fecaca", borderRadius: "12px",
                  padding: "12px 14px",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#dc2626", flexShrink: 0 }}>cancel</span>
                  <div>
                    <div style={{ fontWeight: 700, color: "#991b1b", fontSize: "0.9rem", marginBottom: 2 }}>Kho bị từ chối</div>
                    <div style={{ color: "#b91c1c", fontSize: "0.82rem", lineHeight: 1.5 }}>
                      {w.rejectionReason
                        ? <><strong>Lý do:</strong> {w.rejectionReason}</>
                        : "Kho không đáp ứng yêu cầu. Vui lòng chỉnh sửa và nộp lại."}
                    </div>
                  </div>
                </div>
              )}

              {w.status?.toUpperCase() === "APPROVED" && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                  border: "1px solid #bbf7d0", borderRadius: "12px",
                  padding: "10px 14px",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#16a34a" }}>verified</span>
                  <div style={{ fontWeight: 600, color: "#15803d", fontSize: "0.88rem" }}>Kho đã được phê duyệt và hiển thị công khai</div>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", color: "#475569", marginBottom: "-8px" }}>
                <span className="material-symbols-outlined" style={{ color: "#00b2d6", fontSize: "20px" }}>category</span>
                <span style={{ fontSize: "0.95rem", lineHeight: "1.4", fontWeight: 600 }}>{w.warehouseType || "Khác"}</span>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", color: "#475569" }}>
                <span className="material-symbols-outlined" style={{ color: "#94a3b8", fontSize: "20px" }}>location_on</span>
                <span style={{ fontSize: "0.95rem", lineHeight: "1.4" }}>{w.address}</span>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                <div style={{ flex: 1, backgroundColor: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>TỔNG DIỆN TÍCH</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b" }}>{w.totalArea} <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>m²</span></div>
                </div>
                <div style={{ flex: 1, backgroundColor: "#f0fdf4", padding: "12px", borderRadius: "12px", border: "1px solid #dcfce7" }}>
                  <div style={{ fontSize: "0.8rem", color: "#166534", marginBottom: "4px", fontWeight: 600 }}>CÒN TRỐNG</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#15803d" }}>{w.availableArea} <span style={{ fontSize: "0.9rem", color: "#86efac" }}>m²</span></div>
                </div>
              </div>

              {/* Giá thuê/m² */}
              <div style={{
                padding: "12px 14px", borderRadius: "12px",
                background: w.pricePerM2
                  ? "linear-gradient(135deg,#f0fdf4,#dcfce7)"
                  : "#f8fafc",
                border: w.pricePerM2 ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: w.pricePerM2 ? "#166534" : "#94a3b8", marginBottom: 3, textTransform: "uppercase" }}>
                    💰 Giá thuê / m² / tháng
                  </div>
                  {w.pricePerM2 ? (
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#15803d" }}>
                      {new Intl.NumberFormat("vi-VN").format(w.pricePerM2)} <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#16a34a" }}>₫/m²</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.88rem", color: "#94a3b8", fontWeight: 500 }}>Chưa cập nhật giá</div>
                  )}
                </div>
                {w.pricePerM2 && w.totalArea && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: 600 }}>≈ tổng/tháng</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#15803d" }}>
                      {new Intl.NumberFormat("vi-VN").format(w.pricePerM2 * w.totalArea)} ₫
                    </div>
                  </div>
                )}
              </div>


            </div>

            {/* Actions Footer */}
            <div style={{ padding: "20px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", gap: "12px" }}>
              {w.status?.toUpperCase() === "DRAFT" ? (
                <button
                  style={{
                    flex: 2,
                    padding: "10px",
                    background: "#00b2d6",
                    border: "none",
                    borderRadius: "10px",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                  onClick={() => navigate(`/create-warehouse?id=${w.warehouseId}`)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
                  Tiếp tục đăng ký
                </button>
              ) : (
                <>
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
                </>
              )}

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
                onClick={() => setDeleteModal({ open: true, warehouseId: w.warehouseId, warehouseName: w.name, loading: false })}
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

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          padding: "14px 22px", borderRadius: 14,
          background: toast.type === "success" ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#ef4444,#dc2626)",
          color: "#fff", fontWeight: 700, fontSize: 14,
          boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
          display: "flex", alignItems: "center", gap: 10,
          animation: "fadeInUp 0.3s ease",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {toast.type === "success" ? "check_circle" : "cancel"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteModal.open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Backdrop */}
          <div
            onClick={() => !deleteModal.loading && setDeleteModal({ open: false, warehouseId: null, warehouseName: "", loading: false })}
            style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
          />
          {/* Modal Card */}
          <div style={{
            position: "relative", zIndex: 1,
            background: "#fff", borderRadius: 24, padding: "36px 32px",
            width: "min(440px, 94vw)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
            animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            {/* Icon */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg,#fee2e2,#fecaca)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 20px rgba(239,68,68,0.25)",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#ef4444" }}>delete_forever</span>
              </div>
            </div>

            <h2 style={{ textAlign: "center", margin: "0 0 8px", fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
              Xác nhận xóa kho
            </h2>
            <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, margin: "0 0 8px", lineHeight: 1.6 }}>
              Bạn có chắc chắn muốn xóa kho
            </p>
            <p style={{ textAlign: "center", fontWeight: 800, fontSize: 15, color: "#0f172a", margin: "0 0 6px" }}>
              "{deleteModal.warehouseName}"
            </p>
            <div style={{
              margin: "0 0 24px",
              background: "linear-gradient(135deg,#fff1f2,#fee2e2)",
              border: "1px solid #fecaca", borderRadius: 12, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span className="material-symbols-outlined" style={{ color: "#dc2626", fontSize: 18 }}>warning</span>
              <span style={{ fontSize: 13, color: "#991b1b", fontWeight: 600 }}>Hành động này không thể hoàn tác!</span>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setDeleteModal({ open: false, warehouseId: null, warehouseName: "", loading: false })}
                disabled={deleteModal.loading}
                style={{
                  flex: 1, padding: "13px", borderRadius: 14,
                  border: "1.5px solid #e2e8f0", background: "#f8fafc",
                  color: "#475569", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
                onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteModal.loading}
                style={{
                  flex: 1, padding: "13px", borderRadius: 14,
                  border: "none",
                  background: deleteModal.loading ? "#fca5a5" : "linear-gradient(135deg,#ef4444,#dc2626)",
                  color: "#fff", fontWeight: 800, fontSize: 14,
                  cursor: deleteModal.loading ? "not-allowed" : "pointer",
                  boxShadow: "0 8px 20px rgba(239,68,68,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {deleteModal.loading ? "hourglass_empty" : "delete_forever"}
                </span>
                {deleteModal.loading ? "Đang xóa..." : "Xóa kho"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

    </div>
  );
};

export default OwnerWarehouseList;
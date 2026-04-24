import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// Icons removed

import adminService from "../../services/adminService";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../components/Toast";

const BASE_URL = "http://localhost:5276";

const DOC_TYPE_LABELS = {
  BUSINESS_LICENSE: "Giấy phép kinh doanh",
  WAREHOUSE_CERT:   "Giấy chứng nhận quyền sử dụng kho",
  FIRE_SAFETY:      "Chứng nhận phòng cháy chữa cháy",
  LAND_USE_RIGHT:   "Quyền sử dụng đất",
  CONSTRUCTION_PERMIT: "Giấy phép xây dựng",
  ENVIRONMENTAL:    "Chứng nhận môi trường",
  INSURANCE:        "Bảo hiểm",
  OTHER:            "Tài liệu khác",
};

export default function AdminPendingWarehousesPage() {
  const navigate = useNavigate();
  const showToast = useToast();

  // List state
  const [data, setData] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", page: 1, pageSize: 10, sortBy: "createdAt", sortOrder: "desc" });
  const [searchInput, setSearchInput] = useState("");

  // Detail modal
  const [detailModal, setDetailModal] = useState({ open: false, warehouse: null, loading: false });

  // Approve/Reject modal
  const defaultApproveModal = { open: false, warehouseId: null, warehouseName: "", isApproved: true, reason: "", loading: false };
  const [approveModal, setApproveModal] = useState(defaultApproveModal);

  // ── Fetch list ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.search) delete params.search;
      const res = await adminService.getPendingWarehouses(params);
      if (res.data.success) setData(res.data.data);
    } catch {
      showToast("Lỗi khi tải danh sách kho chờ duyệt", "error");
    }
    setLoading(false);
  }, [filters, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Search (debounced by button) ──
  const handleSearch = () => setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));

  // ── Approve/Reject submit ──
  const handleApproveSubmit = async () => {
    if (!approveModal.isApproved && !approveModal.reason.trim()) {
      showToast("Vui lòng nhập lý do từ chối", "error");
      return;
    }
    setApproveModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.approveWarehouse(approveModal.warehouseId, {
        isApproved: approveModal.isApproved,
        rejectionReason: approveModal.isApproved ? null : approveModal.reason,
      });
      if (res.data.success) {
        showToast(res.data.message, "success");
        window.dispatchEvent(new Event("pendingWarehousesChanged"));
        setDetailModal({ open: false, warehouse: null, loading: false });
        fetchData();
      } else {
        showToast(res.data.message, "error");
      }
    } catch (e) {
      showToast(e.response?.data?.message || "Có lỗi xảy ra", "error");
    }
    setApproveModal(defaultApproveModal);
  };

  // ── Detail modal ──
  const openDetail = async (row) => {
    setDetailModal({ open: true, warehouse: null, loading: true });
    try {
      const res = await adminService.getWarehouseDetail(row.warehouseId);
      if (res.data.success) setDetailModal({ open: true, warehouse: res.data.data, loading: false });
      else setDetailModal({ open: false, warehouse: null, loading: false });
    } catch {
      showToast("Không thể tải chi tiết kho", "error");
      setDetailModal({ open: false, warehouse: null, loading: false });
    }
  };

  const wh = detailModal.warehouse;

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #e2e8f0" }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>Duyệt kho bãi</h1>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>Xem xét và phê duyệt các kho chờ đăng ký từ chủ kho</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!loading && (
            <div style={{ padding: "6px 14px", background: "#fefce8", border: "1px solid #fde047", color: "#854d0e", fontWeight: 700, fontSize: "0.85rem", borderRadius: "8px" }}>
              Đang chờ duyệt: {data.totalCount}
            </div>
          )}
          <button onClick={fetchData} disabled={loading} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#334155", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
            Làm mới danh sách
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <input
            placeholder="Tìm kiếm theo tên kho, địa chỉ, chủ kho..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            style={{ width: "100%", padding: "10px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <button onClick={handleSearch} style={{ padding: "0 24px", background: "#0f172a", border: "none", borderRadius: "8px", color: "#fff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
          Tìm kiếm
        </button>
        {filters.search && (
          <button onClick={() => { setSearchInput(""); setFilters(p => ({ ...p, search: "", page: 1 })); }} style={{ padding: "0 20px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#475569", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
            Xóa lọc
          </button>
        )}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
          <div className="admin-spinner" style={{ width: 36, height: 36, margin: "0 auto 12px" }} />
          Đang tải dữ liệu...
        </div>
      ) : data.items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569", marginBottom: 4 }}>Không có kho nào chờ duyệt</div>
          <div style={{ color: "#64748b", fontSize: "0.9rem" }}>Tất cả các yêu cầu đã được xử lý hoàn tất.</div>
        </div>
      ) : (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 55 }}>ID</th>
                  <th>Tên kho</th>
                  <th>Chủ kho</th>
                  <th>Địa chỉ</th>
                  <th style={{ width: 100 }}>Diện tích</th>
                  <th style={{ width: 80 }}>Ảnh</th>
                  <th style={{ width: 80 }}>Giấy tờ</th>
                  <th style={{ width: 100 }}>Ngày nộp</th>
                  <th style={{ width: 200 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(row => (
                  <tr key={row.warehouseId} style={{ transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                        #{row.warehouseId.toString().padStart(4, "0")}
                      </span>
                    </td>

                    <td>
                      <button
                        onClick={() => openDetail(row)}
                        style={{ background: "none", border: "none", color: "#0095c7", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: 0, textAlign: "left", marginBottom: "4px" }}>
                        {row.name}
                      </button>
                      <div style={{ display: "inline-block", background: "#f1f5f9", color: "#475569", fontSize: 11, padding: "2px 6px", borderRadius: 4, fontWeight: 500 }}>
                        {row.warehouseType || "Khác"}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#0095c7,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {(row.ownerName || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{row.ownerName}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{row.ownerEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ color: "#475569", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.address}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.85rem" }}>{row.totalArea} m³</span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: row.mediaCount > 0 ? "#0284c7" : "#94a3b8" }}>
                        {row.mediaCount} ảnh/video
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: row.documentCount > 0 ? "#16a34a" : "#94a3b8" }}>
                        {row.documentCount} giấy tờ
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString("vi-VN") : "—"}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          onClick={() => openDetail(row)}
                          style={{ padding: "4px 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#334155", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                          Chi tiết
                        </button>
                        <button
                          onClick={() => setApproveModal({ open: true, warehouseId: row.warehouseId, warehouseName: row.name, isApproved: true, reason: "", loading: false })}
                          style={{ padding: "4px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", color: "#166534", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                          Duyệt
                        </button>
                        <button
                          onClick={() => setApproveModal({ open: true, warehouseId: row.warehouseId, warehouseName: row.name, isApproved: false, reason: "", loading: false })}
                          style={{ padding: "4px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#991b1b", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination ── */}
      {data.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 24, paddingTop: 16 }}>
          <button disabled={data.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))} style={{ padding: "6px 12px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: data.page <= 1 ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>
            Trang trước
          </button>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>Trang {data.page} / {data.totalPages}</span>
          <button disabled={data.page >= data.totalPages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))} style={{ padding: "6px 12px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: data.page >= data.totalPages ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>
            Trang tiếp
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════
          DETAIL SIDE-PANEL MODAL
         ══════════════════════════════════════ */}
      {detailModal.open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setDetailModal({ open: false, warehouse: null, loading: false })}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
          />
          {/* Panel */}
          <div style={{
            position: "relative", zIndex: 1, width: "min(720px,96vw)", height: "100vh",
            background: "#fff", display: "flex", flexDirection: "column",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
            animation: "slideInRight 0.25s ease",
          }}>
            {/* Panel Header */}
            <div style={{ padding: "24px 32px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>CHI TIẾT KHO</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "#0f172a" }}>
                    {detailModal.loading ? "Đang tải..." : wh?.name}
                  </span>
                  {!detailModal.loading && <StatusBadge status={wh?.status} />}
                </div>
              </div>
              <button
                onClick={() => setDetailModal({ open: false, warehouse: null, loading: false })}
                style={{ background: "#f1f5f9", border: "none", cursor: "pointer", color: "#475569", padding: "6px 12px", borderRadius: "8px", fontWeight: 700, fontSize: "0.8rem" }}>
                ĐÓNG
              </button>
            </div>

            {/* Panel Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {detailModal.loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Đang tải chi tiết...</div>
              ) : wh ? (
                <>
                  {/* Owner Info */}
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14, border: "1px solid #e2e8f0" }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#0095c7,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 17, flexShrink: 0 }}>
                      {(wh.owner?.fullName || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: 2 }}>{wh.owner?.fullName}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{wh.owner?.email} {wh.owner?.phone ? `· ${wh.owner.phone}` : ""}</div>
                    </div>
                    <button style={{ padding: "6px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#334155", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }} onClick={() => navigate(`/admin/warehouses/${wh.warehouseId}`)}>
                      Mở trang kho
                    </button>
                  </div>

                  {/* Basic Info Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                    {[
                      ["Địa chỉ", wh.address],
                      ["Loại kho", wh.warehouseType || "Khác"],
                      ["Diện tích tổng", `${wh.totalArea} m³`],
                      ["Diện tích khả dụng", `${wh.availableArea} m³`],
                      ["Giờ hoạt động", wh.operatingHours || (wh.is24HoursAccess ? "24/7" : "—")],
                      ["Ngày tạo", wh.createdAt ? new Date(wh.createdAt).toLocaleDateString("vi-VN") : "—"],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 14px", border: "1px solid #f3f4f6" }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#1f2937" }}>{value}</div>
                      </div>
                    ))}

                    {/* Giá thuê/m³ — full-width highlighted */}
                    <div style={{
                      gridColumn: "1 / -1",
                      borderRadius: 10, padding: "14px 16px",
                      background: wh.pricePerM2
                        ? "linear-gradient(135deg,#ecfdf5,#d1fae5)"
                        : "linear-gradient(135deg,#fefce8,#fef9c3)",
                      border: wh.pricePerM2 ? "1.5px solid #6ee7b7" : "1.5px solid #fde68a",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", color: wh.pricePerM2 ? "#065f46" : "#92400e" }}>
                          Giá thuê / m³ / tháng
                        </div>
                        {wh.pricePerM2 ? (
                          <div style={{ fontSize: 20, fontWeight: 900, color: "#065f46" }}>
                            {new Intl.NumberFormat("vi-VN").format(wh.pricePerM2)}&nbsp;<span style={{ fontSize: 13, fontWeight: 600, color: "#047857" }}>₫/m³</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>Chưa cập nhật</div>
                        )}
                      </div>
                      {wh.pricePerM2 && wh.totalArea && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "#047857", fontWeight: 600, marginBottom: 2 }}>Tổng kho/tháng</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#065f46" }}>
                            ≈ {new Intl.NumberFormat("vi-VN").format(wh.pricePerM2 * wh.totalArea)} ₫
                          </div>
                        </div>
                      )}
                    </div>
                  </div>



                  {/* Description */}
                  {wh.description && (
                    <div style={{ marginBottom: 18, padding: "14px 16px", background: "#fafafa", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>Mô tả</div>
                      <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{wh.description}</p>
                    </div>
                  )}

                  {/* Media */}
                  {wh.media && wh.media.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 10 }}>
                        ẢNH & VIDEO KHO ({wh.media.length})
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8 }}>
                        {wh.media.map(m => {
                          const url = m.mediaUrl?.startsWith("http") ? m.mediaUrl : `${BASE_URL}${m.mediaUrl}`;
                          return (
                            <div key={m.mediaId} style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", position: "relative", background: "#f9fafb" }}>
                              {m.mediaType === "VIDEO" ? (
                                <video src={url} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} controls />
                              ) : (
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
                                </a>
                              )}
                              {m.isPrimary && (
                                <span style={{ position: "absolute", top: 4, left: 4, background: "#0095c7", color: "#fff", fontSize: 9, padding: "2px 6px", borderRadius: 3, fontWeight: 600 }}>CHÍNH</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {wh.documents && wh.documents.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 10 }}>
                        GIẤY TỜ PHÁP LÝ ({wh.documents.length} / 3)
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {wh.documents.map(doc => {
                          const docUrl = doc.documentUrl?.startsWith("http")
                            ? doc.documentUrl
                            : `${BASE_URL}${doc.documentUrl}`;
                          const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(docUrl);
                          const isPdf   = /\.pdf$/i.test(docUrl);
                          return (
                            <div key={doc.documentId} style={{ background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                              {/* Row header */}
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1f2937" }}>
                                    {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                                  </div>
                                  {doc.documentNumber && <div style={{ fontSize: 11, color: "#9ca3af" }}>Số: {doc.documentNumber}</div>}
                                  {doc.expiryDate && <div style={{ fontSize: 11, color: "#f59e0b" }}>Hết hạn: {doc.expiryDate}</div>}
                                </div>
                                <a href={docUrl} target="_blank" rel="noopener noreferrer"
                                  style={{ display: "inline-flex", alignItems: "center", padding: "5px 12px", background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 8, color: "#1d4ed8", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                                  {isPdf ? "Mở PDF" : "Xem file"}
                                </a>
                              </div>
                              {/* Preview for images */}
                              {isImage && (
                                <a href={docUrl} target="_blank" rel="noopener noreferrer">
                                  <img src={docUrl} alt={doc.documentType} style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block", borderTop: "1px solid #e5e7eb" }}
                                    onError={e => { e.target.style.display = "none"; }} />
                                </a>
                              )}
                              {isPdf && (
                                <div style={{ padding: "10px 14px", borderTop: "1px solid #e5e7eb", background: "#eff6ff", fontSize: 12, color: "#1d4ed8" }}>
                                  Tài liệu PDF — nhấn nút "Mở PDF" để xem
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {wh.documents.length < 3 && (
                        <div style={{ marginTop: 8, padding: "8px 12px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a", fontSize: 12, color: "#b45309" }}>
                          Còn {3 - wh.documents.length} loại giấy tờ chưa được tải lên (đang chờ cấp hoặc chưa bổ sung).
                        </div>
                      )}
                    </div>
                  )}
                  {(!wh.documents || wh.documents.length === 0) && (
                    <div style={{ marginBottom: 20, padding: "12px 14px", background: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca", fontSize: 13, color: "#dc2626" }}>
                      Chưa có giấy tờ pháp lý nào được tải lên.
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Panel Footer — Action Buttons */}
            {!detailModal.loading && wh?.status === "PENDING" && (
              <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 12, flexShrink: 0, background: "#fafafa" }}>
                <button
                  style={{ flex: 1, padding: "12px", background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                  onClick={() => setApproveModal({ open: true, warehouseId: wh.warehouseId, warehouseName: wh.name, isApproved: false, reason: "", loading: false })}>
                  TỪ CHỐI KHO NÀY
                </button>
                <button
                  style={{ flex: 1, padding: "12px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                  onClick={() => setApproveModal({ open: true, warehouseId: wh.warehouseId, warehouseName: wh.name, isApproved: true, reason: "", loading: false })}>
                  DUYỆT KHO NÀY
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          APPROVE / REJECT CONFIRMATION MODAL
         ══════════════════════════════════════ */}
      {approveModal.open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => !approveModal.loading && setApproveModal(defaultApproveModal)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }} />
          <div style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: 16, padding: "28px 32px", width: "min(480px,94vw)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            {/* Icon */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: approveModal.isApproved ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#ef4444,#dc2626)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 32
              }}>
                {approveModal.isApproved ? "✓" : "✕"}
              </div>
            </div>

            <h3 style={{ textAlign: "center", margin: "0 0 6px", fontSize: 18, color: "#1f2937" }}>
              {approveModal.isApproved ? "Xác nhận duyệt kho" : "Xác nhận từ chối kho"}
            </h3>
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, margin: "0 0 20px" }}>
              {approveModal.isApproved
                ? <>Bạn sắp phê duyệt kho <strong>"{approveModal.warehouseName}"</strong>. Kho sẽ hiển thị công khai trên hệ thống.</>
                : <>Bạn sắp từ chối kho <strong>"{approveModal.warehouseName}"</strong>.</>}
            </p>

            {!approveModal.isApproved && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>
                  Lý do từ chối <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  className="admin-textarea"
                  rows={4}
                  value={approveModal.reason}
                  onChange={e => setApproveModal(p => ({ ...p, reason: e.target.value }))}
                  placeholder="Mô tả rõ lý do để chủ kho có thể chỉnh sửa và nộp lại..."
                  style={{ resize: "vertical" }}
                />
                {!approveModal.reason.trim() && (
                  <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>Lý do từ chối là bắt buộc</div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button
                style={{ flex: 1, padding: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                onClick={() => setApproveModal(defaultApproveModal)}
                disabled={approveModal.loading}>
                Hủy
              </button>
              <button
                style={approveModal.isApproved ? { flex: 1, padding: "10px", background: "#10b981", border: "1px solid #059669", borderRadius: "8px", color: "#fff", fontWeight: 700, cursor: "pointer" } : { flex: 1, padding: "10px", background: "#ef4444", border: "1px solid #dc2626", borderRadius: "8px", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                onClick={handleApproveSubmit}
                disabled={approveModal.loading || (!approveModal.isApproved && !approveModal.reason.trim())}>
                {approveModal.loading ? "Đang xử lý..." : approveModal.isApproved ? "Phê duyệt" : "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .admin-input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; outline: none; width: 100%; box-sizing: border-box; }
        .admin-input:focus { border-color: #0095c7; box-shadow: 0 0 0 3px rgba(0,149,199,0.1); }
        .admin-textarea { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; outline: none; width: 100%; box-sizing: border-box; font-family: inherit; }
        .admin-textarea:focus { border-color: #0095c7; box-shadow: 0 0 0 3px rgba(0,149,199,0.1); }
        .admin-spinner { border: 3px solid #f3f4f6; border-top-color: #0095c7; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

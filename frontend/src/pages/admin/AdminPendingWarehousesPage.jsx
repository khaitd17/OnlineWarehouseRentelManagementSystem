import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, CheckCircle, XCircle, Search, RefreshCw,
  Warehouse, User, FileText, Image, MapPin, Maximize2, X,
  ExternalLink, ChevronLeft, ChevronRight, Inbox,
} from "lucide-react";
import adminService from "../../services/adminService";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../components/Toast";

const BASE_URL = "http://localhost:5276";

const DOC_TYPE_LABELS = {
  BUSINESS_LICENSE: "Giấy phép kinh doanh",
  FIRE_SAFETY: "Phòng cháy chữa cháy",
  LAND_USE_RIGHT: "Quyền sử dụng đất",
  CONSTRUCTION_PERMIT: "Giấy phép xây dựng",
  ENVIRONMENTAL: "Chứng nhận môi trường",
  INSURANCE: "Bảo hiểm",
  OTHER: "Khác",
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
      <div className="admin-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", borderRadius: 10, padding: "8px 10px", display: "flex" }}>
            <Clock size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Duyệt kho bãi</h1>
            <p style={{ margin: 0 }}>Xem xét và phê duyệt các kho chờ đăng ký từ chủ kho</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!loading && (
            <span style={{ background: "#fef3c7", color: "#d97706", borderRadius: 20, padding: "6px 16px", fontWeight: 700, fontSize: 15 }}>
              {data.totalCount} kho đang chờ
            </span>
          )}
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} style={{ marginRight: 4 }} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
          <input
            className="admin-input"
            placeholder="Tìm kiếm theo tên kho, địa chỉ, chủ kho..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            style={{ paddingLeft: 38, width: "100%" }}
          />
        </div>
        <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={handleSearch}>Tìm kiếm</button>
        {filters.search && (
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => { setSearchInput(""); setFilters(p => ({ ...p, search: "", page: 1 })); }}>
            Xóa bộ lọc
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
        <div style={{ textAlign: "center", padding: 80, background: "#fff", borderRadius: 12, border: "1px dashed #d1d5db" }}>
          <Inbox size={48} style={{ color: "#9ca3af", marginBottom: 12 }} />
          <div style={{ fontSize: 17, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Không có kho nào chờ duyệt</div>
          <div style={{ color: "#9ca3af", fontSize: 14 }}>Tất cả yêu cầu đã được xử lý.</div>
        </div>
      ) : (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 55 }}>ID</th>
                  <th style={{ width: 130 }}>LOẠI</th>
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
                    {/* Submission type badge */}
                    <td>
                      {row.submissionType === "PRICE_UPDATE" ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 10px", borderRadius: 20,
                          background: "#fef3c7", color: "#92400e",
                          fontSize: 12, fontWeight: 700, border: "1px solid #fde68a",
                          whiteSpace: "nowrap",
                        }}>
                          Thay đổi giá
                        </span>
                      ) : (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 10px", borderRadius: 20,
                          background: "#dbeafe", color: "#1e40af",
                          fontSize: 12, fontWeight: 700, border: "1px solid #bfdbfe",
                          whiteSpace: "nowrap",
                        }}>
                          🆕 Kho mới
                        </span>
                      )}
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
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#6b7280", fontSize: 13 }}>
                        <MapPin size={12} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.address}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#1f2937" }}>{row.totalArea} m²</span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, background: row.mediaCount > 0 ? "#eff6ff" : "#f9fafb", color: row.mediaCount > 0 ? "#2563eb" : "#9ca3af", padding: "3px 8px", borderRadius: 12, fontWeight: 500 }}>
                        <Image size={12} /> {row.mediaCount}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, background: row.documentCount > 0 ? "#f0fdf4" : "#f9fafb", color: row.documentCount > 0 ? "#16a34a" : "#9ca3af", padding: "3px 8px", borderRadius: 12, fontWeight: 500 }}>
                        <FileText size={12} /> {row.documentCount}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString("vi-VN") : "—"}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          className="admin-btn admin-btn-sm admin-btn-outline"
                          onClick={() => openDetail(row)}
                          title="Xem chi tiết">
                          <Maximize2 size={12} style={{ marginRight: 4 }} /> Xem
                        </button>
                        <button
                          className="admin-btn admin-btn-sm admin-btn-success"
                          onClick={() => setApproveModal({ open: true, warehouseId: row.warehouseId, warehouseName: row.name, isApproved: true, reason: "", loading: false })}
                          title="Duyệt kho">
                          <CheckCircle size={12} style={{ marginRight: 4 }} /> Duyệt
                        </button>
                        <button
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => setApproveModal({ open: true, warehouseId: row.warehouseId, warehouseName: row.name, isApproved: false, reason: "", loading: false })}
                          title="Từ chối">
                          <XCircle size={12} style={{ marginRight: 4 }} /> Từ chối
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
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <button className="admin-btn admin-btn-sm admin-btn-outline" disabled={data.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, color: "#6b7280" }}>Trang {data.page}/{data.totalPages} ({data.totalCount} kết quả)</span>
          <button className="admin-btn admin-btn-sm admin-btn-outline" disabled={data.page >= data.totalPages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>
            <ChevronRight size={14} />
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
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Warehouse size={18} color="#0095c7" />
                <span style={{ fontWeight: 700, fontSize: 16, color: "#1f2937" }}>
                  {detailModal.loading ? "Đang tải..." : wh?.name}
                </span>
                {!detailModal.loading && <StatusBadge status={wh?.status} />}
              </div>
              <button
                onClick={() => setDetailModal({ open: false, warehouse: null, loading: false })}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4 }}>
                <X size={20} />
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
                    <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => navigate(`/admin/warehouses/${wh.warehouseId}`)}>
                      <ExternalLink size={12} style={{ marginRight: 4 }} /> Trang chi tiết
                    </button>
                  </div>

                  {/* Basic Info Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                    {[
                      ["Địa chỉ", wh.address],
                      ["Loại kho", wh.warehouseType || "Khác"],
                      ["Diện tích tổng", `${wh.totalArea} m²`],
                      ["Diện tích khả dụng", `${wh.availableArea} m²`],
                      ["Giờ hoạt động", wh.operatingHours || (wh.is24HoursAccess ? "24/7" : "—")],
                      ["Ngày tạo", wh.createdAt ? new Date(wh.createdAt).toLocaleDateString("vi-VN") : "—"],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 14px", border: "1px solid #f3f4f6" }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#1f2937" }}>{value}</div>
                      </div>
                    ))}

                    {/* Giá thuê/m² — full-width highlighted */}
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
                          Giá thuê / m² / tháng
                        </div>
                        {wh.pricePerM2 ? (
                          <div style={{ fontSize: 20, fontWeight: 900, color: "#065f46" }}>
                            {new Intl.NumberFormat("vi-VN").format(wh.pricePerM2)}&nbsp;<span style={{ fontSize: 13, fontWeight: 600, color: "#047857" }}>₫/m²</span>
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

                  {/* ── Pending Change Note (PRICE_UPDATE submissions only) ── */}
                  {wh.pendingChangeNote && (
                    <div style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      background: "linear-gradient(135deg,#fffbeb,#fef3c7)",
                      border: "1.5px solid #f59e0b", borderRadius: 12,
                      padding: "14px 16px", marginBottom: 18,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg,#fde68a,#fbbf24)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18,
                      }}>⚠️</div>
                      <div>
                        <div style={{ fontWeight: 800, color: "#92400e", fontSize: 13, marginBottom: 4 }}>
                          Yêu cầu thay đổi cần duyệt
                        </div>
                        <div style={{ color: "#78350f", fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
                          {wh.pendingChangeNote}
                        </div>
                        <div style={{ fontSize: 11, color: "#b45309", marginTop: 4 }}>
                          Chủ kho đã thay đổi thông tin kho đã được phê duyệt trước đó. Vui lòng xem xét và quyết định duyệt hoặc từ chối.
                        </div>
                      </div>
                    </div>
                  )}

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
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        <Image size={14} color="#0095c7" /> Hình ảnh & Video ({wh.media.length})
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
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        <FileText size={14} color="#10b981" /> Giấy tờ pháp lý ({wh.documents.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {wh.documents.map(doc => (
                          <div key={doc.documentId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f9fafb", borderRadius: 8, padding: "10px 14px", border: "1px solid #e5e7eb" }}>
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 13, color: "#1f2937" }}>
                                {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                              </div>
                              {doc.documentNumber && <div style={{ fontSize: 11, color: "#9ca3af" }}>Số: {doc.documentNumber}</div>}
                              {doc.expiryDate && <div style={{ fontSize: 11, color: "#f59e0b" }}>Hết hạn: {doc.expiryDate}</div>}
                            </div>
                            <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer"
                              className="admin-btn admin-btn-sm admin-btn-outline"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <ExternalLink size={11} /> Xem
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Panel Footer — Action Buttons */}
            {!detailModal.loading && wh?.status === "PENDING" && (
              <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 12, flexShrink: 0, background: "#fafafa" }}>
                <button
                  className="admin-btn admin-btn-danger"
                  style={{ flex: 1 }}
                  onClick={() => setApproveModal({ open: true, warehouseId: wh.warehouseId, warehouseName: wh.name, isApproved: false, reason: "", loading: false })}>
                  <XCircle size={14} style={{ marginRight: 6 }} /> Từ chối kho này
                </button>
                <button
                  className="admin-btn admin-btn-success"
                  style={{ flex: 1 }}
                  onClick={() => setApproveModal({ open: true, warehouseId: wh.warehouseId, warehouseName: wh.name, isApproved: true, reason: "", loading: false })}>
                  <CheckCircle size={14} style={{ marginRight: 6 }} /> Duyệt kho này
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
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                {approveModal.isApproved ? <CheckCircle size={28} color="#fff" /> : <XCircle size={28} color="#fff" />}
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
                className="admin-btn admin-btn-outline"
                style={{ flex: 1 }}
                onClick={() => setApproveModal(defaultApproveModal)}
                disabled={approveModal.loading}>
                Hủy
              </button>
              <button
                className={`admin-btn ${approveModal.isApproved ? "admin-btn-success" : "admin-btn-danger"}`}
                style={{ flex: 1 }}
                onClick={handleApproveSubmit}
                disabled={approveModal.loading || (!approveModal.isApproved && !approveModal.reason.trim())}>
                {approveModal.loading ? "Đang xử lý..." : approveModal.isApproved ? "✓ Phê duyệt" : "✕ Từ chối"}
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

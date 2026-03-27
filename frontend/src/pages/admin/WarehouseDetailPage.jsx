import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Ruler, Star, FileText, Image, User, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import adminService from "../../services/adminService";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";

const DOC_TYPE_LABELS = {
  BUSINESS_LICENSE: "Giấy phép kinh doanh",
  FIRE_SAFETY: "Phòng cháy chữa cháy",
  LAND_USE_RIGHT: "Quyền sử dụng đất",
  CONSTRUCTION_PERMIT: "Giấy phép xây dựng",
  ENVIRONMENTAL: "Chứng nhận môi trường",
  INSURANCE: "Bảo hiểm",
  OTHER: "Khác",
};

const API_BASE = "http://localhost:5276";
const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? url : "/" + url}`;
};

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [wh, setWh] = useState(null);
  const [loading, setLoading] = useState(true);
  const defaultApproveModal = { open: false, isApproved: true, reason: "", loading: false };
  const [approveModal, setApproveModal] = useState(defaultApproveModal);

  useEffect(() => { fetchDetail(); }, [id]); // eslint-disable-line

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await adminService.getWarehouseDetail(id);
      if (res.data.success) setWh(res.data.data);
      else showToast(res.data.message, "error");
    } catch { showToast("Không thể tải chi tiết kho", "error"); }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!approveModal.isApproved && !approveModal.reason.trim()) { showToast("Vui lòng nhập lý do từ chối", "error"); return; }
    setApproveModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.approveWarehouse(id, { isApproved: approveModal.isApproved, rejectionReason: approveModal.isApproved ? null : approveModal.reason });
      if (res.data.success) { showToast(res.data.message); fetchDetail(); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setApproveModal(defaultApproveModal);
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Đang tải...</div>;
  if (!wh) return <div style={{ textAlign: "center", padding: 60, color: "#ef4444" }}>Không tìm thấy kho.</div>;

  const occupancyRate = wh.totalArea > 0 ? Math.round((wh.totalArea - wh.availableArea) / wh.totalArea * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => navigate("/admin/warehouses")} style={{ marginBottom: 10 }}>
            <ArrowLeft size={14} style={{ marginRight: 4 }} /> Quay lại
          </button>
          <h1>{wh.name}</h1>
          <p style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280" }}>
            <MapPin size={14} /> {wh.address}
          </p>
        </div>
        <div className="admin-btn-group">
          {wh.status === "PENDING" && (
            <>
              <button className="admin-btn admin-btn-success" onClick={() => setApproveModal({ ...defaultApproveModal, open: true, isApproved: true })}>
                <CheckCircle size={14} style={{ marginRight: 4 }} /> Duyệt kho
              </button>
              <button className="admin-btn admin-btn-danger" onClick={() => setApproveModal({ ...defaultApproveModal, open: true, isApproved: false })}>
                <XCircle size={14} style={{ marginRight: 4 }} /> Từ chối
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Main Info */}
        <div>
          {/* Warehouse Info Card */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>Thông tin kho</h3></div>
            <div className="admin-card-body">
              <div className="admin-detail-grid">
                <div className="admin-detail-item"><div className="admin-detail-label">Trạng thái</div><StatusBadge status={wh.status} /></div>
                <div className="admin-detail-item"><div className="admin-detail-label">Diện tích tổng</div><div className="admin-detail-value">{wh.totalArea} m²</div></div>
                <div className="admin-detail-item"><div className="admin-detail-label">Diện tích khả dụng</div><div className="admin-detail-value">{wh.availableArea} m²</div></div>
                <div className="admin-detail-item">
                  <div className="admin-detail-label">Giá thuê/m² (VNĐ/tháng)</div>
                  <div className="admin-detail-value">
                    {wh.pricePerM2 ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "linear-gradient(135deg,#ecfdf5,#d1fae5)",
                        color: "#065f46", fontWeight: 800, fontSize: 14,
                        padding: "4px 10px", borderRadius: 8,
                        border: "1px solid #a7f3d0"
                      }}>
                        💰 {new Intl.NumberFormat("vi-VN").format(wh.pricePerM2)} ₫/m²
                      </span>
                    ) : <span style={{ color: "#9ca3af" }}>Chưa cập nhật</span>}
                  </div>
                </div>
                <div className="admin-detail-item"><div className="admin-detail-label">Tỷ lệ lấp đầy</div>
                  <div className="admin-detail-value">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${occupancyRate}%`, height: "100%", background: occupancyRate > 80 ? "#ef4444" : occupancyRate > 50 ? "#f59e0b" : "#10b981", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{occupancyRate}%</span>
                    </div>
                  </div>
                </div>
                <div className="admin-detail-item"><div className="admin-detail-label">Giờ hoạt động</div><div className="admin-detail-value"><Clock size={13} style={{ marginRight: 4 }} />{wh.operatingHours || "—"}</div></div>
                {wh.lat && wh.lng && (
                  <div className="admin-detail-item"><div className="admin-detail-label">Tọa độ</div><div className="admin-detail-value">{wh.lat}, {wh.lng}</div></div>
                )}
                <div className="admin-detail-item"><div className="admin-detail-label">Ngày tạo</div><div className="admin-detail-value">{wh.createdAt ? new Date(wh.createdAt).toLocaleDateString("vi-VN") : "—"}</div></div>
                <div className="admin-detail-item"><div className="admin-detail-label">Cập nhật lần cuối</div><div className="admin-detail-value">{wh.updatedAt ? new Date(wh.updatedAt).toLocaleDateString("vi-VN") : "—"}</div></div>
                <div className="admin-detail-item"><div className="admin-detail-label">Ngày duyệt</div><div className="admin-detail-value">{wh.approvedAt ? new Date(wh.approvedAt).toLocaleDateString("vi-VN") : "—"}</div></div>
                {wh.approvedByName && <div className="admin-detail-item"><div className="admin-detail-label">Người duyệt</div><div className="admin-detail-value">{wh.approvedByName}</div></div>}
                {wh.rejectionReason && <div className="admin-detail-item" style={{ gridColumn: "1 / -1" }}><div className="admin-detail-label">Lý do từ chối</div><div className="admin-detail-value" style={{ color: "#ef4444" }}>{wh.rejectionReason}</div></div>}
              </div>
              {wh.description && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
                  <div className="admin-detail-label">Mô tả</div>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{wh.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Media */}
          {wh.media && wh.media.length > 0 && (
            <div className="admin-card">
              <div className="admin-card-header"><h3><Image size={16} style={{ marginRight: 6 }} />Hình ảnh / Video ({wh.media.length})</h3></div>
              <div className="admin-card-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                  {wh.media.map(m => (
                    <div key={m.mediaId} style={{ border: "1px solid #e5e7eb", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                      {m.mediaType === "VIDEO" ? (
                        <video src={resolveUrl(m.mediaUrl)} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} controls />
                      ) : (
                        <img
                          src={resolveUrl(m.mediaUrl)}
                          alt=""
                          style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", background: "#f3f4f6" }}
                          onError={e => { e.target.src = ""; e.target.style.display = "none"; }}
                        />
                      )}
                      {m.isPrimary && (
                        <span style={{ position: "absolute", top: 4, left: 4, background: "#0095c7", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Chính</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {wh.documents && wh.documents.length > 0 && (
            <div className="admin-card">
              <div className="admin-card-header"><h3><FileText size={16} style={{ marginRight: 6 }} />Giấy tờ / Chứng nhận ({wh.documents.length})</h3></div>
              <div className="admin-card-body" style={{ padding: 0 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Loại</th>
                      <th>Số hiệu</th>
                      <th>Ngày cấp</th>
                      <th>Hết hạn</th>
                      <th>Trạng thái</th>
                      <th>Xác minh bởi</th>
                      <th>Tệp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wh.documents.map(doc => (
                      <tr key={doc.documentId}>
                        <td style={{ fontWeight: 500 }}>{DOC_TYPE_LABELS[doc.documentType] || doc.documentType}</td>
                        <td>{doc.documentNumber || "—"}</td>
                        <td>{doc.issuedDate || "—"}</td>
                        <td>{doc.expiryDate || "—"}</td>
                        <td><StatusBadge status={doc.status} /></td>
                        <td>{doc.verifiedByName || "—"}</td>
                        <td>
                          <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-sm admin-btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <ExternalLink size={12} /> Xem
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Owner Info */}
          <div className="admin-card">
            <div className="admin-card-header"><h3><User size={16} style={{ marginRight: 6 }} />Chủ kho</h3></div>
            <div className="admin-card-body">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #0095c7, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>
                  {(wh.owner.fullName || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1f2937" }}>{wh.owner.fullName}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Chủ sở hữu</div>
                </div>
              </div>
              <div className="admin-detail-item"><div className="admin-detail-label">Email</div><div className="admin-detail-value">{wh.owner.email}</div></div>
              <div className="admin-detail-item"><div className="admin-detail-label">Số điện thoại</div><div className="admin-detail-value">{wh.owner.phone || "—"}</div></div>
            </div>
          </div>

          {/* Rating */}
          <div className="admin-card">
            <div className="admin-card-header"><h3><Star size={16} style={{ marginRight: 6 }} />Đánh giá</h3></div>
            <div className="admin-card-body" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#1f2937" }}>{wh.ratingSummary.averageRating ? wh.ratingSummary.averageRating.toFixed(1) : "—"}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 4 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={18} fill={s <= Math.round(wh.ratingSummary.averageRating || 0) ? "#f59e0b" : "none"} stroke={s <= Math.round(wh.ratingSummary.averageRating || 0) ? "#f59e0b" : "#d1d5db"} />
                ))}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>{wh.ratingSummary.totalRatings} đánh giá</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>Thống kê nhanh</h3></div>
            <div className="admin-card-body">
              <div className="admin-detail-item"><div className="admin-detail-label">Hình ảnh</div><div className="admin-detail-value">{wh.media?.length || 0}</div></div>
              <div className="admin-detail-item"><div className="admin-detail-label">Giấy tờ</div><div className="admin-detail-value">{wh.documents?.length || 0}</div></div>
              <div className="admin-detail-item"><div className="admin-detail-label">Tỷ lệ sử dụng</div><div className="admin-detail-value">{occupancyRate}%</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve/Reject Modal */}
      <Modal isOpen={approveModal.open} onClose={() => setApproveModal(defaultApproveModal)} title={approveModal.isApproved ? "Duyệt kho" : "Từ chối kho"}
        footer={<>
          <button className="admin-btn admin-btn-outline" onClick={() => setApproveModal(defaultApproveModal)} disabled={approveModal.loading}>Hủy</button>
          <button className={`admin-btn ${approveModal.isApproved ? "admin-btn-success" : "admin-btn-danger"}`} onClick={handleApprove} disabled={approveModal.loading}>
            {approveModal.loading ? "Đang xử lý..." : approveModal.isApproved ? "Xác nhận duyệt" : "Xác nhận từ chối"}
          </button>
        </>}>
        {approveModal.isApproved ? (
          <p style={{ fontSize: 14, color: "#374151" }}>Bạn có chắc chắn muốn duyệt kho <strong>{wh.name}</strong>?</p>
        ) : (
          <div className="admin-form-group">
            <label>Lý do từ chối *</label>
            <textarea className="admin-textarea" value={approveModal.reason} onChange={(e) => setApproveModal(p => ({ ...p, reason: e.target.value }))} placeholder="Nhập lý do từ chối..." />
            {!approveModal.reason.trim() && <div className="error-text">Lý do từ chối là bắt buộc</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}

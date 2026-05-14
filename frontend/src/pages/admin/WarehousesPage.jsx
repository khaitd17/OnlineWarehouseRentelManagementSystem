import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";
import BaseTable from "../../components/BaseTable";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import { RefreshCw } from "lucide-react";

export default function WarehousesPage() {
  const showToast = useToast();
  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(""); // "" = all
  const [data, setData] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", status: "", page: 1, pageSize: 10, sortBy: "createdAt", sortOrder: "desc" });

  const defaultApproveModal = { open: false, warehouse: null, isApproved: true, reason: "", loading: false };
  const [approveModal, setApproveModal] = useState(defaultApproveModal);
  const defaultListingConfirm = { open: false, warehouse: null, action: "", loading: false };
  const [listingConfirm, setListingConfirm] = useState(defaultListingConfirm);

  useEffect(() => {
    adminService.getOwners()
      .then(r => { if (r.data.success) setOwners(r.data.data); })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.status) delete params.status;
      if (!params.search) delete params.search;

      let res;
      if (selectedOwner) {
        res = await adminService.getWarehousesByOwner(selectedOwner, params);
      } else {
        res = await adminService.getAllWarehouses(params);
      }
      if (res.data.success) setData(res.data.data);
    } catch {
      showToast("Lỗi khi tải danh sách kho", "error");
    }
    setLoading(false);
  }, [selectedOwner, filters, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  const handleSort = (sortBy, sortOrder) => setFilters(prev => ({ ...prev, sortBy, sortOrder }));

  const handleApproveSubmit = async () => {
    if (!approveModal.isApproved && !approveModal.reason.trim()) {
      showToast("Vui lòng nhập lý do từ chối", "error"); return;
    }
    setApproveModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.approveWarehouse(approveModal.warehouse.warehouseId, {
        isApproved: approveModal.isApproved, rejectionReason: approveModal.isApproved ? null : approveModal.reason,
      });
      if (res.data.success) {
        showToast(res.data.message);
        window.dispatchEvent(new Event("pendingWarehousesChanged"));
        fetchData();
      } else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setApproveModal(defaultApproveModal);
  };

  const handleListingConfirm = async () => {
    setListingConfirm(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.manageListing(listingConfirm.warehouse.warehouseId, listingConfirm.action);
      if (res.data.success) { showToast(res.data.message); fetchData(); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setListingConfirm(defaultListingConfirm);
  };

  const columns = [
    { key: "warehouseId", label: "ID", width: "55px", render: v => <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>#{String(v).padStart(4,"0")}</span> },
    { key: "name", label: "Tên kho", sortable: true, render: (v, row) => (
      <div>
        <span style={{ color: "#0095c7", cursor: "pointer", fontWeight: 600, display: "block" }} onClick={() => navigate(`/admin/warehouses/${row.warehouseId}`)}>{v}</span>
        <div style={{ display: "inline-block", background: "#f1f5f9", color: "#475569", fontSize: 11, padding: "2px 6px", borderRadius: 4, fontWeight: 500, marginTop: 4 }}>
          {row.warehouseType || "Khác"}
        </div>
      </div>
    )},
    // Show owner info when listing all warehouses
    ...(!selectedOwner ? [{
      key: "ownerName", label: "Chủ kho", render: (v, row) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{v || "—"}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>{row.ownerEmail || ""}</div>
        </div>
      )
    }] : []),
    { key: "address", label: "Địa chỉ", render: v => <span style={{ maxWidth: 180, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span> },
    { key: "totalArea", label: "diện tích", sortable: true, render: v => `${v} m²` },
    { key: "availableArea", label: "Khả dụng", sortable: true, render: v => `${v} m²` },
    { key: "status", label: "Trạng thái", sortable: true, render: v => <StatusBadge status={v} /> },
    { key: "occupancyRate", label: "Lấp đầy", sortable: true, render: v => (
      <span style={{ fontWeight: 600, color: v > 80 ? "#ef4444" : v > 50 ? "#f59e0b" : "#10b981" }}>{v}%</span>
    )},
    { key: "createdAt", label: "Ngày tạo", sortable: true, render: v => v ? new Date(v).toLocaleDateString("vi-VN") : "—" },
    { key: "actions", label: "Thao tác", sortable: false, render: (_, row) => (
      <div className="admin-btn-group">
        <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={() => navigate(`/admin/warehouses/${row.warehouseId}`)}>Chi tiết</button>
        {row.status === "PENDING" && (<>
          <button className="admin-btn admin-btn-sm admin-btn-success" onClick={() => setApproveModal({ open: true, warehouse: row, isApproved: true, reason: "", loading: false })}>Duyệt</button>
          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setApproveModal({ open: true, warehouse: row, isApproved: false, reason: "", loading: false })}>Từ chối</button>
        </>)}
        {row.status === "APPROVED" && (
          <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => setListingConfirm({ open: true, warehouse: row, action: "HIDE", loading: false })}>Ẩn</button>
        )}
        {row.status === "HIDDEN" && (
          <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => setListingConfirm({ open: true, warehouse: row, action: "SHOW", loading: false })}>Hiện</button>
        )}
        {row.status !== "DELETED" && (
          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setListingConfirm({ open: true, warehouse: row, action: "DELETE", loading: false })}>Xóa</button>
        )}
      </div>
    )},
  ];


  return (
    <div>
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Quản lý kho bãi</h1>
          <p>
            {selectedOwner
              ? `Xem kho của: ${owners.find(o => String(o.userId) === String(selectedOwner))?.fullName || "..."}`
              : `Tổng cộng ${data.totalCount} kho bãi trong hệ thống`}
          </p>
        </div>
        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={fetchData} disabled={loading}>
          <RefreshCw size={13} style={{ marginRight: 4 }} />Làm mới
        </button>
      </div>

      {/* ── Unified filter row ── */}
      <div style={{
        display: "flex", gap: 10, alignItems: "center", marginBottom: 18,
        flexWrap: "wrap", background: "#fff", padding: "14px 16px",
        borderRadius: 12, border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
      }}>
        {/* Owner filter */}
        <div style={{ position: "relative", flex: "0 0 auto" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17, verticalAlign: "middle" }}>person</span>
          </span>
          <select
            value={selectedOwner}
            onChange={e => { setSelectedOwner(e.target.value); setFilters(p => ({ ...p, page: 1 })); }}
            style={{
              paddingLeft: 32, paddingRight: 28, height: 38, minWidth: 230,
              border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13.5,
              color: "#374151", background: "#fafafa", outline: "none", cursor: "pointer",
              appearance: "none", WebkitAppearance: "none",
            }}
            onFocus={e => e.target.style.borderColor = "#0284c7"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          >
            <option value="">Tất cả chủ kho</option>
            {owners.map(o => (
              <option key={o.userId} value={o.userId}>{o.fullName} — {o.email}</option>
            ))}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>expand_more</span>
          </span>
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 200 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17, verticalAlign: "middle" }}>search</span>
          </span>
          <input
            type="text"
            value={filters.search}
            onChange={e => handleFilter("search", e.target.value)}
            placeholder="Tìm theo tên, địa chỉ, chủ kho..."
            style={{
              width: "100%", boxSizing: "border-box",
              paddingLeft: 34, paddingRight: 12, height: 38,
              border: "1.5px solid #e5e7eb", borderRadius: 8,
              fontSize: 13.5, color: "#374151", background: "#fafafa", outline: "none",
            }}
            onFocus={e => e.target.style.borderColor = "#0284c7"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />
        </div>

        {/* Status filter */}
        <div style={{ position: "relative", flex: "0 0 auto" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17, verticalAlign: "middle" }}>filter_list</span>
          </span>
          <select
            value={filters.status}
            onChange={e => handleFilter("status", e.target.value)}
            style={{
              paddingLeft: 32, paddingRight: 28, height: 38, minWidth: 160,
              border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13.5,
              color: filters.status ? "#374151" : "#9ca3af",
              background: "#fafafa", outline: "none", cursor: "pointer",
              appearance: "none", WebkitAppearance: "none",
            }}
            onFocus={e => e.target.style.borderColor = "#0284c7"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">⏳ Chờ duyệt</option>
            <option value="APPROVED">✅ Đã duyệt</option>
            <option value="REJECTED">❌ Từ chối</option>
            <option value="HIDDEN">🙈 Đã ẩn</option>
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>expand_more</span>
          </span>
        </div>

        {/* Reset */}
        {(filters.search || filters.status || selectedOwner) && (
          <button
            onClick={() => { setFilters(p => ({ ...p, search: "", status: "", page: 1 })); setSelectedOwner(""); }}
            style={{
              height: 38, padding: "0 14px", border: "1.5px solid #fca5a5",
              borderRadius: 8, background: "#fff1f2", color: "#ef4444",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            Xóa lọc
          </button>
        )}
      </div>

      <BaseTable
        columns={columns}
        data={data.items}
        loading={loading}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={handleSort}
        emptyText="Không có kho nào phù hợp với bộ lọc."
      />
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        totalCount={data.totalCount}
        totalPages={data.totalPages}
        onPageChange={p => setFilters(prev => ({ ...prev, page: p }))}
      />

      {/* Approve/Reject Modal */}
      <Modal
        isOpen={approveModal.open}
        onClose={() => setApproveModal(defaultApproveModal)}
        title={approveModal.isApproved ? "Duyệt kho" : "Từ chối kho"}
        footer={<>
          <button className="admin-btn admin-btn-outline" onClick={() => setApproveModal(defaultApproveModal)} disabled={approveModal.loading}>Hủy</button>
          <button className={`admin-btn ${approveModal.isApproved ? "admin-btn-success" : "admin-btn-danger"}`} onClick={handleApproveSubmit} disabled={approveModal.loading}>
            {approveModal.loading ? "Đang xử lý..." : (approveModal.isApproved ? "Xác nhận duyệt" : "Xác nhận từ chối")}
          </button>
        </>}>
        <p style={{ margin: "0 0 12px", fontSize: 14 }}>
          {approveModal.isApproved
            ? `Bạn có chắc muốn duyệt kho "${approveModal.warehouse?.name}"?`
            : `Bạn có chắc muốn từ chối kho "${approveModal.warehouse?.name}"?`}
        </p>
        {!approveModal.isApproved && (
          <div className="admin-form-group">
            <label>Lý do từ chối *</label>
            <textarea className="admin-textarea" value={approveModal.reason} onChange={e => setApproveModal(p => ({ ...p, reason: e.target.value }))} placeholder="Nhập lý do từ chối..." />
            {!approveModal.reason.trim() && <div className="error-text">Lý do từ chối là bắt buộc</div>}
          </div>
        )}
      </Modal>

      {/* Listing Confirm */}
      <ConfirmDialog
        isOpen={listingConfirm.open}
        onClose={() => setListingConfirm(defaultListingConfirm)}
        onConfirm={handleListingConfirm}
        title={listingConfirm.action === "DELETE" ? "Xóa kho" : listingConfirm.action === "HIDE" ? "Ẩn kho" : "Hiện kho"}
        message={
          listingConfirm.action === "DELETE"
            ? `Bạn có chắc muốn xóa kho "${listingConfirm.warehouse?.name}"? Hành động này không thể hoàn tác.`
            : listingConfirm.action === "HIDE"
            ? `Bạn có chắc muốn ẩn kho "${listingConfirm.warehouse?.name}"?`
            : `Bạn có chắc muốn hiện kho "${listingConfirm.warehouse?.name}"?`
        }
        confirmText={listingConfirm.action === "DELETE" ? "Xóa kho" : listingConfirm.action === "HIDE" ? "Ẩn kho" : "Hiện kho"}
        confirmClass={listingConfirm.action === "DELETE" ? "admin-btn-danger" : listingConfirm.action === "HIDE" ? "admin-btn-warning" : "admin-btn-primary"}
        loading={listingConfirm.loading}
      />
    </div>
  );
}


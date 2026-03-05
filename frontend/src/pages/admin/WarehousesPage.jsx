import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";
import BaseTable from "../../components/BaseTable";
import FilterBar from "../../components/FilterBar";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";

export default function WarehousesPage() {
  const showToast = useToast();
  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [data, setData] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", status: "", page: 1, pageSize: 10, sortBy: "createdAt", sortOrder: "desc" });

  // Approve/Reject
  const defaultApproveModal = { open: false, warehouse: null, isApproved: true, reason: "", loading: false };
  const [approveModal, setApproveModal] = useState(defaultApproveModal);
  // Listing
  const defaultListingConfirm = { open: false, warehouse: null, action: "", loading: false };
  const [listingConfirm, setListingConfirm] = useState(defaultListingConfirm);

  useEffect(() => { adminService.getOwners().then(r => { if (r.data.success) setOwners(r.data.data); }).catch(() => {}); }, []);

  const fetchData = useCallback(async () => {
    if (!selectedOwner) { setData({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 }); setLoading(false); return; }
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.status) delete params.status;
      if (!params.search) delete params.search;
      const res = await adminService.getWarehousesByOwner(selectedOwner, params);
      if (res.data.success) setData(res.data.data);
    } catch { showToast("Lỗi khi tải danh sách kho", "error"); }
    setLoading(false);
  }, [selectedOwner, filters, showToast]);

  useEffect(() => { if (selectedOwner) fetchData(); }, [fetchData, selectedOwner]);

  const handleFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  const handleSort = (sortBy, sortOrder) => setFilters(prev => ({ ...prev, sortBy, sortOrder }));

  // Approve/Reject handler
  const handleApproveSubmit = async () => {
    if (!approveModal.isApproved && !approveModal.reason.trim()) {
      showToast("Vui lòng nhập lý do từ chối", "error"); return;
    }
    setApproveModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.approveWarehouse(approveModal.warehouse.warehouseId, {
        isApproved: approveModal.isApproved, rejectionReason: approveModal.isApproved ? null : approveModal.reason,
      });
      if (res.data.success) { showToast(res.data.message); fetchData(); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setApproveModal({ open: false, warehouse: null, isApproved: true, reason: "", loading: false });
  };

  // Listing handler
  const handleListingConfirm = async () => {
    setListingConfirm(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.manageListing(listingConfirm.warehouse.warehouseId, listingConfirm.action);
      if (res.data.success) { showToast(res.data.message); fetchData(); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setListingConfirm({ open: false, warehouse: null, action: "", loading: false });
  };

  const columns = [
    { key: "warehouseId", label: "ID", width: "60px" },
    { key: "name", label: "Tên kho", sortable: true, render: (v, row) => (
      <span style={{ color: "#0095c7", cursor: "pointer", fontWeight: 500 }} onClick={() => navigate(`/admin/warehouses/${row.warehouseId}`)}>{v}</span>
    )},
    { key: "address", label: "Địa chỉ", render: (v) => <span style={{ maxWidth: 200, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span> },
    { key: "totalArea", label: "Diện tích", sortable: true, render: (v) => `${v} m²` },
    { key: "availableArea", label: "Khả dụng", sortable: true, render: (v) => `${v} m²` },
    { key: "status", label: "Trạng thái", sortable: true, render: (v) => <StatusBadge status={v} /> },
    { key: "createdAt", label: "Ngày tạo", sortable: true, render: (v) => v ? new Date(v).toLocaleDateString("vi-VN") : "—" },
    { key: "actions", label: "Thao tác", sortable: false, render: (_, row) => (
      <div className="admin-btn-group">
        <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={() => navigate(`/admin/warehouses/${row.warehouseId}`)}>Chi tiết</button>
        {row.status === "PENDING" && (
          <>
            <button className="admin-btn admin-btn-sm admin-btn-success" onClick={() => setApproveModal({ open: true, warehouse: row, isApproved: true, reason: "", loading: false })}>Duyệt</button>
            <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setApproveModal({ open: true, warehouse: row, isApproved: false, reason: "", loading: false })}>Từ chối</button>
          </>
        )}
        {row.status === "APPROVED" && (
          <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => setListingConfirm({ open: true, warehouse: row, action: "HIDE", loading: false })}>Ẩn</button>
        )}
        {row.status === "HIDDEN" && (
          <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => setListingConfirm({ open: true, warehouse: row, action: "SHOW", loading: false })}>Hiện</button>
        )}
      </div>
    )},
  ];

  const statusFilter = [
    { key: "status", label: "Trạng thái", options: [
      { value: "PENDING", label: "Chờ duyệt" }, { value: "APPROVED", label: "Đã duyệt" },
      { value: "REJECTED", label: "Từ chối" }, { value: "HIDDEN", label: "Đã ẩn" },
    ]},
  ];

  return (
    <div>
      <div className="admin-page-header">
        <h1>Quản lý kho bãi</h1>
        <p>Xem, duyệt, ẩn/hiện kho bãi theo chủ sở hữu</p>
      </div>

      {/* Owner selector */}
      <div className="admin-filter-bar">
        <select className="admin-select" value={selectedOwner} onChange={(e) => { setSelectedOwner(e.target.value); setFilters(p => ({ ...p, page: 1 })); }} style={{ minWidth: 240 }}>
          <option value="">-- Chọn chủ kho --</option>
          {owners.map(o => <option key={o.userId} value={o.userId}>{o.fullName} ({o.email}) — {o.warehouseCount} kho</option>)}
        </select>
      </div>

      {selectedOwner && (
        <>
          <FilterBar filters={statusFilter} values={filters} onChange={handleFilter} searchPlaceholder="Tìm theo tên, địa chỉ..." />
          <BaseTable columns={columns} data={data.items} loading={loading} sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={handleSort} emptyText="Chủ kho này chưa có kho nào." />
          <Pagination page={data.page} pageSize={data.pageSize} totalCount={data.totalCount} totalPages={data.totalPages} onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))} />
        </>
      )}

      {/* Approve/Reject Modal */}
      <Modal isOpen={approveModal.open} onClose={() => setApproveModal(defaultApproveModal)} title={approveModal.isApproved ? "Duyệt kho" : "Từ chối kho"}
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
            <textarea className="admin-textarea" value={approveModal.reason} onChange={(e) => setApproveModal(p => ({ ...p, reason: e.target.value }))} placeholder="Nhập lý do từ chối..." />
            {!approveModal.reason.trim() && <div className="error-text">Lý do từ chối là bắt buộc</div>}
          </div>
        )}
      </Modal>

      {/* Listing Confirm */}
      <ConfirmDialog isOpen={listingConfirm.open} onClose={() => setListingConfirm(defaultListingConfirm)} onConfirm={handleListingConfirm}
        title={listingConfirm.action === "HIDE" ? "Ẩn kho" : "Hiện kho"}
        message={listingConfirm.action === "HIDE" ? `Bạn có chắc muốn ẩn kho "${listingConfirm.warehouse?.name}"?` : `Bạn có chắc muốn hiện kho "${listingConfirm.warehouse?.name}"?`}
        confirmText={listingConfirm.action === "HIDE" ? "Ẩn kho" : "Hiện kho"} confirmClass={listingConfirm.action === "HIDE" ? "admin-btn-warning" : "admin-btn-primary"}
        loading={listingConfirm.loading}
      />
    </div>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import adminService from "../../services/adminService";
import BaseTable from "../../components/BaseTable";
import FilterBar from "../../components/FilterBar";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";

export default function AuditSessionsPage() {
  const showToast = useToast();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = (user.role || user.roleName || "").toUpperCase();
  const isOwner = userRole === "OWNER";
  const [data, setData] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [filters, setFilters] = useState({ search: "", warehouseId: "", status: "", page: 1, pageSize: 10, sortBy: "", sortOrder: "desc" });

  // Create modal
  const defaultCreateModal = { open: false, warehouseId: "", notes: "", errors: {}, loading: false };
  const [createModal, setCreateModal] = useState(defaultCreateModal);

  // Close modal
  const [closeModal, setCloseModal] = useState({ open: false, auditId: null, notes: "", loading: false });

  useEffect(() => { adminService.getWarehousesLookup().then(r => { if (r.data.success) setWarehouses(r.data.data); }).catch(() => {}); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.warehouseId) delete params.warehouseId;
      if (!params.status) delete params.status;
      if (!params.search) delete params.search;
      if (!params.sortBy) delete params.sortBy;
      const res = await adminService.getAuditSessions(params);
      if (res.data.success) setData(res.data.data);
    } catch { showToast("Lỗi khi tải danh sách phiên kiểm kê", "error"); }
    setLoading(false);
  }, [filters, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  const handleSort = (sortBy, sortOrder) => setFilters(prev => ({ ...prev, sortBy, sortOrder }));

  const handleCreate = async () => {
    const errors = {};
    if (!createModal.warehouseId) errors.warehouseId = "Vui lòng chọn kho";
    if (Object.keys(errors).length > 0) { setCreateModal(p => ({ ...p, errors })); return; }
    setCreateModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.createAuditSession({ warehouseId: parseInt(createModal.warehouseId), notes: createModal.notes || null });
      if (res.data.success) { showToast(res.data.message); fetchData(); setCreateModal({ open: false, warehouseId: "", notes: "", errors: {}, loading: false }); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setCreateModal(p => ({ ...p, loading: false }));
  };

  const handleExport = async (auditId) => {
    try {
      const res = await adminService.exportAuditReport(auditId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = `BaoCaoKiemKe_${auditId}.csv`; a.click();
      window.URL.revokeObjectURL(url);
      showToast("Xuất báo cáo thành công");
    } catch { showToast("Lỗi khi xuất báo cáo", "error"); }
  };

  const handleCloseSession = async () => {
    setCloseModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.closeAuditSession(closeModal.auditId, { notes: closeModal.notes || null });
      if (res.data.success) {
        showToast(res.data.message);
        fetchData();
        setCloseModal({ open: false, auditId: null, notes: "", loading: false });
      } else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi khi đóng phiên", "error"); }
    setCloseModal(p => ({ ...p, loading: false }));
  };

  const columns = [
    { key: "auditId", label: "ID", width: "60px" },
    { key: "warehouseName", label: "Kho", sortable: true, render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: "createdByName", label: "Người tạo" },
    { key: "status", label: "Trạng thái", sortable: true, render: (v) => <StatusBadge status={v} /> },
    { key: "totalResults", label: "Kết quả", render: (v) => `${v} mục` },
    { key: "createdAt", label: "Ngày tạo", sortable: true, render: (v) => v ? new Date(v).toLocaleDateString("vi-VN") : "—" },
    { key: "completedAt", label: "Hoàn thành", sortable: true, render: (v) => v ? new Date(v).toLocaleDateString("vi-VN") : "—" },
    { key: "actions", label: "Thao tác", sortable: false, render: (_, row) => (
      <div className="admin-btn-group">
        <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={() => navigate(`/admin/audit-sessions/${row.auditId}`)}>Chi tiết</button>
        {isOwner && row.status === "OPEN" && (
          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setCloseModal({ open: true, auditId: row.auditId, notes: "", loading: false })} title="Đóng phiên kiểm kê">🔒</button>
        )}
        <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => handleExport(row.auditId)}>CSV</button>
      </div>
    )},
  ];

  const filterConfig = [
    { key: "warehouseId", label: "Kho", options: warehouses.map(w => ({ value: w.warehouseId, label: w.name })) },
    { key: "status", label: "Trạng thái", options: [{ value: "OPEN", label: "Đang mở" }, { value: "COMPLETED", label: "Hoàn thành" }] },
  ];

  return (
    <div>
      <div className="admin-flex-between" style={{ marginBottom: 24 }}>
        <div className="admin-page-header" style={{ marginBottom: 0 }}>
          <h1>Phiên kiểm kê</h1>
          <p>Quản lý phiên kiểm kê kho và ghi nhận kết quả</p>
        </div>
        {isOwner && <button className="admin-btn admin-btn-primary" onClick={() => setCreateModal({ ...defaultCreateModal, open: true })}>+ Tạo phiên kiểm kê</button>}
      </div>

      <FilterBar filters={filterConfig} values={filters} onChange={handleFilter} searchPlaceholder="Tìm theo tên kho, người tạo..." />
      <BaseTable columns={columns} data={data.items} loading={loading} sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={handleSort} emptyText="Chưa có phiên kiểm kê nào." />
      <Pagination page={data.page} pageSize={data.pageSize} totalCount={data.totalCount} totalPages={data.totalPages} onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))} />

      {/* Create Modal */}
      <Modal isOpen={createModal.open} onClose={() => setCreateModal(defaultCreateModal)} title="Tạo phiên kiểm kê mới"
        footer={<>
          <button className="admin-btn admin-btn-outline" onClick={() => setCreateModal(defaultCreateModal)} disabled={createModal.loading}>Hủy</button>
          <button className="admin-btn admin-btn-primary" onClick={handleCreate} disabled={createModal.loading}>{createModal.loading ? "Đang tạo..." : "Tạo phiên"}</button>
        </>}>
        <div className="admin-form-group">
          <label>Kho *</label>
          <select className="admin-select" value={createModal.warehouseId} onChange={(e) => setCreateModal(p => ({ ...p, warehouseId: e.target.value, errors: {} }))}>
            <option value="">-- Chọn kho --</option>
            {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.name} ({w.ownerName})</option>)}
          </select>
          {createModal.errors.warehouseId && <div className="error-text">{createModal.errors.warehouseId}</div>}
        </div>
        <div className="admin-form-group">
          <label>Ghi chú</label>
          <textarea className="admin-textarea" value={createModal.notes} onChange={(e) => setCreateModal(p => ({ ...p, notes: e.target.value }))} placeholder="Ghi chú (tuỳ chọn)..." />
        </div>
      </Modal>

      {/* Close Session Modal */}
      <Modal isOpen={closeModal.open} onClose={() => setCloseModal({ open: false, auditId: null, notes: "", loading: false })} title="Đóng phiên kiểm kê"
        footer={<>
          <button className="admin-btn admin-btn-outline" onClick={() => setCloseModal({ open: false, auditId: null, notes: "", loading: false })} disabled={closeModal.loading}>Hủy</button>
          <button className="admin-btn admin-btn-danger" onClick={handleCloseSession} disabled={closeModal.loading}>{closeModal.loading ? "Đang xử lý..." : "Xác nhận đóng"}</button>
        </>}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, background: "#fef2f2", borderRadius: 6, marginBottom: 16 }}>
            <XCircle size={20} color="#dc2626" />
            <span style={{ fontSize: 13, color: "#991b1b" }}>Sau khi đóng, phiên kiểm kê <strong>#{closeModal.auditId}</strong> sẽ <strong>không thể ghi nhận thêm</strong> kết quả.</span>
          </div>
          <div className="admin-form-group">
            <label>Ghi chú khi đóng (tùy chọn)</label>
            <textarea className="admin-textarea" placeholder="Nhập ghi chú..." value={closeModal.notes} onChange={(e) => setCloseModal(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

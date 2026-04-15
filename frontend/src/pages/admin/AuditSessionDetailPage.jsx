import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Package, CheckCircle, AlertTriangle, ListChecks, XCircle } from "lucide-react";
import adminService from "../../services/adminService";
import BaseTable from "../../components/BaseTable";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import StatCard from "../../components/StatCard";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";

export default function AuditSessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  // [PERMISSION FIX] Dùng warehouseContext thay vì JWT system role
  const warehouseCtx = JSON.parse(localStorage.getItem("warehouseContext") || "{}");
  const isOwner = (warehouseCtx?.warehouses || []).some(w => (w.role || "").toUpperCase() === "OWNER");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resFilters, setResFilters] = useState({ search: "", page: 1, pageSize: 10, sortBy: "", sortOrder: "asc", filterStatus: "all" });

  // Record results modal
  const defaultRecordModal = { open: false, items: [{ itemName: "", expectedQty: "", actualQty: "", discrepancyReason: "" }], completeSession: false, loading: false };
  const [recordModal, setRecordModal] = useState(defaultRecordModal);

  // Close session modal
  const [closeModal, setCloseModal] = useState({ open: false, notes: "", loading: false });

  useEffect(() => { fetchDetail(); }, [id]); // eslint-disable-line

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditSessionDetail(id);
      if (res.data.success) setSession(res.data.data);
      else showToast(res.data.message, "error");
    } catch { showToast("Không thể tải chi tiết", "error"); }
    setLoading(false);
  };

  const fetchResults = useCallback(async () => {
    setResultsLoading(true);
    try {
      const params = { ...resFilters };
      if (!params.search) delete params.search;
      if (!params.sortBy) delete params.sortBy;
      const res = await adminService.getAuditResults(id, params);
      if (res.data.success) setResults(res.data.data);
    } catch { }
    setResultsLoading(false);
  }, [id, resFilters]);

  useEffect(() => { fetchResults(); }, [fetchResults]);



  // Record results
  const addItem = () => setRecordModal(p => ({ ...p, items: [...p.items, { itemName: "", expectedQty: "", actualQty: "", discrepancyReason: "" }] }));
  const removeItem = (idx) => setRecordModal(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, value) => setRecordModal(p => ({ ...p, items: p.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));

  const handleRecord = async () => {
    // Validate
    let hasError = false;
    for (const item of recordModal.items) {
      if (!item.itemName.trim()) { hasError = true; break; }
      if (item.expectedQty === "" || parseInt(item.expectedQty) < 0) { hasError = true; break; }
      if (item.actualQty === "" || parseInt(item.actualQty) < 0) { hasError = true; break; }
    }
    if (hasError) { showToast("Vui lòng điền đầy đủ thông tin cho tất cả mục (tên, SL >= 0)", "error"); return; }
    if (recordModal.items.length === 0) { showToast("Vui lòng thêm ít nhất 1 mục kiểm kê", "error"); return; }

    setRecordModal(p => ({ ...p, loading: true }));
    try {
      const payload = {
        items: recordModal.items.map(i => ({ itemName: i.itemName.trim(), expectedQty: parseInt(i.expectedQty), actualQty: parseInt(i.actualQty), discrepancyReason: i.discrepancyReason || null })),
        completeSession: recordModal.completeSession,
      };
      const res = await adminService.recordAuditResults(id, payload);
      if (res.data.success) { showToast(res.data.message); fetchDetail(); fetchResults(); setRecordModal({ open: false, items: [{ itemName: "", expectedQty: "", actualQty: "", discrepancyReason: "" }], completeSession: false, loading: false }); }
      else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi", "error"); }
    setRecordModal(p => ({ ...p, loading: false }));
  };

  // Close session
  const handleClose = async () => {
    setCloseModal(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.closeAuditSession(id, { notes: closeModal.notes || null });
      if (res.data.success) {
        showToast(res.data.message);
        fetchDetail();
        setCloseModal({ open: false, notes: "", loading: false });
      } else showToast(res.data.message, "error");
    } catch (e) { showToast(e.response?.data?.message || "Lỗi khi đóng phiên kiểm kê", "error"); }
    setCloseModal(p => ({ ...p, loading: false }));
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Đang tải...</div>;
  if (!session) return <div style={{ textAlign: "center", padding: 60, color: "#ef4444" }}>Không tìm thấy phiên kiểm kê.</div>;

  const resColumns = [
    { key: "resultId", label: "ID", width: "50px" },
    { key: "itemName", label: "Tên hàng hóa", sortable: true },
    { key: "expectedQty", label: "SL dự kiến", sortable: true },
    { key: "actualQty", label: "SL thực tế", sortable: true },
    {
      key: "discrepancy", label: "Chênh lệch", sortable: true, render: (v) => {
        if (v === 0) return <span style={{ color: "#10b981", fontWeight: 600 }}>0</span>;
        return <span style={{ color: "#ef4444", fontWeight: 600 }}>{v > 0 ? `+${v}` : v}</span>;
      }
    },
    { key: "discrepancyReason", label: "Lý do", render: (v) => v || "—" },
    { key: "createdAt", label: "Ngày ghi", render: (v) => v ? new Date(v).toLocaleDateString("vi-VN") : "—" },
  ];

  return (
    <div>
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => navigate("/admin/audit-sessions")} style={{ marginBottom: 10 }}>← Quay lại</button>
          <h1>Phiên kiểm kê #{session.auditId}</h1>
          <p>{session.warehouseName} — {session.warehouseAddress}</p>
        </div>
        <div className="admin-btn-group">
          {isOwner && session.status === "OPEN" && (
            <>
              <button className="admin-btn admin-btn-primary" onClick={() => setRecordModal({ open: true, items: [{ itemName: "", expectedQty: "", actualQty: "", discrepancyReason: "" }], completeSession: false, loading: false })}>+ Ghi nhận kết quả</button>
              <button className="admin-btn admin-btn-danger" onClick={() => setCloseModal({ open: true, notes: "", loading: false })}>🔒 Đóng phiên kiểm kê</button>
            </>
          )}

        </div>
      </div>

      {/* Info */}
      <div className="admin-card">
        <div className="admin-card-body">
          <div className="admin-detail-grid">
            <div className="admin-detail-item"><div className="admin-detail-label">Trạng thái</div><StatusBadge status={session.status} /></div>
            <div className="admin-detail-item"><div className="admin-detail-label">Người tạo</div><div className="admin-detail-value">{session.createdByName}</div></div>
            <div className="admin-detail-item"><div className="admin-detail-label">Ngày tạo</div><div className="admin-detail-value">{session.createdAt ? new Date(session.createdAt).toLocaleString("vi-VN") : "—"}</div></div>
            <div className="admin-detail-item"><div className="admin-detail-label">Hoàn thành</div><div className="admin-detail-value">{session.completedAt ? new Date(session.completedAt).toLocaleString("vi-VN") : "—"}</div></div>
            {session.notes && <div className="admin-detail-item" style={{ gridColumn: "1 / -1" }}><div className="admin-detail-label">Ghi chú</div><div className="admin-detail-value">{session.notes}</div></div>}
          </div>
        </div>
      </div>

      {/* Summary */}
      {session.summary && (
        <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
          <StatCard icon={<Package size={20} />} value={session.summary.totalItems} label="Tổng mục" color="blue" />
          <StatCard icon={<CheckCircle size={20} />} value={session.summary.matchedItems} label="Khớp" color="green" />
          <StatCard icon={<AlertTriangle size={20} />} value={session.summary.discrepancyItems} label="Chênh lệch" color="red" />
        </div>
      )}

      {/* Results Table */}
      <div className="admin-card-header" style={{ padding: "14px 0" }}><h3>Kết quả kiểm kê</h3></div>
      <div className="admin-filter-bar" style={{ display: "flex", gap: 8 }}>
        <select className="admin-input" style={{ maxWidth: 180 }} value={resFilters.filterStatus === "all" ? "" : resFilters.filterStatus} onChange={(e) => setResFilters(p => ({ ...p, filterStatus: e.target.value || "all", page: 1 }))}>
          <option value="">Tất cả trạng thái</option>
          <option value="matched">Khớp</option>
          <option value="discrepancy">Chênh lệch</option>
        </select>
        <input className="admin-input" placeholder="Tìm theo tên hàng hóa..." value={resFilters.search} onChange={(e) => setResFilters(p => ({ ...p, search: e.target.value, page: 1 }))} style={{ maxWidth: 300 }} />
      </div>
      <BaseTable columns={resColumns} data={results.items} loading={resultsLoading} sortBy={resFilters.sortBy} sortOrder={resFilters.sortOrder} onSort={(s, o) => setResFilters(p => ({ ...p, sortBy: s, sortOrder: o }))} emptyText="Chưa có kết quả kiểm kê." />
      <Pagination page={results.page} pageSize={results.pageSize} totalCount={results.totalCount} totalPages={results.totalPages} onPageChange={(p) => setResFilters(prev => ({ ...prev, page: p }))} />

      {/* Record Results Modal */}
      <Modal isOpen={recordModal.open} onClose={() => setRecordModal(defaultRecordModal)} title="Ghi nhận kết quả kiểm kê" large
        footer={<>
          <button className="admin-btn admin-btn-outline" onClick={() => setRecordModal(defaultRecordModal)} disabled={recordModal.loading}>Hủy</button>
          <button className="admin-btn admin-btn-primary" onClick={handleRecord} disabled={recordModal.loading}>{recordModal.loading ? "Đang lưu..." : "Lưu kết quả"}</button>
        </>}>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {recordModal.items.map((item, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr auto", gap: 8, marginBottom: 8, alignItems: "start" }}>
              <input className="admin-input" placeholder="Tên hàng hóa *" value={item.itemName} onChange={(e) => updateItem(idx, "itemName", e.target.value)} style={{ height: 34 }} />
              <input className="admin-input" type="number" min="0" placeholder="SL dự kiến *" value={item.expectedQty} onChange={(e) => updateItem(idx, "expectedQty", e.target.value)} style={{ height: 34 }} />
              <input className="admin-input" type="number" min="0" placeholder="SL thực tế *" value={item.actualQty} onChange={(e) => updateItem(idx, "actualQty", e.target.value)} style={{ height: 34 }} />
              <input className="admin-input" placeholder="Lý do chênh lệch" value={item.discrepancyReason} onChange={(e) => updateItem(idx, "discrepancyReason", e.target.value)} style={{ height: 34 }} />
              {recordModal.items.length > 1 && <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => removeItem(idx)} style={{ height: 34 }}>✕</button>}
            </div>
          ))}
        </div>
        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={addItem} style={{ marginTop: 8 }}>+ Thêm mục</button>
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={recordModal.completeSession} onChange={(e) => setRecordModal(p => ({ ...p, completeSession: e.target.checked }))} />
            Hoàn thành phiên kiểm kê sau khi lưu
          </label>
        </div>
      </Modal>

      {/* Close Session Modal */}
      <Modal isOpen={closeModal.open} onClose={() => setCloseModal({ open: false, notes: "", loading: false })} title="Đóng phiên kiểm kê"
        footer={<>
          <button className="admin-btn admin-btn-outline" onClick={() => setCloseModal({ open: false, notes: "", loading: false })} disabled={closeModal.loading}>Hủy</button>
          <button className="admin-btn admin-btn-danger" onClick={handleClose} disabled={closeModal.loading}>{closeModal.loading ? "Đang xử lý..." : "Xác nhận đóng"}</button>
        </>}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, background: "#fef2f2", borderRadius: 6, marginBottom: 16 }}>
            <XCircle size={20} color="#dc2626" />
            <span style={{ fontSize: 13, color: "#991b1b" }}>Sau khi đóng, phiên kiểm kê sẽ <strong>không thể ghi nhận thêm</strong> kết quả.</span>
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

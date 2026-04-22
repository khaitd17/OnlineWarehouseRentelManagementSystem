import React, { useEffect, useState, useCallback } from "react";
import adminService from "../../services/adminService";
import BaseTable from "../../components/BaseTable";
import FilterBar from "../../components/FilterBar";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

const statusOptions = [
  { value: "Pending", label: "Chờ thanh toán" },
  { value: "Active", label: "Hoạt động" },
  { value: "Expired", label: "Hết hạn" },
  { value: "Cancelled", label: "Đã hủy" },
];

export default function SubscriptionsPage() {
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState("subscriptions"); // subscriptions | packages

  // =====================
  // STATE: SUBSCRIPTIONS
  // =====================
  const [data, setData] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: "", plan: "", page: 1, pageSize: 10, sortBy: "subscriptionId", sortOrder: "desc" });
  const defaultEdit = { open: false, subscription: null, loading: false, plan: "", status: "", startDate: "", endDate: "" };
  const [editModal, setEditModal] = useState(defaultEdit);
  const defaultConfirm = { open: false, id: null, message: "", loading: false };
  const [confirm, setConfirm] = useState(defaultConfirm);

  // =====================
  // STATE: PACKAGES
  // =====================
  const [packages, setPackages] = useState([]);
  const [pkgLoading, setPkgLoading] = useState(true);
  const defaultPkgModal = { open: false, isEdit: false, loading: false, packageId: null, name: "", originalName: "", price: 0, durationMonths: 1, description: "", isActive: true, activeSubCount: 0 };
  const [pkgModal, setPkgModal] = useState(defaultPkgModal);
  const [pkgConfirm, setPkgConfirm] = useState({ open: false, id: null, message: "", loading: false });


  // =====================
  // FETCH SUBSCRIPTIONS
  // =====================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.status) delete params.status;
      if (!params.plan) delete params.plan;
      if (!params.search) delete params.search;
      const res = await adminService.getSubscriptions(params);
      if (res.data.success) setData(res.data.data);
    } catch {
      showToast("Lỗi khi tải danh sách gói cước đăng ký", "error");
    }
    setLoading(false);
  }, [filters, showToast]);

  // =====================
  // FETCH PACKAGES
  // =====================
  const fetchPackages = useCallback(async () => {
    setPkgLoading(true);
    try {
      const res = await adminService.getSubscriptionPackages();
      if (res.data.success) setPackages(res.data.data);
    } catch {
      showToast("Lỗi khi tải danh sách gói cước", "error");
    }
    setPkgLoading(false);
  }, [showToast]);

  useEffect(() => {
    if (activeTab === "subscriptions") fetchData();
    else fetchPackages();
  }, [activeTab, fetchData, fetchPackages]);

  // =====================
  // SUBSCRIPTION HANDLERS
  // =====================
  const handleFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  const handleSort = (sortBy, sortOrder) => setFilters(prev => ({ ...prev, sortBy, sortOrder }));

  const openEdit = (sub) => {
    setEditModal({
      open: true,
      subscription: sub,
      loading: false,
      plan: sub.plan || "",
      status: sub.status || "",
      startDate: sub.startDate ? sub.startDate.substring(0, 10) : "",
      endDate: sub.endDate ? sub.endDate.substring(0, 10) : "",
    });
  };

  const handleSaveEdit = async () => {
    setEditModal(p => ({ ...p, loading: true }));
    try {
      const payload = {
        plan: editModal.plan || null,
        status: editModal.status || null,
        startDate: editModal.startDate || null,
        endDate: editModal.endDate || null,
      };
      const res = await adminService.updateSubscription(editModal.subscription.subscriptionId, payload);
      if (res.data.success) {
        showToast(res.data.message);
        fetchData();
        setEditModal(defaultEdit);
      } else showToast(res.data.message, "error");
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi khi cập nhật đăng ký", "error");
    }
    setEditModal(p => ({ ...p, loading: false }));
  };

  const openDelete = (sub) => {
    setConfirm({
      open: true, id: sub.subscriptionId,
      message: `Bạn có chắc muốn xóa thẻ đăng ký #${sub.subscriptionId} của "${sub.fullName}"?`,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirm(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.deleteSubscription(confirm.id);
      if (res.data.success) {
        showToast(res.data.message);
        fetchData();
      } else showToast(res.data.message, "error");
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi khi xóa đăng ký", "error");
    }
    setConfirm(defaultConfirm);
  };

  // =====================
  // PACKAGE HANDLERS
  // =====================
  const openPkgCreate = () => {
    setPkgModal({ ...defaultPkgModal, open: true, isEdit: false, originalName: "" });
  };
  const openPkgEdit = async (pkg) => {
    setPkgModal({
      open: true, isEdit: true, loading: false,
      packageId: pkg.packageId, name: pkg.name, originalName: pkg.name, price: pkg.price,
      durationMonths: pkg.durationMonths, description: pkg.description || "", isActive: pkg.isActive,
      activeSubCount: 0,
    });
    // Fetch active subscription count for this package
    try {
      const res = await adminService.getSubscriptions({ plan: pkg.name, status: "Active", pageSize: 1 });
      if (res.data.success) {
        const count = res.data.data?.totalCount ?? 0;
        setPkgModal(p => ({ ...p, activeSubCount: count }));
      }
    } catch { /* ignore */ }
  };
  const handleSavePkg = async () => {
    if (!pkgModal.name || pkgModal.price < 0 || pkgModal.durationMonths < 1) {
      showToast("Vui lòng điền tên, giá (>= 0) và thời lượng (>= 1)", "error");
      return;
    }
    setPkgModal(p => ({ ...p, loading: true }));
    const payload = {
      name: pkgModal.name, price: pkgModal.price, durationMonths: pkgModal.durationMonths,
      description: pkgModal.description, isActive: pkgModal.isActive
    };
    try {
      let res;
      if (pkgModal.isEdit) res = await adminService.updateSubscriptionPackage(pkgModal.packageId, payload);
      else res = await adminService.createSubscriptionPackage(payload);
      
      if (res.data.success) {
        showToast(res.data.message);
        fetchPackages();
        setPkgModal(defaultPkgModal);
      } else showToast(res.data.message, "error");
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi lưu gói cước", "error");
    }
    setPkgModal(p => ({ ...p, loading: false }));
  };

  const openPkgDelete = (pkg) => {
    setPkgConfirm({ open: true, id: pkg.packageId, message: `Xóa gói cước "${pkg.name}"?`, loading: false });
  };
  const handleConfirmPkgDelete = async () => {
    setPkgConfirm(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.deleteSubscriptionPackage(pkgConfirm.id);
      if (res.data.success) {
        showToast(res.data.message);
        fetchPackages();
      } else showToast(res.data.message, "error");
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi khi xóa gói cước", "error");
    }
    setPkgConfirm({ open: false, id: null, message: "", loading: false });
  };


  // =====================
  // RENDER COLUMNS
  // =====================
  const subColumns = [
    { key: "subscriptionId", label: "ID", width: "60px", sortable: true },
    { key: "fullName", label: "Người dùng", sortable: true, render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{v}</div>
        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{row.email}</div>
      </div>
    )},
    { key: "phone", label: "SĐT", render: (v) => v || "—" },
    { key: "plan", label: "Gói", sortable: true, render: (v) => (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700,
        background: "#e0f2fe", color: "#0284c7"
      }}>
        {v}
      </span>
    )},
    { key: "status", label: "Trạng thái", sortable: true, render: (v) => <StatusBadge status={v} /> },
    { key: "startDate", label: "Bắt đầu", sortable: true, render: (v) => v ? new Date(v).toLocaleDateString("vi-VN") : "—" },
    { key: "endDate", label: "Kết thúc", sortable: true, render: (v) => v ? new Date(v).toLocaleDateString("vi-VN") : "—" },
    { key: "transactionReference", label: "Mã GD", render: (v) => v ? (
      <code style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{v}</code>
    ) : "—" },
  ];

  const pkgColumns = [
    { key: "packageId", label: "ID", width: "60px"},
    { key: "name", label: "Tên Gói", render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: "price", label: "Giá", render: (v) => `${v.toLocaleString()} ₫` },
    { key: "durationMonths", label: "Thời hạn", render: (v) => `${v} tháng` },
    { key: "description", label: "Mô tả", render: (v) => v || "—" },
    { key: "isActive", label: "Trạng thái", render: (v) => (
      <span style={{ color: v ? "#16a34a" : "#dc2626", fontWeight: 600, fontSize: "0.85rem", background: v ? "#dcfce7" : "#fee2e2", padding: "4px 8px", borderRadius: 20 }}>
        {v ? "Đang bán" : "Ngưng bán"}
      </span>
    )},
    {
      key: "actions", label: "Thao tác", sortable: false, render: (_, row) => (
        <div className="admin-btn-group">
          <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={() => openPkgEdit(row)}>Sửa</button>
          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => openPkgDelete(row)}>Xóa</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <h1>Quản lý Subscription</h1>
        <p>Quản lý các gói cước và lịch sử người dùng đã đăng ký</p>
      </div>

      <div style={{ display: "flex", gap: "20px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0" }}>
        <button
          onClick={() => setActiveTab("subscriptions")}
          style={{
            background: "none", border: "none", padding: "10px 16px",
            fontSize: "1rem", fontWeight: activeTab === "subscriptions" ? 700 : 500,
            cursor: "pointer", color: activeTab === "subscriptions" ? "#4f46e5" : "#64748b",
            borderBottom: activeTab === "subscriptions" ? "3px solid #4f46e5" : "3px solid transparent",
            transition: "all 0.2s"
          }}
        >
          Lịch sử đăng ký user
        </button>
        <button
          onClick={() => setActiveTab("packages")}
          style={{
            background: "none", border: "none", padding: "10px 16px",
            fontSize: "1rem", fontWeight: activeTab === "packages" ? 700 : 500,
            cursor: "pointer", color: activeTab === "packages" ? "#4f46e5" : "#64748b",
            borderBottom: activeTab === "packages" ? "3px solid #4f46e5" : "3px solid transparent",
            transition: "all 0.2s"
          }}
        >
          Danh sách gói cước (Packages)
        </button>
      </div>

      {activeTab === "subscriptions" ? (
        <>
          <FilterBar
            filters={[{ key: "status", label: "Trạng thái", options: statusOptions }]}
            values={filters}
            onChange={handleFilter}
            searchPlaceholder="Tìm theo tên, email, mã giao dịch..."
          />
          <BaseTable
            columns={subColumns}
            data={data.items}
            loading={loading}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSort={handleSort}
          />
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            totalCount={data.totalCount}
            totalPages={data.totalPages}
            onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
          />
        </>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
            <button className="admin-btn admin-btn-primary" onClick={openPkgCreate} style={{ padding: "10px 20px", borderRadius: 8 }}>
              + Thêm gói cước mới
            </button>
          </div>
          <BaseTable
            columns={pkgColumns}
            data={packages}
            loading={pkgLoading}
          />
        </>
      )}

      {/* ── Edit Subscription Modal ── */}
      {editModal.open && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)",
        }} onClick={() => setEditModal(defaultEdit)}>
          <div style={{
            backgroundColor: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480,
            boxShadow: "0 25px 60px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s ease",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                Sửa đăng ký #{editModal.subscription?.subscriptionId}
              </h3>
              <button onClick={() => setEditModal(defaultEdit)} style={{
                background: "none", border: "none", fontSize: 20, cursor: "pointer",
                color: "#94a3b8", lineHeight: 1, padding: 4,
              }}>✕</button>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", marginBottom: 20, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>{editModal.subscription?.fullName}</div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{editModal.subscription?.email}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>Tên gói</label>
              <select
                value={editModal.plan}
                onChange={e => setEditModal(p => ({ ...p, plan: e.target.value }))}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0",
                  fontSize: "0.85rem", outline: "none", background: "#fff"
                }}
              >
                {packages.map(p => <option key={p.packageId} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>Trạng thái</label>
              <select
                value={editModal.status}
                onChange={e => setEditModal(p => ({ ...p, status: e.target.value }))}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0",
                  fontSize: "0.85rem", outline: "none", background: "#fff"
                }}
              >
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>Ngày bắt đầu</label>
                <input
                  type="date"
                  value={editModal.startDate}
                  onChange={e => setEditModal(p => ({ ...p, startDate: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.85rem", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>Ngày kết thúc</label>
                <input
                  type="date"
                  value={editModal.endDate}
                  onChange={e => setEditModal(p => ({ ...p, endDate: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.85rem", outline: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button disabled={editModal.loading} onClick={() => setEditModal(defaultEdit)} className="admin-btn admin-btn-sm" style={{ padding: "10px 20px", borderRadius: 10 }}>Hủy</button>
              <button disabled={editModal.loading} onClick={handleSaveEdit} className="admin-btn admin-btn-sm admin-btn-primary" style={{ padding: "10px 24px", borderRadius: 10 }}>{editModal.loading ? "Đang lưu..." : "Lưu"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Package Modal ── */}
      {pkgModal.open && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
        }} onClick={() => setPkgModal(defaultPkgModal)}>
          <div style={{
            backgroundColor: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 450,
            boxShadow: "0 25px 60px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s ease"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                {pkgModal.isEdit ? "Chỉnh sửa gói cước" : "Tạo gói cước mới"}
              </h3>
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>Tên gói</label>
              <input value={pkgModal.name} onChange={e => setPkgModal(p => ({ ...p, name: e.target.value }))} placeholder="Ví dụ: Premium" style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.9rem" }} />
              {pkgModal.isEdit && pkgModal.name !== pkgModal.originalName && pkgModal.activeSubCount > 0 && (
                <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 8, background: "#fef3c7", border: "1px solid #f59e0b", fontSize: "0.78rem", color: "#92400e" }}>
                  ⚠️ Đổi tên sẽ tự động cập nhật <strong>{pkgModal.activeSubCount}</strong> đăng ký đang dùng gói "<strong>{pkgModal.originalName}</strong>".
                </div>
              )}
              {pkgModal.isEdit && pkgModal.name !== pkgModal.originalName && pkgModal.activeSubCount === 0 && (
                <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac", fontSize: "0.78rem", color: "#166534" }}>
                  ✓ Không có đăng ký nào đang dùng gói này.
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 15 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>Giá (VNĐ)</label>
                <input type="number" min="0" value={pkgModal.price} onChange={e => setPkgModal(p => ({ ...p, price: Number(e.target.value) }))} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.9rem" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>Kỳ hạn (tháng)</label>
                <input type="number" min="1" value={pkgModal.durationMonths} onChange={e => setPkgModal(p => ({ ...p, durationMonths: Number(e.target.value) }))} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.9rem" }} />
              </div>
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>Mô tả chi tiết</label>
              <textarea value={pkgModal.description} onChange={e => setPkgModal(p => ({ ...p, description: e.target.value }))} rows={3} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.9rem", resize: "none" }} />
            </div>

            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="pkgActive" checked={pkgModal.isActive} onChange={e => setPkgModal(p => ({ ...p, isActive: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#4f46e5" }} />
              <label htmlFor="pkgActive" style={{ fontSize: "0.9rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>Gói cước đang kinh doanh (Active)</label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button disabled={pkgModal.loading} onClick={() => setPkgModal(defaultPkgModal)} className="admin-btn admin-btn-sm" style={{ padding: "10px 20px", borderRadius: 8 }}>Hủy</button>
              <button disabled={pkgModal.loading} onClick={handleSavePkg} className="admin-btn admin-btn-sm admin-btn-primary" style={{ padding: "10px 24px", borderRadius: 8 }}>{pkgModal.loading ? "Đang lưu..." : "Lưu"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub Delete Confirm ── */}
      <ConfirmDialog
        isOpen={confirm.open} onClose={() => setConfirm(defaultConfirm)} onConfirm={handleConfirmDelete}
        title="Xóa đăng ký" message={confirm.message} confirmText="Xóa" confirmClass="admin-btn-danger" loading={confirm.loading}
      />

      {/* ── Pkg Delete Confirm ── */}
      <ConfirmDialog
        isOpen={pkgConfirm.open} onClose={() => setPkgConfirm({ open: false, id: null, message: "", loading: false })} onConfirm={handleConfirmPkgDelete}
        title="Xóa gói cước" message={pkgConfirm.message} confirmText="Xóa" confirmClass="admin-btn-danger" loading={pkgConfirm.loading}
      />

    </div>
  );
}

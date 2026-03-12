import React, { useEffect, useState, useCallback } from "react";
import adminService from "../../services/adminService";
import BaseTable from "../../components/BaseTable";
import FilterBar from "../../components/FilterBar";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

export default function AccountsPage() {
  const showToast = useToast();
  const [data, setData] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", roleId: "", page: 1, pageSize: 10, sortBy: "createdAt", sortOrder: "desc" });
  const defaultConfirm = { open: false, userId: null, status: "", message: "", loading: false };
  const [confirm, setConfirm] = useState(defaultConfirm);

  useEffect(() => { adminService.getRoles().then(r => { if (r.data.success) setRoles(r.data.data); }).catch(() => {}); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.status) delete params.status;
      if (!params.roleId) delete params.roleId;
      if (!params.search) delete params.search;
      const res = await adminService.getAccounts(params);
      if (res.data.success) setData(res.data.data);
    } catch { showToast("Lỗi khi tải danh sách tài khoản", "error"); }
    setLoading(false);
  }, [filters, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (sortBy, sortOrder) => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handleStatusToggle = (userId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "LOCKED" : "ACTIVE";
    const msg = newStatus === "LOCKED" ? "Bạn có chắc muốn khóa tài khoản này?" : "Bạn có chắc muốn kích hoạt tài khoản này?";
    setConfirm({ open: true, userId, status: newStatus, message: msg, loading: false });
  };

  const handleConfirmStatus = async () => {
    setConfirm(p => ({ ...p, loading: true }));
    try {
      const res = await adminService.updateAccountStatus(confirm.userId, confirm.status);
      if (res.data.success) {
        showToast(res.data.message);
        fetchData();
      } else {
        showToast(res.data.message, "error");
      }
    } catch (e) { showToast(e.response?.data?.message || "Lỗi khi cập nhật trạng thái", "error"); }
    setConfirm({ open: false, userId: null, status: "", loading: false });
  };

  const columns = [
    { key: "userId", label: "ID", width: "60px", sortable: true },
    { key: "fullName", label: "Họ tên", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "SĐT", render: (v) => v || "—" },
    { key: "roleName", label: "Vai trò", render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: "status", label: "Trạng thái", sortable: true, render: (v) => <StatusBadge status={v} /> },
    { key: "createdAt", label: "Ngày tạo", sortable: true, render: (v) => v ? new Date(v).toLocaleDateString("vi-VN") : "—" },
    {
      key: "actions", label: "Thao tác", sortable: false, render: (_, row) => (
        <div className="admin-btn-group">
          {row.status === "ACTIVE"  && row.roleName !== "ADMIN" ? (
            <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleStatusToggle(row.userId, row.status)}>Khóa</button>
          ) : row.status === "LOCKED" ? (
            <button className="admin-btn admin-btn-sm admin-btn-success" onClick={() => handleStatusToggle(row.userId, row.status)}>Kích hoạt</button>
          ) : null}
        </div>
      ),
    },
  ];

  const filterConfig = [
    { key: "status", label: "Trạng thái", options: [{ value: "ACTIVE", label: "Hoạt động" }, { value: "LOCKED", label: "Bị khóa" }, { value: "PENDING", label: "Chờ duyệt" }] },
    { key: "roleId", label: "Vai trò", options: roles.map(r => ({ value: r.roleId, label: r.roleName })) },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <h1>Quản lý tài khoản</h1>
        <p>Xem và quản lý tất cả tài khoản người dùng trong hệ thống</p>
      </div>

      <FilterBar filters={filterConfig} values={filters} onChange={handleFilter} searchPlaceholder="Tìm theo tên, email, SĐT..." />

      <BaseTable columns={columns} data={data.items} loading={loading} sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={handleSort} />

      <Pagination page={data.page} pageSize={data.pageSize} totalCount={data.totalCount} totalPages={data.totalPages} onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))} />

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm(defaultConfirm)}
        onConfirm={handleConfirmStatus}
        title="Thay đổi trạng thái"
        message={confirm.message}
        confirmText={confirm.status === "LOCKED" ? "Khóa tài khoản" : "Kích hoạt"}
        confirmClass={confirm.status === "LOCKED" ? "admin-btn-danger" : "admin-btn-success"}
        loading={confirm.loading}
      />
    </div>
  );
}

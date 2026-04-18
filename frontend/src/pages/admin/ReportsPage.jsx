import React, { useEffect, useState } from "react";
import {
  Users, UserCheck, Lock, Warehouse, CheckCircle, Clock,
  DollarSign, Target, EyeOff
} from "lucide-react";
import adminService from "../../services/adminService";
import StatCard from "../../components/StatCard";
import { useToast } from "../../components/Toast";

const formatCurrency = (value) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} tr`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value?.toLocaleString("vi-VN") || "0";
};

export default function ReportsPage() {
  const showToast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => { doFetch("", ""); }, []); // eslint-disable-line

  const doFetch = async (from, to) => {
    setLoading(true);
    try {
      const params = {};
      if (from) params.fromDate = from;
      if (to) params.toDate = to;
      const res = await adminService.getSystemReports(params);
      if (res.data.success) {
        setReport(res.data.data);
        setAppliedFrom(from);
        setAppliedTo(to);
      }
    } catch { showToast("Lỗi khi tải báo cáo", "error"); }
    setLoading(false);
  };

  const fetchReport = () => doFetch(fromDate, toDate);

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    doFetch("", "");
  };

  const periodLabel = appliedFrom || appliedTo
    ? `${appliedFrom ? new Date(appliedFrom).toLocaleDateString("vi-VN") : "..."} – ${appliedTo ? new Date(appliedTo).toLocaleDateString("vi-VN") : "hôm nay"}`
    : "12 tháng qua (mặc định)";

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await adminService.exportSystemReports(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = `BaoCaoHeThong_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      window.URL.revokeObjectURL(url);
      showToast("Xuất báo cáo thành công");
    } catch { showToast("Lỗi khi xuất báo cáo", "error"); }
    setExporting(false);
  };

  return (
    <div>
      <div className="admin-flex-between" style={{ marginBottom: 24 }}>
        <div className="admin-page-header" style={{ marginBottom: 0 }}>
          <h1>Báo cáo hệ thống</h1>
          <p>Thống kê tổng hợp dữ liệu, báo cáo doanh thu & gói cước</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleExport} disabled={exporting}>{exporting ? "Đang xuất..." : "📥 Xuất báo cáo CSV"}</button>
      </div>

      {/* Date filter */}
      <div className="admin-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Từ ngày:</label>
        <input className="admin-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: 'auto' }} />
        <label style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Đến ngày:</label>
        <input className="admin-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: 'auto' }} />
        <button className="admin-btn admin-btn-outline" onClick={fetchReport} disabled={loading} style={{ margin: 0 }}>🔍 Lọc</button>
        {(fromDate || toDate) && (
          <button className="admin-btn" onClick={handleReset} disabled={loading} style={{ margin: 0, background: '#f3f4f6', color: '#374151' }}>✕ Đặt lại</button>
        )}
        <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 4 }}>Kỳ xem: <strong style={{ color: "#374151" }}>{periodLabel}</strong></span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Đang tải...</div>
      ) : !report ? (
        <div style={{ textAlign: "center", padding: 60, color: "#ef4444" }}>Không thể tải dữ liệu.</div>
      ) : (
        <>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>👥 Người dùng</h3>
              <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400 }}>Đăng ký mới trong kỳ</span>
            </div>
            <div className="admin-card-body">
              <div className="admin-stats-grid">
                <StatCard icon={<Users size={20} />} value={report.totalUsers} label="Người dùng đăng ký mới" color="blue" />
                <StatCard icon={<UserCheck size={20} />} value={report.activeUsers} label="Đang hoạt động" color="green" />
                <StatCard icon={<Lock size={20} />} value={report.lockedUsers} label="Bị khóa" color="red" />
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>🏭 Kho bãi</h3>
              <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400 }}>Kho được tạo trong kỳ</span>
            </div>
            <div className="admin-card-body">
              <div className="admin-stats-grid">
                <StatCard icon={<Warehouse size={20} />} value={report.totalWarehouses} label="Kho được tạo mới" color="blue" />
                <StatCard icon={<CheckCircle size={20} />} value={report.approvedWarehouses} label="Đã duyệt" color="green" />
                <StatCard icon={<Clock size={20} />} value={report.pendingWarehouses} label="Chờ duyệt" color="orange" />
                <StatCard icon={<EyeOff size={20} />} value={report.hiddenWarehouses} label="Chưa công khai" color="gray" />
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Tài chính & Doanh thu gói cước</h3>
              <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400 }}>Doanh thu trong kỳ</span>
            </div>
            <div className="admin-card-body">
              <div className="admin-stats-grid">
                <StatCard icon={<DollarSign size={20} />} value={formatCurrency(report.totalRevenue)} label="Tổng doanh thu (VNĐ)" color="green" />
                <StatCard icon={<Target size={20} />} value={report.totalNewSubscriptionsThisMonth} label="Đăng ký gói cước mới" color="blue" />
                <StatCard icon={<Clock size={20} />} value={report.expiringSubscriptions} label="Kho sắp hết gói (7 ngày tới)" color="orange" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

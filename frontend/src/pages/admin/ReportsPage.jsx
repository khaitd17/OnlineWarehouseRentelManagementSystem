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
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchReport(); }, []); // eslint-disable-line

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await adminService.getSystemReports(params);
      if (res.data.success) setReport(res.data.data);
    } catch { showToast("Lỗi khi tải báo cáo", "error"); }
    setLoading(false);
  };

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
      <div className="admin-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <label style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Từ ngày:</label>
        <input className="admin-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: 'auto' }} />
        <label style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Đến ngày:</label>
        <input className="admin-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: 'auto' }} />
        <button className="admin-btn admin-btn-outline" onClick={fetchReport} disabled={loading} style={{ margin: 0 }}>Lọc</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Đang tải...</div>
      ) : !report ? (
        <div style={{ textAlign: "center", padding: 60, color: "#ef4444" }}>Không thể tải dữ liệu.</div>
      ) : (
        <>
          <div className="admin-card">
            <div className="admin-card-header"><h3>👥 Người dùng</h3></div>
            <div className="admin-card-body">
              <div className="admin-stats-grid">
                <StatCard icon={<Users size={20} />} value={report.totalUsers} label="Tổng số người dùng" color="blue" />
                <StatCard icon={<UserCheck size={20} />} value={report.activeUsers} label="Hoạt động" color="green" />
                <StatCard icon={<Lock size={20} />} value={report.lockedUsers} label="Bị khóa" color="red" />
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header"><h3>🏭 Kho bãi</h3></div>
            <div className="admin-card-body">
              <div className="admin-stats-grid">
                <StatCard icon={<Warehouse size={20} />} value={report.totalWarehouses} label="Tổng số kho" color="blue" />
                <StatCard icon={<CheckCircle size={20} />} value={report.approvedWarehouses} label="Trạng thái: Đã duyệt" color="green" />
                <StatCard icon={<Clock size={20} />} value={report.pendingWarehouses} label="Trạng thái: Chờ duyệt" color="orange" />
                <StatCard icon={<EyeOff size={20} />} value={report.hiddenWarehouses} label="Trạng thái: Chưa công khai" color="gray" />
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header"><h3>💰 Tài chính & Doanh thu gói cước</h3></div>
            <div className="admin-card-body">
              <div className="admin-stats-grid">
                <StatCard icon={<DollarSign size={20} />} value={formatCurrency(report.totalRevenue)} label="Tổng doanh thu (VNĐ)" color="green" />
                <StatCard icon={<Target size={20} />} value={report.totalNewSubscriptionsThisMonth} label="Đăng ký mới (Tháng này)" color="blue" />
                <StatCard icon={<Clock size={20} />} value={report.expiringSubscriptions} label="Kho sắp hết gói cước" color="orange" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

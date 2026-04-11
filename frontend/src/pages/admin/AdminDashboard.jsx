import React, { useEffect, useState } from "react";
import {
  Users, UserCheck, Lock, Warehouse, Clock, EyeOff, CheckCircle, Target, DollarSign
} from "lucide-react";
import adminService from "../../services/adminService";
import StatCard from "../../components/StatCard";

const formatCurrency = (value) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} tr`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value?.toLocaleString("vi-VN") || "0";
};

export default function AdminDashboard() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReport(); }, []);

  const fetchReport = async () => {
    try {
      const res = await adminService.getSystemReports({});
      if (res.data.success) setReport(res.data.data);
    } catch { }
    setLoading(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Đang tải...</div>;
  if (!report) return <div style={{ textAlign: "center", padding: 60, color: "#ef4444" }}>Không thể tải dữ liệu.</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Tổng quan hệ thống</h1>
        <p>Thống kê tổng hợp về người dùng, kho bãi và đăng ký gói cước</p>
      </div>

      {/* ── Overview Stat Cards ── */}
      <h3 style={{ marginBottom: 15, fontSize: "1.2rem", fontWeight: 600, color: "#374151" }}>Tổng Quan Người Dùng</h3>
      <div className="admin-stats-grid">
        <StatCard icon={<Users size={20} />} value={report.totalUsers} label="Tổng người dùng" color="blue" />
        <StatCard icon={<UserCheck size={20} />} value={report.activeUsers} label="Đang hoạt động" color="green" />
        <StatCard icon={<Lock size={20} />} value={report.lockedUsers} label="Trạng thái: Bị khóa" color="red" />
      </div>

      <h3 style={{ marginBottom: 15, marginTop: 25, fontSize: "1.2rem", fontWeight: 600, color: "#374151" }}>Tổng Quan Kho Bãi</h3>
      <div className="admin-stats-grid">
        <StatCard icon={<Warehouse size={20} />} value={report.totalWarehouses} label="Tổng số kho" color="purple" />
        <StatCard icon={<CheckCircle size={20} />} value={report.approvedWarehouses} label="Đã duyệt" color="green" />
        <StatCard icon={<Clock size={20} />} value={report.pendingWarehouses} label="Chờ duyệt" color="orange" />
        <StatCard icon={<EyeOff size={20} />} value={report.hiddenWarehouses} label="Đã ẩn/Chưa công khai" color="gray" />
      </div>

      <h3 style={{ marginBottom: 15, marginTop: 25, fontSize: "1.2rem", fontWeight: 600, color: "#374151" }}>Doanh Thu & Tài Chính</h3>
      <div className="admin-stats-grid">
        <StatCard
          icon={<DollarSign size={20} />}
          value={
            <div className="admin-revenue-highlight" style={{ fontSize: "1.3rem", color: "#059669", fontWeight: 700 }}>
              <span>{formatCurrency(report.totalRevenue)} VNĐ</span>
            </div>
          }
          label="Tổng doanh thu"
          color="green"
        />
        <StatCard icon={<Target size={20} />} value={report.totalNewSubscriptionsThisMonth} label="Lượt đăng ký mới (Tháng này)" color="blue" />
        <StatCard icon={<Clock size={20} />} value={report.expiringSubscriptions} label="Chủ kho sắp hết hạn gói cước" color="orange" />
      </div>

    </div>
  );
}

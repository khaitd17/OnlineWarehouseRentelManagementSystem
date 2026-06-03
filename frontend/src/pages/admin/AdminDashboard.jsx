import React, { useEffect, useState } from "react";
import {
  Users, UserCheck, Lock, Warehouse, Clock, EyeOff, CheckCircle, Target, DollarSign
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import adminService from "../../services/adminService";
import StatCard from "../../components/StatCard";

const formatCurrency = (value) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} tr`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value?.toLocaleString("vi-VN") || "0";
};

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
      <div className="admin-stats-grid" style={{ marginBottom: 25 }}>
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
        <StatCard icon={<Target size={20} />} value={report.totalNewSubscriptionsThisMonth} label="Lượt đăng ký" color="blue" />
        <StatCard icon={<Clock size={20} />} value={report.expiringSubscriptions} label="Chủ kho sắp hết hạn gói cước" color="orange" />
      </div>

      {/* ── Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        {/* Monthly Revenue Chart */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
          <h4 style={{ marginBottom: "20px", fontSize: "1.1rem", fontWeight: 600, color: "#1e293b" }}>Doanh thu mỗi tháng</h4>
          {report.monthlyRevenue && report.monthlyRevenue.length > 0 ? (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={report.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                  <YAxis tickFormatter={(val) => formatCurrency(val)} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <RechartsTooltip
                    cursor={{ fill: "#f1f5f9" }}
                    formatter={(value) => [`${value.toLocaleString()} VNĐ`, "Doanh thu"]}
                    labelStyle={{ color: "#334155", fontWeight: 600, marginBottom: 4 }}
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#94a3b8" }}>Chưa có dữ liệu</div>
          )}
        </div>

        {/* Revenue by Subscription Package Chart */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
          <h4 style={{ marginBottom: "20px", fontSize: "1.1rem", fontWeight: 600, color: "#1e293b" }}>Phân bổ doanh thu theo gói</h4>
          {report.revenueByPackage && report.revenueByPackage.length > 0 ? (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={report.revenueByPackage}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="revenue"
                    nameKey="packageName"
                  >
                    {report.revenueByPackage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => [`${value.toLocaleString()} VNĐ`, "Doanh thu"]}
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "0.85rem", color: "#475569" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#94a3b8" }}>Chưa có dữ liệu</div>
          )}
        </div>
      </div>

    </div>
  );
}

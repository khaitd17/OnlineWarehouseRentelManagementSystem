import React, { useEffect, useState } from "react";
import { Users, UserCheck, Lock, Warehouse, FileText, CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import adminService from "../../services/adminService";
import StatCard from "../../components/StatCard";

const COLORS = ["#0095c7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

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

  // Chart data
  const userPieData = [
    { name: "Hoạt động", value: report.activeUsers || 0 },
    { name: "Bị khóa", value: report.lockedUsers || 0 },
  ].filter(d => d.value > 0);

  const warehousePieData = [
    { name: "Đã duyệt", value: report.approvedWarehouses || 0 },
    { name: "Chờ duyệt", value: report.pendingWarehouses || 0 },
    { name: "Khác", value: Math.max(0, (report.totalWarehouses || 0) - (report.approvedWarehouses || 0) - (report.pendingWarehouses || 0)) },
  ].filter(d => d.value > 0);

  const formatValue = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value;
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Tổng quan hệ thống</h1>
        <p>Thống kê tổng hợp về người dùng, kho bãi và hợp đồng</p>
      </div>

      {/* Stat Cards */}
      <div className="admin-stats-grid">
        <StatCard icon={<Users size={20} />} value={report.totalUsers} label="Tổng người dùng" color="blue" />
        <StatCard icon={<UserCheck size={20} />} value={report.activeUsers} label="Đang hoạt động" color="green" />
        <StatCard icon={<Lock size={20} />} value={report.lockedUsers} label="Bị khóa" color="red" />
        <StatCard icon={<Warehouse size={20} />} value={report.totalWarehouses} label="Tổng số kho" color="purple" />
        <StatCard icon={<Clock size={20} />} value={report.pendingWarehouses} label="Kho chờ duyệt" color="orange" />
        <StatCard icon={<FileText size={20} />} value={report.totalContracts} label="Tổng hợp đồng" color="blue" />
        <StatCard icon={<CheckCircle size={20} />} value={report.activeContracts} label="HĐ đang hoạt động" color="green" />
        <StatCard icon={<TrendingUp size={20} />} value={report.averageOccupancyRate + "%"} label="Tỷ lệ lấp đầy TB" color="blue" />
      </div>

      <div style={{ marginBottom: 20 }}>
      </div>

      {/* Charts Row 2 — User Pie + Warehouse Pie */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div className="admin-card">
          <div className="admin-card-header"><h3>Trạng thái người dùng</h3></div>
          <div className="admin-card-body">
            {userPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={userPieData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {userPieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #e5e7eb", fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><h3>Trạng thái kho bãi</h3></div>
          <div className="admin-card-body">
            {warehousePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={warehousePieData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {warehousePieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #e5e7eb", fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* Extra Stats Removed */}
    </div>
  );
}

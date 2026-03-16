import React, { useEffect, useState } from "react";
import {
  Users, UserCheck, Lock, Warehouse, FileText, CheckCircle, Clock,
  AlertTriangle, TrendingUp, TrendingDown, DollarSign, CreditCard,
  BarChart3, Target, Lightbulb, AlertCircle, Info, Package
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import adminService from "../../services/adminService";
import StatCard from "../../components/StatCard";

const COLORS = ["#0095c7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const formatCurrency = (value) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} tr`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value?.toLocaleString("vi-VN") || "0";
};

const ALERT_ICONS = {
  "alert-triangle": <AlertTriangle size={16} />,
  "clock": <Clock size={16} />,
  "trending-down": <TrendingDown size={16} />,
  "package": <Package size={16} />,
  "inbox": <Warehouse size={16} />,
  "credit-card": <CreditCard size={16} />,
};

const REC_ICONS = {
  PAYMENT: <CreditCard size={16} />,
  CONTRACT: <FileText size={16} />,
  REVENUE: <DollarSign size={16} />,
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

  const revenuePieData = [
    { name: "Đã thu", value: Number(report.totalRevenue) || 0 },
    { name: "Chờ thu", value: Number(report.pendingPayments) || 0 },
    { name: "Quá hạn", value: Number(report.overduePayments) || 0 },
  ].filter(d => d.value > 0);

  const monthlyData = (report.monthlyRevenue || []).map(m => ({
    period: m.period,
    amount: Number(m.amount),
  }));

  const growthClass = report.revenueGrowthRate > 0 ? "positive" : report.revenueGrowthRate < 0 ? "negative" : "neutral";
  const growthIcon = report.revenueGrowthRate >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Tổng quan hệ thống</h1>
        <p>Thống kê tổng hợp về người dùng, kho bãi, doanh thu và cảnh báo</p>
      </div>

      {/* ── Alerts Panel ── */}
      {report.alerts && report.alerts.length > 0 && (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <div className="admin-card-header">
            <h3>⚠️ Cảnh báo hệ thống ({report.alerts.length})</h3>
          </div>
          <div className="admin-card-body">
            <div className="admin-alerts-list">
              {report.alerts.map((alert, i) => (
                <div key={i} className={`admin-alert admin-alert-${alert.level.toLowerCase()}`}>
                  <div className="admin-alert-icon">
                    {ALERT_ICONS[alert.icon] || <AlertCircle size={16} />}
                  </div>
                  <div className="admin-alert-content">
                    <div className="admin-alert-title">{alert.title}</div>
                    <div className="admin-alert-message">{alert.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Overview Stat Cards ── */}
      <div className="admin-stats-grid">
        <StatCard icon={<Users size={20} />} value={report.totalUsers} label="Tổng người dùng" color="blue" />
        <StatCard icon={<UserCheck size={20} />} value={report.activeUsers} label="Đang hoạt động" color="green" />
        <StatCard icon={<Warehouse size={20} />} value={report.totalWarehouses} label="Tổng số kho" color="purple" />
        <StatCard icon={<Clock size={20} />} value={report.pendingWarehouses} label="Kho chờ duyệt" color="orange" />
      </div>

      {/* ── Revenue Stat Cards ── */}
      <div className="admin-stats-grid">
        <StatCard
          icon={<DollarSign size={20} />}
          value={<div className="admin-revenue-highlight">
            <span>{formatCurrency(report.totalRevenue)}</span>
            <span className={`admin-growth-badge ${growthClass}`}>
              {growthIcon} {report.revenueGrowthRate > 0 ? "+" : ""}{report.revenueGrowthRate}%
            </span>
          </div>}
          label="Tổng doanh thu"
          color="green"
        />
        <StatCard icon={<CreditCard size={20} />} value={formatCurrency(report.pendingPayments)} label="Chờ thanh toán" color="orange" />
        <StatCard icon={<AlertTriangle size={20} />} value={formatCurrency(report.overduePayments)} label="Quá hạn" color="red" />
        <StatCard icon={<Target size={20} />} value={report.collectionRate + "%"} label="Tỷ lệ thu tiền" color="blue" />
        <StatCard icon={<FileText size={20} />} value={report.activeContracts} label="HĐ đang hoạt động" color="green" />
        <StatCard icon={<Clock size={20} />} value={report.expiringContracts} label="HĐ sắp hết hạn" color="orange" />

        <StatCard icon={<Lock size={20} />} value={report.lockedUsers} label="Tài khoản bị khóa" color="red" />
      </div>

      {/* ── Monthly Revenue Chart + Revenue Pie ── */}
      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header"><h3>📊 Doanh thu theo tháng</h3></div>
          <div className="admin-card-body">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    contentStyle={{ borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13 }}
                    formatter={(value) => [`${Number(value).toLocaleString("vi-VN")} VNĐ`, "Doanh thu"]}
                  />
                  <Bar dataKey="amount" fill="#0095c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Chưa có dữ liệu doanh thu</div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><h3>💰 Phân bổ thanh toán</h3></div>
          <div className="admin-card-body">
            {revenuePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={revenuePieData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" paddingAngle={3}
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`} labelLine={false}>
                    {revenuePieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #e5e7eb", fontSize: 13 }}
                    formatter={(value) => [`${Number(value).toLocaleString("vi-VN")} VNĐ`]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* ── User Pie + Warehouse Pie ── */}
      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header"><h3>👥 Trạng thái người dùng</h3></div>
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
          <div className="admin-card-header"><h3>🏭 Trạng thái kho bãi</h3></div>
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

      {/* ── Top Warehouses + Recommendations ── */}
      <div className="admin-grid-2">
        {/* Top Warehouses */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>🏆 Top kho doanh thu cao nhất</h3></div>
          <div className="admin-card-body" style={{ padding: 0 }}>
            {report.topWarehousesByRevenue && report.topWarehousesByRevenue.length > 0 ? (
              <table className="admin-mini-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Tên kho</th>
                    <th style={{ textAlign: "right" }}>Doanh thu</th>
                    <th style={{ textAlign: "right" }}>Số HĐ</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topWarehousesByRevenue.map((w, i) => (
                    <tr key={w.warehouseId}>
                      <td>
                        <span className={`admin-rank admin-rank-${i < 3 ? i + 1 : "default"}`}>{i + 1}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{w.name}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "#059669" }}>
                        {Number(w.revenue).toLocaleString("vi-VN")} ₫
                      </td>
                      <td style={{ textAlign: "right" }}>{w.contractCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Chưa có dữ liệu doanh thu</div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>💡 Gợi ý hành động</h3></div>
          <div className="admin-card-body">
            {report.recommendations && report.recommendations.length > 0 ? (
              <div className="admin-recommendations-list">
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="admin-recommendation">
                    <div className={`admin-recommendation-icon ${rec.priority.toLowerCase()}`}>
                      {REC_ICONS[rec.type] || <Lightbulb size={16} />}
                    </div>
                    <div className="admin-recommendation-content">
                      <div className="admin-recommendation-title">
                        {rec.title}
                        <span className={`admin-priority-badge ${rec.priority.toLowerCase()}`}>{rec.priority}</span>
                      </div>
                      <div className="admin-recommendation-desc">{rec.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                <CheckCircle size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                <div>Hệ thống hoạt động tốt, không có gợi ý nào.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

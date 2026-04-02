import React, { useEffect, useState } from "react";
import {
  Users, UserCheck, Lock, UserPlus, Warehouse, CheckCircle, Clock,
  Building, DollarSign, CreditCard, Target, Lightbulb
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import adminService from "../../services/adminService";
import StatCard from "../../components/StatCard";
import { useToast } from "../../components/Toast";

const COLORS = ["#0095c7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const formatCurrency = (value) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} tr`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value?.toLocaleString("vi-VN") || "0";
};

const REC_ICONS = {
  PAYMENT: <CreditCard size={16} />,
  REVENUE: <DollarSign size={16} />,
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

  const revenuePieData = report ? [
    { name: "Đã thu", value: Number(report.totalRevenue) || 0 },
    { name: "Chờ thu", value: Number(report.pendingPayments) || 0 },
    { name: "Quá hạn", value: Number(report.overduePayments) || 0 },
  ].filter(d => d.value > 0) : [];

  const monthlyData = (report?.monthlyRevenue || []).map(m => ({
    period: m.period,
    amount: Number(m.amount),
  }));

  return (
    <div>
      <div className="admin-flex-between" style={{ marginBottom: 24 }}>
        <div className="admin-page-header" style={{ marginBottom: 0 }}>
          <h1>Báo cáo hệ thống</h1>
          <p>Thống kê tổng hợp, phân tích doanh thu và xuất báo cáo</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleExport} disabled={exporting}>{exporting ? "Đang xuất..." : "📥 Xuất báo cáo CSV"}</button>
      </div>

      {/* Date filter */}
      <div className="admin-filter-bar">
        <label style={{ fontSize: 13, color: "#6b7280" }}>Từ ngày:</label>
        <input className="admin-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <label style={{ fontSize: 13, color: "#6b7280" }}>Đến ngày:</label>
        <input className="admin-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <button className="admin-btn admin-btn-outline" onClick={fetchReport} disabled={loading}>Lọc</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Đang tải...</div>
      ) : !report ? (
        <div style={{ textAlign: "center", padding: 60, color: "#ef4444" }}>Không thể tải dữ liệu.</div>
      ) : (
        <>


          {/* ── User Stats ── */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>👥 Người dùng</h3></div>
            <div className="admin-card-body">
              <div className="admin-stats-grid">
                <StatCard icon={<Users size={20} />} value={report.totalUsers} label="Tổng người dùng" color="blue" />
                <StatCard icon={<UserCheck size={20} />} value={report.activeUsers} label="Hoạt động" color="green" />
                <StatCard icon={<Lock size={20} />} value={report.lockedUsers} label="Bị khóa" color="red" />
                <StatCard icon={<UserPlus size={20} />} value={report.newUsersThisPeriod} label="Mới trong kỳ" color="purple" />
              </div>
            </div>
          </div>

          {/* ── Warehouse Stats ── */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>🏭 Kho bãi</h3></div>
            <div className="admin-card-body">
              <div className="admin-stats-grid">
                <StatCard icon={<Warehouse size={20} />} value={report.totalWarehouses} label="Tổng số kho" color="blue" />
                <StatCard icon={<CheckCircle size={20} />} value={report.approvedWarehouses} label="Đã duyệt" color="green" />
                <StatCard icon={<Clock size={20} />} value={report.pendingWarehouses} label="Chờ duyệt" color="orange" />
                <StatCard icon={<Building size={20} />} value={report.newWarehousesThisPeriod} label="Mới trong kỳ" color="purple" />

              </div>
            </div>
          </div>

          {/* ── Financial Stats ── */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>💰 Tài chính & Doanh thu</h3></div>
            <div className="admin-card-body">
              <div className="admin-stats-grid">
                <StatCard icon={<DollarSign size={20} />} value={formatCurrency(report.totalRevenue)} label="Tổng doanh thu" color="green" />
                <StatCard icon={<CreditCard size={20} />} value={formatCurrency(report.pendingPayments)} label="Chờ thanh toán" color="orange" />
                <StatCard icon={<Target size={20} />} value={report.collectionRate + "%"} label="Tỷ lệ thu tiền" color="blue" />
              </div>
            </div>
          </div>

          {/* ── Monthly Revenue Chart + Revenue Pie ── */}
          <div className="admin-grid-2">
            <div className="admin-card">
              <div className="admin-card-header"><h3>📊 Doanh thu theo tháng</h3></div>
              <div className="admin-card-body">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
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
              <div className="admin-card-header"><h3>🥧 Phân bổ thanh toán</h3></div>
              <div className="admin-card-body">
                {revenuePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={revenuePieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3}
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

          {/* ── Top Warehouses + Recommendations ── */}
          <div className="admin-grid-2">
            <div className="admin-card">
              <div className="admin-card-header"><h3>🏆 Top 5 kho doanh thu cao nhất</h3></div>
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
                    <div>Không có gợi ý nào cho kỳ báo cáo này.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

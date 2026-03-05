import React, { useEffect, useState } from "react";
import { Users, UserCheck, Lock, UserPlus, Warehouse, CheckCircle, Clock, Building, FileText, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import adminService from "../../services/adminService";
import StatCard from "../../components/StatCard";
import { useToast } from "../../components/Toast";

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
          <p>Thống kê tổng hợp và xuất báo cáo CSV</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleExport} disabled={exporting}>{exporting ? "Đang xuất..." : "Xuất báo cáo CSV"}</button>
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
          {/* User Stats */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>Người dùng</h3></div>
            <div className="admin-card-body">
              <div className="admin-stats-grid">
                <StatCard icon={<Users size={20} />} value={report.totalUsers} label="Tổng người dùng" color="blue" />
                <StatCard icon={<UserCheck size={20} />} value={report.activeUsers} label="Hoạt động" color="green" />
                <StatCard icon={<Lock size={20} />} value={report.lockedUsers} label="Bị khóa" color="red" />
                <StatCard icon={<UserPlus size={20} />} value={report.newUsersThisPeriod} label="Mới trong kỳ" color="purple" />
              </div>
            </div>
          </div>

          {/* Warehouse Stats */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>Kho bãi</h3></div>
            <div className="admin-card-body">
              <div className="admin-stats-grid">
                <StatCard icon={<Warehouse size={20} />} value={report.totalWarehouses} label="Tổng số kho" color="blue" />
                <StatCard icon={<CheckCircle size={20} />} value={report.approvedWarehouses} label="Đã duyệt" color="green" />
                <StatCard icon={<Clock size={20} />} value={report.pendingWarehouses} label="Chờ duyệt" color="orange" />
                <StatCard icon={<Building size={20} />} value={report.newWarehousesThisPeriod} label="Mới trong kỳ" color="purple" />
                <StatCard icon={<TrendingUp size={20} />} value={report.averageOccupancyRate + "%"} label="Tỷ lệ lấp đầy TB" color="blue" />
              </div>
            </div>
          </div>

          {/* Financial Stats */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>Hợp đồng & Thanh toán</h3></div>
            <div className="admin-card-body">
              <div className="admin-stats-grid">
                <StatCard icon={<FileText size={20} />} value={report.totalContracts} label="Tổng hợp đồng" color="blue" />
                <StatCard icon={<CheckCircle size={20} />} value={report.activeContracts} label="Đang hoạt động" color="green" />
                <StatCard icon={<DollarSign size={20} />} value={(report.totalRevenue || 0).toLocaleString("vi-VN") + "₫"} label="Tổng doanh thu" color="green" />
                <StatCard icon={<Clock size={20} />} value={(report.pendingPayments || 0).toLocaleString("vi-VN") + "₫"} label="Chờ thanh toán" color="orange" />
                <StatCard icon={<AlertTriangle size={20} />} value={(report.overduePayments || 0).toLocaleString("vi-VN") + "₫"} label="Quá hạn" color="red" />
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          {report.monthlyRevenue && report.monthlyRevenue.length > 0 && (
            <div className="admin-card">
              <div className="admin-card-header"><h3>Doanh thu theo tháng</h3></div>
              <div className="admin-card-body" style={{ padding: 0 }}>
                <table className="admin-table">
                  <thead><tr><th>Tháng</th><th style={{ textAlign: "right" }}>Doanh thu</th></tr></thead>
                  <tbody>
                    {report.monthlyRevenue.map(m => (
                      <tr key={m.period}>
                        <td>{m.period}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{(m.amount || 0).toLocaleString("vi-VN")}₫</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

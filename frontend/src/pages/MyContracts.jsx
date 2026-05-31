import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import rentalService from "../services/rentalService";

const statusConfig = {
  DRAFT: { bg: "#f1f5f9", color: "#64748b", label: "Bản nháp" },
  NEGOTIATING: { bg: "#dbeafe", color: "#2563eb", label: "Đang đàm phán" },
  REVISION_REQUESTED: { bg: "#fef3c7", color: "#d97706", label: "Yêu cầu chỉnh sửa" },
  APPROVED_FOR_SIGNING: { bg: "#dcfce7", color: "#16a34a", label: "Sẵn sàng ký" },
  PENDING_OWNER_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ chủ kho ký" },
  PENDING_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ xác thực ký" },
  SIGNED: { bg: "#dbeafe", color: "#2563eb", label: "Đã ký" },
  PENDING_PAYMENT: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ thanh toán" },
  ACTIVE: { bg: "linear-gradient(135deg, #dcfce7, #bbf7d0)", color: "#16a34a", label: "Đang hiệu lực" },
  COMPLETED: { bg: "#e0e7ff", color: "#6366f1", label: "Đã hoàn thành" },
  CLOSED: { bg: "#f1f5f9", color: "#64748b", label: "Đã đóng" },
  EXPIRED: { bg: "#fef3c7", color: "#d97706", label: "Đã hết hạn" },
  TERMINATED: { bg: "#fee2e2", color: "#dc2626", label: "Đã chấm dứt" },
  CANCELLED: { bg: "#fee2e2", color: "#dc2626", label: "Đã hủy" },
  CANCELLED_BY_USER: { bg: "#fee2e2", color: "#dc2626", label: "Đã hủy" },
  OVERDUE: { bg: "#fee2e2", color: "#dc2626", label: "Quá hạn" },
  PENDING_TERMINATION: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ kết thúc sớm" },
  PENDING_CLOSE: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ kết thúc" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const MyContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const navigate = useNavigate();

  const warehouseCtx = JSON.parse(localStorage.getItem("warehouseContext") || "{}");
  const warehouses = warehouseCtx?.warehouses || [];
  const isOwner = warehouses.some(w => (w.role || "").toUpperCase() === "OWNER");

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        if (isOwner) {
          const [ownerRes, renterRes] = await Promise.all([
            rentalService.getContractsForOwner(),
            rentalService.getMyContracts()
          ]);
          const merged = [...ownerRes, ...renterRes];
          const uniqueContracts = Array.from(new Map(merged.map(c => [c.contractId, c])).values());
          uniqueContracts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setContracts(uniqueContracts);
        } else {
          const response = await rentalService.getMyContracts();
          setContracts(response);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải danh sách hợp đồng");
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [isOwner]);

  const normalizedKw = searchKeyword.trim().toLowerCase();
  const filtered = contracts.filter(c => {
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    if (!normalizedKw) return true;
    return [c.contractNumber, c.warehouseName, c.warehouseAddress]
      .filter(Boolean).join(" ").toLowerCase().includes(normalizedKw);
  });

  // Count stats
  const activeCount = contracts.filter(c => c.status === "ACTIVE").length;
  const pendingCount = contracts.filter(c =>
    ["DRAFT", "NEGOTIATING", "REVISION_REQUESTED", "APPROVED_FOR_SIGNING", "PENDING_OWNER_SIGNATURE", "PENDING_RENTER_SIGNATURE", "SIGNED", "PENDING_PAYMENT"]
      .includes(c.status)
  ).length;
  const closedCount = contracts.filter(c => ["COMPLETED", "CLOSED", "EXPIRED", "TERMINATED", "CANCELLED", "CANCELLED_BY_USER"].includes(c.status)).length;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#0ea5e9",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
          }} />
          <div style={{ color: "#64748b", fontSize: "0.92rem" }}>Đang tải danh sách hợp đồng...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "0 2rem 3rem", maxWidth: 1100, margin: "0 auto",
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Hero Header ── */}
      <div style={{
        margin: "0 -2rem 28px -2rem",
        padding: "32px 40px 28px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)",
        borderRadius: "0 0 24px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(14,165,233,0.08)" }} />
        <div style={{ position: "absolute", bottom: -20, right: 80, width: 100, height: 100, borderRadius: "50%", background: "rgba(14,165,233,0.05)" }} />

        <h1 style={{
          fontSize: "1.65rem", fontWeight: 800, color: "#fff", margin: "0 0 6px",
          letterSpacing: "-0.02em", position: "relative",
        }}>
          Hợp đồng thuê kho
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", margin: 0, position: "relative" }}>
          Quản lý toàn bộ hợp đồng thuê kho của bạn
        </p>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginTop: 20, position: "relative", flexWrap: "wrap" }}>
          {[
            { label: "Đang hiệu lực", value: activeCount, valueColor: "#4ade80" },
            { label: "Đang xử lý", value: pendingCount, valueColor: "#fbbf24" },
            { label: "Đã kết thúc", value: closedCount, valueColor: "#94a3b8" },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: "10px 20px", borderRadius: 12,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: stat.valueColor }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          color: "#991b1b", padding: "12px 16px", background: "#fef2f2",
          borderRadius: 12, border: "1px solid #fecaca", marginBottom: 16, fontSize: "0.9rem",
        }}>
          {error}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center",
        animation: "fadeUp 0.3s ease both",
      }}>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Tìm theo mã hợp đồng, tên kho..."
          style={{
            flex: 1, minWidth: 240, maxWidth: 400, padding: "10px 16px",
            borderRadius: 12, border: "1.5px solid #e2e8f0",
            fontSize: "0.88rem", outline: "none", background: "#fff",
            transition: "border-color 0.2s", boxSizing: "border-box",
          }}
          onFocus={e => e.currentTarget.style.borderColor = "#0ea5e9"}
          onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: "10px 16px", borderRadius: 12,
            border: "1.5px solid #e2e8f0", fontSize: "0.88rem",
            outline: "none", background: "#fff", color: "#475569",
            cursor: "pointer",
          }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hiệu lực</option>
          <option value="PENDING_PAYMENT">Chờ thanh toán</option>
          <option value="SIGNED">Đã ký</option>
          <option value="COMPLETED">Đã hoàn thành</option>
          <option value="TERMINATED">Đã chấm dứt</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 && !error && (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "#fff", borderRadius: 18,
          border: "1px solid #eef1f6",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          animation: "fadeUp 0.35s ease both",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div style={{ color: "#475569", fontSize: "1.05rem", fontWeight: 600 }}>
            {normalizedKw || filterStatus !== "ALL" ? "Không tìm thấy hợp đồng phù hợp" : "Bạn chưa có hợp đồng nào"}
          </div>
          <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 4 }}>
            {normalizedKw || filterStatus !== "ALL" ? "Hãy thử với từ khóa hoặc bộ lọc khác" : "Hợp đồng sẽ xuất hiện khi bạn thuê kho"}
          </div>
        </div>
      )}

      {/* ── Contract Cards ── */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((c, idx) => {
            const status = statusConfig[c.status] || { bg: "#f1f5f9", color: "#64748b", label: c.status };
            const isActive = c.status === "ACTIVE";
            const isCancelled = ["CANCELLED", "CANCELLED_BY_USER", "TERMINATED"].includes(c.status);

            return (
              <div
                key={c.contractId}
                onClick={() => navigate(`/contracts/${c.contractId}`)}
                style={{
                  background: "#fff", borderRadius: 18, border: "1px solid #eef1f6",
                  overflow: "hidden", cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                  animation: `fadeUp 0.35s ease ${idx * 0.05}s both`,
                  opacity: isCancelled ? 0.7 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {/* Top accent bar */}
                <div style={{
                  height: 4,
                  background: isActive
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : isCancelled
                      ? "linear-gradient(90deg, #ef4444, #dc2626)"
                      : "linear-gradient(90deg, #0ea5e9, #0284c7)",
                }} />

                <div style={{ padding: "1.3rem 1.6rem 1.4rem" }}>
                  {/* Header: contract number + status + warehouse */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a", letterSpacing: "-0.01em" }}>
                          {c.contractNumber}
                        </span>
                        <span style={{
                          padding: "3px 12px", borderRadius: 20,
                          background: typeof status.bg === "string" && status.bg.startsWith("linear") ? status.bg : status.bg,
                          color: status.color,
                          fontSize: "0.78rem", fontWeight: 700,
                        }}>
                          {status.label}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.88rem", color: "#64748b" }}>
                        {c.warehouseName} — {c.warehouseAddress}
                      </div>
                    </div>
                    <div style={{
                      fontSize: "1.3rem", fontWeight: 800, color: "#0f172a",
                      letterSpacing: "-0.02em", textAlign: "right",
                    }}>
                      {formatCurrency(c.totalValue)}
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Tổng giá trị
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div style={{ height: 1, background: "#f1f5f9", margin: "0 -0.4rem 12px" }} />

                  {/* Info grid */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: "10px 20px",
                  }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
                        Ngày bắt đầu
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
                        {formatDate(c.startDate)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
                        Ngày kết thúc
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
                        {formatDate(c.endDate)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
                        Giá thuê/tháng
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
                        {formatCurrency(c.monthlyPayment)}
                      </div>
                    </div>
                    {c.depositAmount != null && (
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
                          Tiền đặt cọc
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
                          {formatCurrency(c.depositAmount)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyContracts;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import rentalService from "../services/rentalService";

const statusConfig = {
  DRAFT:      { bg: "#f1f5f9", color: "#64748b", label: "Chờ ký" },
  PENDING_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ xác thực ký" },
  ACTIVE:     { bg: "#dcfce7", color: "#16a34a", label: "Đang hiệu lực" },
  EXPIRED:    { bg: "#fef3c7", color: "#d97706", label: "Đã hết hạn" },
  TERMINATED: { bg: "#fee2e2", color: "#dc2626", label: "Đã chấm dứt" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const WarehouseContracts = () => {
  const { warehouseId } = useParams();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [warehouseName, setWarehouseName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    rentalService.getContractsByWarehouse(warehouseId)
      .then((data) => {
        setContracts(data);
        if (data.length > 0) setWarehouseName(data[0].warehouseName);
      })
      .catch((err) => {
        if (err.response?.status === 403) setError("Bạn không có quyền xem hợp đồng kho này.");
        else if (err.response?.status === 404) setError("Không tìm thấy kho.");
        else setError("Không thể tải danh sách hợp đồng.");
      })
      .finally(() => setLoading(false));
  }, [warehouseId]);

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0",
            backgroundColor: "#fff", color: "#64748b", fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" }}>
          ← Quay lại
        </button>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>
            Hợp đồng thuê {warehouseName ? `— ${warehouseName}` : ""}
          </h1>
          <p style={{ color: "#64748b", marginTop: "0.3rem" }}>
            Danh sách hợp đồng thuê kho hiện tại
          </p>
        </div>
      </div>

      {error && (
        <div style={{ color: "#dc2626", padding: "12px 16px", marginBottom: "1.5rem",
          backgroundColor: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: "#64748b" }}>Đang tải...</p>}

      {!loading && contracts.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
          <p style={{ fontSize: "1.1rem" }}>Kho này chưa có hợp đồng nào.</p>
        </div>
      )}

      {!loading && contracts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {contracts.map((c) => {
            const status = statusConfig[c.status] || { bg: "#f1f5f9", color: "#64748b", label: c.status };
            return (
              <div
                key={c.contractId}
                onClick={() => navigate(`/contracts/${c.contractId}`)}
                style={{
                  backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9",
                  cursor: "pointer", transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a" }}>
                        {c.contractNumber}
                      </span>
                      <span style={{
                        padding: "4px 12px", borderRadius: "20px",
                        backgroundColor: status.bg, color: status.color,
                        fontSize: "0.8rem", fontWeight: 600,
                      }}>
                        {status.label}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.4rem 2rem", color: "#475569", fontSize: "0.88rem", marginTop: "0.8rem" }}>
                      <div><span style={{ color: "#94a3b8" }}>Người thuê: </span>{c.renterName}</div>
                      <div><span style={{ color: "#94a3b8" }}>Email: </span>{c.renterEmail}</div>
                      <div><span style={{ color: "#94a3b8" }}>Ngày bắt đầu: </span>{formatDate(c.startDate)}</div>
                      <div><span style={{ color: "#94a3b8" }}>Ngày kết thúc: </span>{formatDate(c.endDate)}</div>
                      <div><span style={{ color: "#94a3b8" }}>Giá thuê/tháng: </span>{formatCurrency(c.monthlyPayment)}</div>
                      <div><span style={{ color: "#94a3b8" }}>Tổng giá trị: </span>{formatCurrency(c.totalValue)}</div>
                    </div>
                  </div>
                  <div style={{ alignSelf: "center", color: "#94a3b8", fontSize: "1.2rem" }}>›</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WarehouseContracts;

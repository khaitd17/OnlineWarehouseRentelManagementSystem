import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../services/axiosClient";

const statusConfig = {
  DRAFT: { bg: "#f1f5f9", color: "#64748b", label: "Bản nháp" },
  PENDING_RENTER_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ người thuê ký" },
  PENDING_OWNER_SIGNATURE: { bg: "#dbeafe", color: "#2563eb", label: "Chờ chủ kho ký" },
  PENDING_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ xác thực ký" },
  SIGNED: { bg: "#dbeafe", color: "#2563eb", label: "Đã ký" },
  PENDING_PAYMENT: { bg: "#fef3c7", color: "#d97706", label: "Chờ thanh toán" },
  PAYMENT_FAILED: { bg: "#fee2e2", color: "#dc2626", label: "Thanh toán thất bại" },
  ACTIVE: { bg: "#dcfce7", color: "#16a34a", label: "Đang hiệu lực" },
  COMPLETED: { bg: "#e0f2fe", color: "#0284c7", label: "Hoàn thành" },
  CLOSED: { bg: "#e0f2fe", color: "#0284c7", label: "Đã đóng" },
  TERMINATED: { bg: "#fee2e2", color: "#dc2626", label: "Đã chấm dứt" },
  PENDING_TERMINATION: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ chấm dứt" },
  PENDING_CLOSE: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ đóng" },
  CANCELLED: { bg: "#f1f5f9", color: "#64748b", label: "Đã hủy" },
  CANCELLED_BY_USER: { bg: "#f1f5f9", color: "#64748b", label: "Người dùng hủy" },
  CANCELLED_BY_OWNER: { bg: "#f1f5f9", color: "#64748b", label: "Chủ kho hủy" },
  CANCELLED_NO_PAYMENT: { bg: "#f1f5f9", color: "#64748b", label: "Hủy - Không thanh toán" },
  OVERDUE: { bg: "#fee2e2", color: "#dc2626", label: "Quá hạn" },
  EXPIRED: { bg: "#fef3c7", color: "#d97706", label: "Đã hết hạn" },
  EXPIRED_SIGNATURE: { bg: "#fee2e2", color: "#dc2626", label: "Hết hạn ký" },
  EXPIRED_PAYMENT: { bg: "#fee2e2", color: "#dc2626", label: "Hết hạn thanh toán" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const OwnerContracts = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/rental-contracts/owner-contracts");
      setContracts(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading contracts:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  const filteredContracts = contracts.filter((c) => {
    const statusMatched = filterStatus === "ALL" || c.status === filterStatus;
    if (!statusMatched) return false;

    if (!normalizedKeyword) return true;

    const searchableText = [
      c.contractNumber,
      c.warehouseName,
      c.renterName,
      c.renterEmail,
      c.renterPhone
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedKeyword);
  });

  const statusCounts = contracts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ color: "#64748b" }}>Đang tải danh sách hợp đồng...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</div>
        <button
          onClick={loadContracts}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "10px",
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
          📋 Quản lý hợp đồng
        </h1>
        <p style={{ color: "#64748b" }}>
          Danh sách tất cả hợp đồng thuê kho của bạn
        </p>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Tìm theo mã hợp đồng, tên kho, người thuê, email, số điện thoại..."
          style={{
            width: "100%",
            maxWidth: "560px",
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            outline: "none",
            fontSize: "0.95rem",
            color: "#0f172a"
          }}
        />
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        <div
          onClick={() => setFilterStatus("ALL")}
          style={{
            backgroundColor: filterStatus === "ALL" ? "#0f172a" : "#fff",
            color: filterStatus === "ALL" ? "#fff" : "#0f172a",
            borderRadius: "12px",
            padding: "1rem",
            cursor: "pointer",
            border: "1px solid #e2e8f0",
            transition: "all 0.2s"
          }}
        >
          <div style={{ fontSize: "2rem", fontWeight: 700 }}>{contracts.length}</div>
          <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>Tất cả</div>
        </div>
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = statusCounts[status] || 0;
          if (count === 0) return null;
          const isActive = filterStatus === status;
          return (
            <div
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                backgroundColor: isActive ? config.color : "#fff",
                color: isActive ? "#fff" : config.color,
                borderRadius: "12px",
                padding: "1rem",
                cursor: "pointer",
                border: `1px solid ${config.color}`,
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>{count}</div>
              <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{config.label}</div>
            </div>
          );
        })}
      </div>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          padding: "3rem",
          textAlign: "center",
          border: "1px solid #e2e8f0"
        }}>
          <span style={{ fontSize: "3rem", marginBottom: "1rem", display: "block" }}>📄</span>
          <h3 style={{ color: "#64748b", marginBottom: "0.5rem" }}>
            {normalizedKeyword
              ? "Không tìm thấy hợp đồng phù hợp"
              : (filterStatus === "ALL"
                  ? "Chưa có hợp đồng nào"
                  : `Không có hợp đồng ${statusConfig[filterStatus]?.label || filterStatus}`)}
          </h3>
        </div>
      ) : (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #e2e8f0"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  Mã hợp đồng
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  Kho
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  Người thuê
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  Thời hạn
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  Giá trị
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  Trạng thái
                </th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract) => {
                const config = statusConfig[contract.status] || { bg: "#f1f5f9", color: "#64748b", label: contract.status };
                return (
                  <tr
                    key={contract.contractId}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td style={{ padding: "1rem" }}>
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>
                        {contract.contractNumber || `#${contract.contractId}`}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 500, color: "#0f172a" }}>
                        {contract.warehouseName || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ color: "#475569" }}>
                        {contract.renterName || "—"}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                        {contract.renterEmail || contract.renterPhone || ""}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ color: "#475569" }}>
                        {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600, color: "#16a34a" }}>
                        {formatCurrency(contract.monthlyPayment)}/tháng
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "9999px",
                        backgroundColor: config.bg,
                        color: config.color,
                        fontSize: "0.85rem",
                        fontWeight: 600
                      }}>
                        {config.label}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <button
                        onClick={() => navigate(`/contracts/${contract.contractId}`)}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "8px",
                          backgroundColor: "#3b82f6",
                          color: "#fff",
                          border: "none",
                          fontWeight: 500,
                          cursor: "pointer",
                          fontSize: "0.85rem"
                        }}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OwnerContracts;

import React, { useState, useEffect } from "react";
import rentalService from "../services/rentalService";

const statusColors = {
  PENDING: { bg: "#fef3c7", color: "#d97706", label: "Chờ duyệt" },
  APPROVED: { bg: "#dcfce7", color: "#16a34a", label: "Đã duyệt" },
  REJECTED: { bg: "#fee2e2", color: "#dc2626", label: "Từ chối" },
};

const PendingRentalRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal state for approve/reject
  const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject', request }
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [terms, setTerms] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rentalService.getPendingRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Không thể tải danh sách yêu cầu chờ duyệt"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const openApproveModal = (req) => {
    setActionModal({ type: "approve", request: req });
    setMonthlyPayment("");
    setDepositAmount("");
    setTerms("");
  };

  const openRejectModal = (req) => {
    setActionModal({ type: "reject", request: req });
    setRejectReason("");
  };

  const closeModal = () => {
    setActionModal(null);
  };

  const handleApprove = async () => {
    if (!monthlyPayment || parseFloat(monthlyPayment) <= 0) {
      alert("Vui lòng nhập giá thuê hàng tháng hợp lệ");
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        requestId: actionModal.request.requestId,
        contractImageUrl: null,
        monthlyPayment: parseFloat(monthlyPayment),
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        terms: terms.trim() || null,
      };

      const result = await rentalService.approveRentalRequest(
        actionModal.request.requestId,
        payload
      );
      alert(
        `Đã gửi thông tin đến người thuê thành công! Hợp đồng #${result.contractId} đang chờ người thuê ký.`
      );
      closeModal();
      fetchPending();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message || err.message || "Có lỗi khi gửi thông tin"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }
    setActionLoading(true);
    try {
      await rentalService.rejectRentalRequest(
        actionModal.request.requestId,
        { requestId: actionModal.request.requestId, rejectionReason: rejectReason }
      );
      alert("Đã từ chối yêu cầu thuê!");
      closeModal();
      fetchPending();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Có lỗi khi từ chối yêu cầu");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>
          Yêu cầu thuê chờ duyệt
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.3rem" }}>
          Xem xét và gửi đề xuất hoặc từ chối các yêu cầu thuê kho
        </p>
      </div>

      {error && (
        <div
          style={{
            color: "#dc2626",
            padding: "12px 16px",
            marginBottom: "1.5rem",
            backgroundColor: "#fef2f2",
            borderRadius: "12px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {loading && <p style={{ color: "#64748b" }}>Đang tải...</p>}

      {!loading && requests.length === 0 && !error && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "#94a3b8",
          }}
        >
          <p style={{ fontSize: "1.1rem" }}>
            Không có yêu cầu thuê nào chờ duyệt.
          </p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {requests.map((req) => {
            const status = statusColors[req.status] || {
              bg: "#f1f5f9",
              color: "#64748b",
              label: req.status,
            };
            return (
              <div
                key={req.requestId}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "16px",
                  padding: "1.5rem 2rem",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.8rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "1.05rem",
                          color: "#0f172a",
                        }}
                      >
                        #{req.requestId} - {req.warehouseName}
                      </span>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          backgroundColor: status.bg,
                          color: status.color,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.5rem 2rem",
                        color: "#475569",
                        fontSize: "0.9rem",
                        marginTop: "0.8rem",
                      }}
                    >
                      <div>
                        <span style={{ color: "#94a3b8" }}>Người thuê: </span>
                        {req.renterName} ({req.renterEmail})
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Địa chỉ: </span>
                        {req.warehouseAddress}
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Diện tích: </span>
                        {req.requestedArea} m²
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Thời hạn: </span>
                        {req.durationMonths} tháng
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Ngày bắt đầu: </span>
                        {formatDate(req.startDate)}
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Ngày gửi: </span>
                        {formatDate(req.createdAt)}
                      </div>
                    </div>

                    {req.notes && (
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "0.88rem",
                          marginTop: "0.6rem",
                          fontStyle: "italic",
                        }}
                      >
                        Ghi chú: {req.notes}
                      </p>
                    )}
                  </div>

                  {req.status === "PENDING" && (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.8rem",
                        alignSelf: "center",
                      }}
                    >
                      <button
                        onClick={() => openApproveModal(req)}
                        style={{
                          padding: "0.6rem 1.2rem",
                          borderRadius: "10px",
                          border: "none",
                          backgroundColor: "#2563eb",
                          color: "#fff",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: "0.88rem",
                        }}
                      >
                        📋 Gửi đề xuất
                      </button>
                      <button
                        onClick={() => openRejectModal(req)}
                        style={{
                          padding: "0.6rem 1.2rem",
                          borderRadius: "10px",
                          border: "none",
                          backgroundColor: "#dc2626",
                          color: "#fff",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: "0.88rem",
                        }}
                      >
                        ✗ Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Overlay */}
      {actionModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "20px",
              padding: "2rem",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {actionModal.type === "approve" ? (
              <>
                <h2
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: "0.5rem",
                  }}
                >
                  Gửi đề xuất đến người thuê #{actionModal.request.requestId}
                </h2>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "0.88rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  Nhập thông tin thanh toán để gửi đề xuất đến người thuê. Người thuê sẽ nhận thông báo và tiến hành ký hợp đồng.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={groupStyle}>
                      <label style={modalLabelStyle}>Giá thuê/tháng (VNĐ) *</label>
                      <input
                        type="number"
                        min="0"
                        value={monthlyPayment}
                        onChange={(e) => setMonthlyPayment(e.target.value)}
                        placeholder="VD: 5000000"
                        style={modalInputStyle}
                      />
                    </div>
                    <div style={groupStyle}>
                      <label style={modalLabelStyle}>Tiền đặt cọc (VNĐ)</label>
                      <input
                        type="number"
                        min="0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Không bắt buộc"
                        style={modalInputStyle}
                      />
                    </div>
                  </div>

                  <div style={groupStyle}>
                    <label style={modalLabelStyle}>Điều khoản hợp đồng</label>
                    <textarea
                      rows="3"
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      placeholder="Các điều khoản đặc biệt (nếu có)"
                      style={{ ...modalInputStyle, resize: "vertical" }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.8rem",
                    marginTop: "1.5rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={closeModal}
                    disabled={actionLoading}
                    style={{
                      padding: "0.6rem 1.2rem",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#fff",
                      color: "#64748b",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    style={{
                      padding: "0.6rem 1.2rem",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: actionLoading ? "#94a3b8" : "#2563eb",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: actionLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {actionLoading ? "Đang gửi..." : "Gửi đến người thuê"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: "0.5rem",
                  }}
                >
                  Từ chối yêu cầu #{actionModal.request.requestId}
                </h2>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "0.88rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  Nhập lý do từ chối yêu cầu thuê
                </p>

                <div style={groupStyle}>
                  <label style={modalLabelStyle}>Lý do từ chối *</label>
                  <textarea
                    rows="4"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do từ chối"
                    style={{ ...modalInputStyle, resize: "vertical" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.8rem",
                    marginTop: "1.5rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={closeModal}
                    disabled={actionLoading}
                    style={{
                      padding: "0.6rem 1.2rem",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#fff",
                      color: "#64748b",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    style={{
                      padding: "0.6rem 1.2rem",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: actionLoading ? "#94a3b8" : "#dc2626",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: actionLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const groupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const modalLabelStyle = {
  fontSize: "0.88rem",
  fontWeight: 600,
  color: "#64748b",
};

const modalInputStyle = {
  padding: "0.8rem",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "0.9rem",
};

export default PendingRentalRequests;

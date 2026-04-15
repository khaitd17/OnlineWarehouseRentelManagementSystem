import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import rentalService from "../services/rentalService";
import paymentService from "../services/paymentService";

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const ContractPaymentSelection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const purpose = new URLSearchParams(location.search).get("purpose");
  const isTerminationPayment = purpose === "termination";

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingCash, setConfirmingCash] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cashPaymentSuccess, setCashPaymentSuccess] = useState(false);

  useEffect(() => {
    const loadContract = async () => {
      try {
        const contractData = await rentalService.getContractById(id);
        setContract(contractData);

        if (!isTerminationPayment && contractData.status === "ACTIVE") {
          navigate(`/contracts/${id}`);
          return;
        }

        if (isTerminationPayment) {
          if (contractData.status === "TERMINATED") {
            navigate(`/contracts/${id}`);
            return;
          }

          if (contractData.status !== "PENDING_TERMINATION") {
            throw new Error("Hợp đồng không ở trạng thái chờ kết thúc sớm để thanh toán phí.");
          }

          if (!contractData.ownerApprovedTermination || !contractData.renterApprovedTermination) {
            throw new Error("Hai bên chưa xác nhận kết thúc sớm, chưa thể thanh toán phí.");
          }

          if (Number(contractData.earlyTerminationFee || 0) <= 0) {
            navigate(`/contracts/${id}`);
            return;
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading contract:", err);
        setError(err.response?.data?.message || "Không thể tải thông tin hợp đồng");
        setLoading(false);
      }
    };

    loadContract();
  }, [id, navigate, isTerminationPayment]);

  const handleOnlinePayment = () => {
    navigate(`/contracts/${id}/payment/online${isTerminationPayment ? "?purpose=termination" : ""}`);
  };

  const handleCashPayment = () => {
    setShowConfirmModal(true);
  };

  const confirmCashPayment = async () => {
    try {
      setConfirmingCash(true);
      setShowConfirmModal(false);

      await paymentService.createCashPayment({
        contractId: parseInt(id, 10),
        amount: isTerminationPayment
          ? (contract.earlyTerminationFee || 0)
          : (contract.depositAmount || contract.monthlyPayment),
        paymentType: isTerminationPayment ? "PENALTY" : "DEPOSIT"
      });

      setCashPaymentSuccess(true);
    } catch (err) {
      console.error("Error confirming cash payment:", err);
      setError(err.response?.data?.message || "Không thể xác nhận thanh toán");
    } finally {
      setConfirmingCash(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ color: "#64748b" }}>Đang tải thông tin...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{
          color: "#dc2626", padding: "1rem 1.5rem", backgroundColor: "#fef2f2",
          borderRadius: "12px", border: "1px solid #fecaca", marginBottom: "1rem"
        }}>
          {error}
        </div>
        <button
          onClick={() => navigate(`/contracts/${id}`)}
          style={{
            padding: "0.75rem 1.5rem", borderRadius: "10px",
            backgroundColor: "#0095c7", color: "#fff",
            border: "none", fontWeight: 600, cursor: "pointer"
          }}
        >
          Quay lại hợp đồng
        </button>
      </div>
    );
  }

  const paymentAmount = isTerminationPayment
    ? (contract?.earlyTerminationFee || 0)
    : (contract?.depositAmount || contract?.monthlyPayment || 0);

  return (
    <div style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      {cashPaymentSuccess && (
        <div style={{
          backgroundColor: "#dcfce7",
          borderRadius: "12px",
          padding: "2rem",
          marginBottom: "2rem",
          border: "1px solid #86efac",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#166534", marginBottom: "1rem" }}>
            Đã ghi nhận thanh toán tiền mặt!
          </h2>
          <p style={{ fontSize: "1rem", color: "#15803d", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Yêu cầu xác nhận đã được gửi đến chủ kho. Bạn sẽ nhận được thông báo sau khi chủ kho xác nhận.
          </p>
          <button
            onClick={() => navigate(`/contracts/${id}`)}
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "10px",
              backgroundColor: "#16a34a",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            Quay về hợp đồng
          </button>
        </div>
      )}

      {showConfirmModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
          }}>
            <div style={{ fontSize: "2.5rem", textAlign: "center", marginBottom: "1rem" }}>💵</div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem", textAlign: "center" }}>
              Xác nhận thanh toán tiền mặt
            </h3>
            <p style={{ fontSize: "1rem", color: "#64748b", marginBottom: "1.5rem", lineHeight: 1.6, textAlign: "center" }}>
              Bạn đã thanh toán tiền mặt tại kho? Chủ kho sẽ nhận được thông báo để xác nhận.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#fff",
                  color: "#64748b",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Hủy
              </button>
              <button
                onClick={confirmCashPayment}
                disabled={confirmingCash}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "10px",
                  backgroundColor: confirmingCash ? "#94a3b8" : "#16a34a",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  cursor: confirmingCash ? "not-allowed" : "pointer"
                }}
              >
                {confirmingCash ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={() => navigate(`/contracts/${id}`)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            color: "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          ← Quay lại
        </button>

        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
          💳 Chọn phương thức thanh toán
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Hợp đồng {contract?.contractNumber}
        </p>
      </div>

      {!cashPaymentSuccess && (
        <>
          <div style={{
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "0.5rem" }}>
              Số tiền cần thanh toán
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a" }}>
              {formatCurrency(paymentAmount)}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.5rem" }}>
              {isTerminationPayment ? "Phí kết thúc sớm" : (contract?.depositAmount ? "Tiền đặt cọc" : "Thanh toán tháng đầu")}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button
              onClick={handleOnlinePayment}
              style={{
                padding: "1.5rem",
                borderRadius: "12px",
                border: "2px solid #0095c7",
                backgroundColor: "#fff",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f0f9ff";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 149, 199, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "12px",
                backgroundColor: "#e0f2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem"
              }}>
                📱
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.3rem" }}>
                  Thanh toán trực tuyến
                </div>
                <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                  Quét mã QR hoặc chuyển khoản ngân hàng
                </div>
                <div style={{ fontSize: "0.85rem", color: "#0095c7", marginTop: "0.5rem", fontWeight: 600 }}>
                  ⚡ Nhanh chóng • Tự động xác nhận
                </div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#0095c7" }}>
                arrow_forward
              </span>
            </button>

            <button
              onClick={handleCashPayment}
              disabled={confirmingCash}
              style={{
                padding: "1.5rem",
                borderRadius: "12px",
                border: "2px solid #16a34a",
                backgroundColor: "#fff",
                cursor: confirmingCash ? "not-allowed" : "pointer",
                opacity: confirmingCash ? 0.6 : 1,
                transition: "all 0.2s",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}
              onMouseEnter={(e) => {
                if (!confirmingCash) {
                  e.currentTarget.style.backgroundColor = "#f0fdf4";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(22, 163, 74, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "12px",
                backgroundColor: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem"
              }}>
                💵
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.3rem" }}>
                  {confirmingCash ? "Đang xác nhận..." : "Thanh toán trực tiếp"}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                  Đã thanh toán tiền mặt tại kho
                </div>
                <div style={{ fontSize: "0.85rem", color: "#16a34a", marginTop: "0.5rem", fontWeight: 600 }}>
                  💰 Tiền mặt • Cần xác nhận từ chủ kho
                </div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#16a34a" }}>
                check_circle
              </span>
            </button>
          </div>

          <div style={{
            marginTop: "2rem",
            padding: "1rem 1.5rem",
            backgroundColor: "#fef3c7",
            borderRadius: "10px",
            border: "1px solid #fde047",
            color: "#854d0e",
            fontSize: "0.9rem",
            lineHeight: 1.6
          }}>
            <strong>📌 Lưu ý:</strong>
            <ul style={{ marginTop: "0.5rem", marginBottom: 0, paddingLeft: "1.5rem" }}>
              <li>Vui lòng thanh toán đúng số tiền hiển thị trên màn hình.</li>
              <li>Nội dung chuyển khoản phải chính xác theo mã thanh toán.</li>
              <li>Thanh toán online sẽ được hệ thống xác nhận tự động sau khi nhận giao dịch.</li>
              <li>Thanh toán tiền mặt cần chủ kho xác nhận trước khi hệ thống ghi nhận hoàn tất.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default ContractPaymentSelection;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import rentalService from "../services/rentalService";
import paymentService from "../services/paymentService";

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const ContractPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [payment, setPayment] = useState(null);
  const [qrInfo, setQrInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [countdown, setCountdown] = useState(5 * 60); // 5 minutes in seconds

  // Load contract and create payment
  useEffect(() => {
    const initPayment = async () => {
      try {
        // Load contract
        const contractData = await rentalService.getContractById(id);
        setContract(contractData);

        // Check if already paid
        if (contractData.status === 'ACTIVE') {
          navigate(`/contracts/${id}`);
          return;
        }

        // Get or create payment
        const existingPayments = await paymentService.getPaymentsByContract(id);
        let currentPayment;

        if (existingPayments && existingPayments.length > 0) {
          // Use existing pending payment
          currentPayment = existingPayments.find(p => p.status === 'PENDING');
          if (!currentPayment) {
            // All payments completed or failed, create new one
            currentPayment = await paymentService.createPayment({
              contractId: parseInt(id),
              amount: contractData.depositAmount || contractData.monthlyPayment,
              paymentType: 'DEPOSIT'
            });
          }
        } else {
          // Create new payment
          currentPayment = await paymentService.createPayment({
            contractId: parseInt(id),
            amount: contractData.depositAmount || contractData.monthlyPayment,
            paymentType: 'DEPOSIT'
          });
        }

        setPayment(currentPayment);

        // Get QR info
        const qr = await paymentService.getPaymentQrInfo(currentPayment.paymentId);
        setQrInfo(qr);

        setLoading(false);
      } catch (err) {
        console.error("Error initializing payment:", err);
        setError(err.response?.data?.message || "Không thể tải thông tin thanh toán");
        setLoading(false);
      }
    };

    initPayment();
  }, [id, navigate]);

  // Poll payment status
  useEffect(() => {
    if (!payment || paymentStatus === 'COMPLETED') return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await paymentService.getPaymentStatus(payment.paymentId);
        setPaymentStatus(status.status);

        if (status.status === 'COMPLETED') {
          clearInterval(pollInterval);
          // Redirect to success page after 2 seconds
          setTimeout(() => {
            navigate(`/payment-result?success=true&contractId=${id}`);
          }, 2000);
        }
      } catch (err) {
        console.error("Error polling payment status:", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [payment, paymentStatus, id, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!payment) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [payment]);

  const formatCountdown = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Đã sao chép!");
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ color: "#64748b" }}>Đang tải thông tin thanh toán...</div>
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

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
          💳 Thanh toán hợp đồng
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Hợp đồng {contract?.contractNumber}
        </p>
      </div>

      {/* Payment Status */}
      {paymentStatus === 'COMPLETED' && (
        <div style={{
          padding: "1rem 1.5rem", backgroundColor: "#dcfce7",
          borderRadius: "12px", border: "1px solid #86efac",
          color: "#166534", marginBottom: "2rem", textAlign: "center"
        }}>
          <strong>✅ Thanh toán thành công!</strong> Đang chuyển đến trang xác nhận...
        </div>
      )}

      {/* Countdown */}
      <div style={{
        padding: "1rem 1.5rem", backgroundColor: "#fef3c7",
        borderRadius: "12px", border: "1px solid #fde047",
        color: "#854d0e", marginBottom: "2rem", textAlign: "center"
      }}>
        <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
          Thời gian còn lại để thanh toán:
        </div>
        <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
          {formatCountdown(countdown)}
        </div>
      </div>

      {/* Payment Info */}
      <div style={{
        backgroundColor: "#fff", borderRadius: "16px",
        padding: "1.5rem 2rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0", marginBottom: "2rem"
      }}>
        <h2 style={{
          fontSize: "1.1rem", fontWeight: 700, color: "#0f172a",
          marginBottom: "1.5rem", paddingBottom: "1rem",
          borderBottom: "1px solid #f1f5f9"
        }}>
          Thông tin thanh toán
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Số tiền:</span>
            <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "#0f172a" }}>
              {formatCurrency(payment?.amount)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Loại thanh toán:</span>
            <span style={{ fontWeight: 600, color: "#0f172a" }}>
              {payment?.paymentType === 'DEPOSIT' ? 'Đặt cọc' : 'Thanh toán hàng tháng'}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Mã thanh toán:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>
                {payment?.paymentCode}
              </span>
              <button
                onClick={() => copyToClipboard(payment?.paymentCode)}
                style={{
                  padding: "4px 8px", borderRadius: "6px",
                  backgroundColor: "#f1f5f9", border: "none",
                  cursor: "pointer", fontSize: "0.8rem"
                }}
              >
                📋
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code */}
      {qrInfo && (
        <div style={{
          backgroundColor: "#fff", borderRadius: "16px",
          padding: "2rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0", textAlign: "center"
        }}>
          <h2 style={{
            fontSize: "1.1rem", fontWeight: 700, color: "#0f172a",
            marginBottom: "1.5rem"
          }}>
            Quét mã QR để thanh toán
          </h2>

          <img
            src={qrInfo.qrImageUrl}
            alt="QR Code"
            style={{
              width: "300px", height: "300px",
              margin: "0 auto 1.5rem", display: "block",
              border: "4px solid #f1f5f9", borderRadius: "12px"
            }}
          />

          <div style={{
            padding: "1rem", backgroundColor: "#f8fafc",
            borderRadius: "10px", marginBottom: "1rem"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>
              Ngân hàng
            </div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1.1rem" }}>
              {qrInfo.bankName}
            </div>
          </div>

          <div style={{
            padding: "1rem", backgroundColor: "#f8fafc",
            borderRadius: "10px", marginBottom: "1rem"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>
              Số tài khoản
            </div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              {qrInfo.accountNumber}
              <button
                onClick={() => copyToClipboard(qrInfo.accountNumber)}
                style={{
                  padding: "4px 8px", borderRadius: "6px",
                  backgroundColor: "#e2e8f0", border: "none",
                  cursor: "pointer", fontSize: "0.8rem"
                }}
              >
                📋
              </button>
            </div>
          </div>

          <div style={{
            padding: "1rem", backgroundColor: "#f8fafc",
            borderRadius: "10px", marginBottom: "1rem"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>
              Chủ tài khoản
            </div>
            <div style={{ fontWeight: 700, color: "#0f172a" }}>
              {qrInfo.accountName}
            </div>
          </div>

          <div style={{
            padding: "1rem", backgroundColor: "#fef3c7",
            borderRadius: "10px", border: "1px solid #fde047"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#854d0e", marginBottom: "0.5rem" }}>
              Nội dung chuyển khoản (BẮT BUỘC)
            </div>
            <div style={{ fontWeight: 700, color: "#854d0e", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              {payment?.paymentCode}
              <button
                onClick={() => copyToClipboard(payment?.paymentCode)}
                style={{
                  padding: "6px 10px", borderRadius: "6px",
                  backgroundColor: "#fde047", border: "none",
                  cursor: "pointer", fontSize: "0.9rem"
                }}
              >
                📋 Sao chép
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: "2rem", padding: "1.5rem", backgroundColor: "#f8fafc",
        borderRadius: "12px", border: "1px solid #e2e8f0"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
          Hướng dẫn thanh toán
        </h3>
        <ol style={{ paddingLeft: "1.5rem", lineHeight: 1.8, color: "#475569" }}>
          <li>Mở ứng dụng Mobile Banking của bạn</li>
          <li>Chọn chức năng quét mã QR hoặc chuyển khoản</li>
          <li>Quét mã QR hoặc nhập thông tin chuyển khoản</li>
          <li><strong>Đảm bảo nội dung chuyển khoản chính xác: {payment?.paymentCode}</strong></li>
          <li>Xác nhận và hoàn tất giao dịch</li>
          <li>Hệ thống sẽ tự động xác nhận sau khi nhận được thanh toán (trong vòng 30 giây)</li>
        </ol>
      </div>

      {/* Back Button */}
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button
          onClick={() => navigate(`/contracts/${id}`)}
          style={{
            padding: "0.75rem 1.5rem", borderRadius: "10px",
            backgroundColor: "#f1f5f9", color: "#64748b",
            border: "1px solid #e2e8f0", fontWeight: 600,
            cursor: "pointer"
          }}
        >
          ← Quay lại hợp đồng
        </button>
      </div>
    </div>
  );
};

export default ContractPayment;

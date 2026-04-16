import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import rentalService from "../services/rentalService";
import paymentService from "../services/paymentService";
import contractExtensionService from "../services/contractExtensionService";
import PaymentRetryButton from "../components/PaymentRetryButton";
import ExpiryCountdown from "../components/ExpiryCountdown";

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const ContractPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const purpose = new URLSearchParams(location.search).get("purpose");
  const extensionId = new URLSearchParams(location.search).get("extensionId");
  const isTerminationPayment = purpose === "termination";
  const isExtensionPayment = purpose === "extension";
  const targetPaymentType = isTerminationPayment ? "PENALTY" : isExtensionPayment ? "EXTENSION" : "DEPOSIT";

  const [contract, setContract] = useState(null);
  const [payment, setPayment] = useState(null);
  const [qrInfo, setQrInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [extensionInfo, setExtensionInfo] = useState(null);

  // Load contract and create payment
  useEffect(() => {
    const initPayment = async () => {
      try {
        // Load contract
        const contractData = await rentalService.getContractById(id);
        setContract(contractData);
        let extensionData = null;

        if (isTerminationPayment) {
          if (contractData.status === 'TERMINATED') {
            navigate(`/contracts/${id}`);
            return;
          }

          if (contractData.status !== 'PENDING_TERMINATION') {
            throw new Error('Hợp đồng không ở trạng thái chờ kết thúc sớm để thanh toán phí.');
          }

          if (!contractData.ownerApprovedTermination || !contractData.renterApprovedTermination) {
            throw new Error('Hai bên chưa xác nhận kết thúc sớm, chưa thể thanh toán phí.');
          }

          if (Number(contractData.earlyTerminationFee || 0) <= 0) {
            navigate(`/contracts/${id}`);
            return;
          }
        } else if (!isExtensionPayment) {
          // Check if already paid for activation flow
          if (contractData.status === 'ACTIVE') {
            navigate(`/contracts/${id}`);
            return;
          }
        }

        if (isExtensionPayment) {
          if (!extensionId) {
            throw new Error('Thiếu thông tin gia hạn.');
          }

          extensionData = await contractExtensionService.getExtensionById(extensionId);
          if (!extensionData || extensionData.originalContractId !== Number(id)) {
            throw new Error('Yêu cầu gia hạn không hợp lệ.');
          }
          setExtensionInfo(extensionData);
        }

        // Get or create payment
        const existingPayments = await paymentService.getPaymentsByContract(id);
        let currentPayment;
        const relevantPayments = Array.isArray(existingPayments)
          ? existingPayments.filter((p) => p.paymentType === targetPaymentType)
          : [];

        if (relevantPayments.length > 0) {
          // Use existing pending payment
          currentPayment = relevantPayments.find(p => 
            (p.status === 'PENDING' || p.status === 'RETRY_PENDING') && Number(p.amount) > 0
          );

          // Ensure current pending payment follows latest expiry policy (24h).
          if (currentPayment?.status === 'PENDING') {
            try {
              const normalizedPayment = await paymentService.createPayment({
                contractId: parseInt(id, 10),
                  amountOverride: isTerminationPayment
                    ? contractData.earlyTerminationFee
                    : isExtensionPayment
                      ? ((extensionData?.proposedMonthlyPayment || 0) * (extensionData?.durationMonths || 0))
                    : (contractData.depositAmount || contractData.monthlyPayment),
                paymentType: targetPaymentType
              });
              if (normalizedPayment?.paymentId === currentPayment.paymentId) {
                currentPayment = { ...currentPayment, ...normalizedPayment };
              }
            } catch (normalizeErr) {
              console.warn('Failed to normalize payment expiry policy:', normalizeErr);
            }
          }
          
          if (!currentPayment) {
            // Check for failed/expired payments that can be retried
            const failedPayment = relevantPayments.find(p => 
              (p.status === 'FAILED' || p.status === 'EXPIRED') && Number(p.amount) > 0
            );
            
            if (failedPayment) {
              // Show the failed payment with retry option
              currentPayment = failedPayment;
            } else {
              const completedPayment = relevantPayments
                .filter(p => p.status === 'COMPLETED')
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

              if (completedPayment) {
                currentPayment = completedPayment;
              } else {
                // No reusable payment found, create new one
                currentPayment = await paymentService.createPayment({
                  contractId: parseInt(id, 10),
                  amountOverride: isTerminationPayment
                    ? contractData.earlyTerminationFee
                    : isExtensionPayment
                      ? ((extensionData?.proposedMonthlyPayment || 0) * (extensionData?.durationMonths || 0))
                    : (contractData.depositAmount || contractData.monthlyPayment),
                  paymentType: targetPaymentType
                });
              }
            }
          }
        } else {
          // Create new payment
          currentPayment = await paymentService.createPayment({
            contractId: parseInt(id, 10),
            amountOverride: isTerminationPayment
              ? contractData.earlyTerminationFee
              : isExtensionPayment
                ? ((extensionData?.proposedMonthlyPayment || 0) * (extensionData?.durationMonths || 0))
              : (contractData.depositAmount || contractData.monthlyPayment),
            paymentType: targetPaymentType
          });
        }

        setPayment(currentPayment);

        // Get QR info only if payment is pending/retry-pending
        if (currentPayment.status === 'PENDING' || currentPayment.status === 'RETRY_PENDING') {
          const qr = await paymentService.getPaymentQrInfo(currentPayment.paymentId);
          setQrInfo(qr);
        }

        setPaymentStatus(currentPayment.status);
        setLoading(false);
      } catch (err) {
        console.error("Error initializing payment:", err);
        setError(err.response?.data?.message || "Không thể tải thông tin thanh toán");
        setLoading(false);
      }
    };

    initPayment();
  }, [id, navigate, isTerminationPayment, isExtensionPayment, extensionId, targetPaymentType]);

  // Poll payment status
  useEffect(() => {
    if (!payment || paymentStatus === 'COMPLETED') return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await paymentService.getPaymentStatus(payment.paymentId);
        setPaymentStatus(status.status);
        setPayment(prev => prev ? { ...prev, ...status } : prev);

        if (status.status === 'COMPLETED') {
          clearInterval(pollInterval);
          // Redirect to success page after 2 seconds
          setTimeout(() => {
            navigate(`/payment-result?success=true&contractId=${id}&purpose=${isTerminationPayment ? 'termination' : 'contract'}`);
          }, 2000);
        }
      } catch (err) {
        console.error("Error polling payment status:", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [payment, paymentStatus, id, navigate, isTerminationPayment]);

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
          💳 {isTerminationPayment ? "Thanh toán phí kết thúc sớm" : isExtensionPayment ? "Thanh toán gia hạn hợp đồng" : "Thanh toán hợp đồng"}
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Hợp đồng {contract?.contractNumber}
        </p>
      </div>

      {/* Payment Status - Failed/Expired */}
      {(paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED') && (
        <div style={{
          padding: "1.5rem", backgroundColor: "#fee2e2",
          borderRadius: "12px", border: "1px solid #fecaca",
          color: "#dc2626", marginBottom: "2rem"
        }}>
          <div style={{ fontWeight: 700, marginBottom: "1rem" }}>
            ❌ {paymentStatus === 'FAILED' ? 'Thanh toán thất bại' : 'Thanh toán đã hết hạn'}
          </div>
          <div style={{ marginBottom: "1rem" }}>
            {paymentStatus === 'FAILED' 
              ? 'Không nhận được xác nhận từ ngân hàng. Vui lòng thử lại.'
              : 'Thời gian thanh toán đã hết. Vui lòng tạo thanh toán mới.'}
          </div>
          
          {/* Retry Button */}
          <PaymentRetryButton
            paymentId={payment?.paymentId}
            onRetrySuccess={async (result) => {
              // Reload payment info after retry
              try {
                const updatedStatus = await paymentService.getPaymentStatus(payment.paymentId);
                setPayment(prev => prev ? { ...prev, ...updatedStatus } : prev);
                setPaymentStatus(updatedStatus.status);
                
                // Get new QR code
                if (updatedStatus.status === 'PENDING' || updatedStatus.status === 'RETRY_PENDING') {
                  const qr = await paymentService.getPaymentQrInfo(payment.paymentId);
                  setQrInfo(qr);
                } else {
                  setQrInfo(null);
                }
              } catch (err) {
                console.error('Failed to reload payment:', err);
              }
            }}
            onRetryError={(error) => {
              alert(error);
            }}
            className="mt-2"
          />
        </div>
      )}

      {/* Payment Status - Completed */}
      {paymentStatus === 'COMPLETED' && (
        <div style={{
          padding: "1rem 1.5rem", backgroundColor: "#dcfce7",
          borderRadius: "12px", border: "1px solid #86efac",
          color: "#166534", marginBottom: "2rem", textAlign: "center"
        }}>
          <strong>✅ Thanh toán thành công!</strong>
          {isTerminationPayment
            ? " Hệ thống đang cập nhật trạng thái kết thúc sớm hợp đồng..."
            : " Đang chuyển đến trang xác nhận..."}
        </div>
      )}

      {/* Countdown - Only show if payment is pending */}
      {(paymentStatus === 'PENDING' || paymentStatus === 'RETRY_PENDING') && payment?.expiredAt && (
        <ExpiryCountdown
          expiryDate={payment.expiredAt}
          onExpired={() => {
            setPaymentStatus('EXPIRED');
            alert('Thanh toán đã hết hạn. Vui lòng tạo thanh toán mới.');
          }}
          warningThresholdMinutes={720}
          className="mb-4"
        />
      )}

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
              {payment?.paymentType === 'DEPOSIT'
                ? 'Đặt cọc'
                : payment?.paymentType === 'PENALTY'
                  ? 'Phí kết thúc sớm'
                  : payment?.paymentType === 'EXTENSION'
                    ? `Phí gia hạn (${extensionInfo?.durationMonths || 0} tháng)`
                  : 'Thanh toán hàng tháng'}
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

      {/* QR Code - Only show if payment is PENDING or RETRY_PENDING */}
      {qrInfo && (paymentStatus === 'PENDING' || paymentStatus === 'RETRY_PENDING') && (
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
            src={qrInfo.qrImageUrl || qrInfo.qrCodeUrl}
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
          <li>
            {isTerminationPayment
              ? 'Hệ thống sẽ tự động xác nhận và kết thúc sớm hợp đồng sau khi nhận được thanh toán.'
              : 'Hệ thống sẽ tự động xác nhận sau khi nhận được thanh toán (trong vòng 30 giây)'}
          </li>
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

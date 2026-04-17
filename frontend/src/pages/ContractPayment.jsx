import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import rentalService from "../services/rentalService";
import paymentService from "../services/paymentService";
import contractExtensionService from "../services/contractExtensionService";
import authService from "../services/authService";
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
  const [refreshing, setRefreshing] = useState(false);

  // Guard against React StrictMode double-invoke (prevents duplicate createPayment calls)
  const isInitializingRef = useRef(false);

  // Extracted as useCallback so it can be called both on mount AND by the user (e.g. Tạo QR mới button)
  const initPayment = useCallback(async () => {
    // Prevent concurrent duplicate calls (React StrictMode runs effects twice in dev)
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    setError(null);
    setLoading(true);
    setPayment(null);
    setQrInfo(null);
    setPaymentStatus('PENDING');
    try {
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
        if (contractData.status === 'ACTIVE') {
          navigate(`/contracts/${id}`);
          return;
        }
      }

      if (isExtensionPayment) {
        if (!extensionId) throw new Error('Thiếu thông tin gia hạn.');
        extensionData = await contractExtensionService.getExtensionById(extensionId);
        if (!extensionData || extensionData.originalContractId !== Number(id)) {
          throw new Error('Yêu cầu gia hạn không hợp lệ.');
        }
        setExtensionInfo(extensionData);
      }

      const amountOverride = isTerminationPayment
        ? contractData.earlyTerminationFee
        : isExtensionPayment
          ? ((extensionData?.proposedMonthlyPayment || 0) * (extensionData?.durationMonths || 0))
          : (contractData.depositAmount || contractData.monthlyPayment);

      // Helper: check if a payment is still valid (PENDING and not expired)
      // IMPORTANT: expiredAt from API is UTC, must parse as UTC to avoid timezone shift
      const isStillValid = (p) => {
        if (p.status !== 'PENDING' && p.status !== 'RETRY_PENDING') return false;
        if (!p.expiredAt) return true;
        const expiryStr = typeof p.expiredAt === 'string' && !p.expiredAt.endsWith('Z') && !p.expiredAt.includes('+')
          ? p.expiredAt + 'Z'
          : p.expiredAt;
        return new Date(expiryStr) > new Date();
      };

      const existingPayments = await paymentService.getPaymentsByContract(id);
      console.log('[initPayment] existingPayments:', existingPayments);

      const relevantPayments = Array.isArray(existingPayments)
        ? existingPayments.filter((p) => p.paymentType === targetPaymentType)
        : [];

      let currentPayment;

      // 1. Completed payment
      const completedPayment = relevantPayments
        .filter(p => p.status === 'COMPLETED')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

      if (completedPayment) {
        currentPayment = completedPayment;
      } else {
        // 2. Still-valid PENDING payment
        const validPending = relevantPayments.find(p => isStillValid(p) && Number(p.amount) > 0);
        if (validPending) {
          currentPayment = validPending;
          console.log('[initPayment] Reusing valid pending:', currentPayment);
        } else {
          // 3. Create a fresh payment (expired/failed/missing)
          console.log('[initPayment] Creating new payment, amountOverride:', amountOverride);
          currentPayment = await paymentService.createPayment({
            contractId: parseInt(id, 10),
            amountOverride,
            paymentType: targetPaymentType
          });
          console.log('[initPayment] Created payment:', currentPayment);
        }
      }

      setPayment(currentPayment);

      if (currentPayment.status === 'PENDING' || currentPayment.status === 'RETRY_PENDING') {
        console.log('[initPayment] Fetching QR for paymentId:', currentPayment.paymentId);
        const qr = await paymentService.getPaymentQrInfo(currentPayment.paymentId);
        console.log('[initPayment] QR info:', qr);
        setQrInfo(qr);
      }

      setPaymentStatus(currentPayment.status);
      setLoading(false);
    } catch (err) {
      console.error("Error initializing payment:", err);
      // Log detailed error info for debugging
      const errMsg = err.response?.data?.message
        || err.response?.data?.detail
        || err.response?.data?.title
        || (err.response?.data && JSON.stringify(err.response.data))
        || err.message
        || "Không thể tải thông tin thanh toán";
      console.error("Error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: errMsg
      });
      setError(`[${err.response?.status || 'ERR'}] ${errMsg}`);
      setLoading(false);
    } finally {
      // Always release the guard so manual re-trigger (Tạo QR mới) can work
      isInitializingRef.current = false;
    }
  }, [id, navigate, isTerminationPayment, isExtensionPayment, extensionId, targetPaymentType]);

  // Load on mount
  useEffect(() => {
    initPayment();
  }, [initPayment]);

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

          // Refresh warehouse context so sidebar shows RENTER features immediately
          try {
            await authService.refreshWarehouseContext();
            window.dispatchEvent(new Event('authChange'));
          } catch (refreshErr) {
            console.warn('Failed to refresh warehouse context:', refreshErr);
          }

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
            ❌ {paymentStatus === 'FAILED' ? 'Thanh toán thất bại' : 'Mã QR đã hết hạn'}
          </div>
          <div style={{ marginBottom: "1rem", color: "#7f1d1d" }}>
            {paymentStatus === 'FAILED' 
              ? 'Không nhận được xác nhận từ ngân hàng. Vui lòng thử lại.'
              : 'Thời gian thanh toán đã hết (10 phút). Bấm nút bên dưới để tạo mã QR mới.'}
          </div>
          
          {paymentStatus === 'EXPIRED' ? (
            // For expired payments: re-run initPayment to create a new QR
            <button
              onClick={initPayment}
              disabled={loading}
              style={{
                padding: "0.6rem 1.5rem", borderRadius: "8px", border: "none",
                backgroundColor: "#dc2626", color: "#fff",
                fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.95rem", opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '⏳ Đang tạo...' : '🔄 Tạo mã QR mới'}
            </button>
          ) : (
            /* Retry Button for FAILED */
            <PaymentRetryButton
              paymentId={payment?.paymentId}
              onRetrySuccess={async (result) => {
                try {
                  const updatedStatus = await paymentService.getPaymentStatus(payment.paymentId);
                  setPayment(prev => prev ? { ...prev, ...updatedStatus } : prev);
                  setPaymentStatus(updatedStatus.status);
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
          )}
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
          key={payment.paymentId}
          expiryDate={payment.expiredAt}
          onExpired={() => {
            setPaymentStatus('EXPIRED');
          }}
          warningThresholdMinutes={15}
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

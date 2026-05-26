import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import rentalService from "../services/rentalService";
import paymentService from "../services/paymentService";
import contractExtensionService from "../services/contractExtensionService";

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const ContractPaymentSelection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const purpose = new URLSearchParams(location.search).get("purpose");
  const extensionId = new URLSearchParams(location.search).get("extensionId");
  const isTerminationPayment = purpose === "termination";
  const isExtensionPayment = purpose === "extension";

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [cashPaymentSuccess, setCashPaymentSuccess] = useState(false);
  const [extensionInfo, setExtensionInfo] = useState(null);
  const [hoveredMethod, setHoveredMethod] = useState(null);
  const [manualPayment, setManualPayment] = useState(null);
  const [proofMethod, setProofMethod] = useState("BANK_TRANSFER");
  const [proofAmount, setProofAmount] = useState("");
  const [proofTransactionCode, setProofTransactionCode] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [proofError, setProofError] = useState(null);

  const resolvePaymentType = useCallback((contractData) => {
    if (isTerminationPayment) return "PENALTY";
    if (isExtensionPayment) return "EXTENSION";
    return contractData?.depositAmount ? "DEPOSIT" : "MONTHLY";
  }, [isTerminationPayment, isExtensionPayment]);

  useEffect(() => {
    const loadContract = async () => {
      try {
        const contractData = await rentalService.getContractById(id);
        setContract(contractData);

        if (!isTerminationPayment && !isExtensionPayment) {
          const allowedStatuses = ["PENDING_PAYMENT", "SIGNED", "ACTIVE"];
          if (!allowedStatuses.includes(contractData.status)) {
            throw new Error("Hợp đồng chưa ở bước thanh toán.");
          }
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

        if (isExtensionPayment) {
          if (!extensionId) {
            throw new Error("Thiếu thông tin yêu cầu gia hạn.");
          }
          const ext = await contractExtensionService.getExtensionById(extensionId);
          if (!ext || ext.originalContractId !== Number(id)) {
            throw new Error("Yêu cầu gia hạn không hợp lệ.");
          }
          if (ext.status !== "APPROVED" && ext.status !== "PENDING_PAYMENT") {
            throw new Error("Yêu cầu gia hạn không còn ở trạng thái có thể thanh toán.");
          }
          setExtensionInfo(ext);
        }

        const paymentType = resolvePaymentType(contractData);
        const payments = await paymentService.getPaymentsByContract(Number(id));
        const completedPayment = payments.find((p) =>
          p.paymentType === paymentType && p.status === "COMPLETED"
        );
        if (!isTerminationPayment && !isExtensionPayment && contractData.status === "ACTIVE" && completedPayment) {
          navigate(`/contracts/${id}`);
          return;
        }
        const existingManual = payments.find((p) =>
          p.paymentType === paymentType
          && (p.paymentMethod === "CASH" || p.paymentMethod === "BANK_TRANSFER")
          && (p.status === "PENDING_CONFIRMATION" || p.status === "REUPLOAD_REQUESTED")
        );
        setManualPayment(existingManual || null);

        setLoading(false);
      } catch (err) {
        console.error("Error loading contract:", err);
        setError(err.response?.data?.message || "Không thể tải thông tin hợp đồng");
        setLoading(false);
      }
    };

    loadContract();
  }, [id, navigate, isTerminationPayment, isExtensionPayment, extensionId, resolvePaymentType]);

  const handleOnlinePayment = () => {
    const query = isTerminationPayment
      ? "?purpose=termination"
      : isExtensionPayment
        ? `?purpose=extension&extensionId=${extensionId}`
        : "";
    navigate(`/contracts/${id}/payment/online${query}`);
  };

  const handleCashPayment = () => {
    setProofError(null);
    setProofMethod(manualPayment?.paymentMethod || "BANK_TRANSFER");
    setProofAmount(manualPayment?.amount ? String(manualPayment.amount) : String(paymentAmount || ""));
    setProofTransactionCode(manualPayment?.transactionCode || "");
    setProofNote(manualPayment?.proofNote || "");
    setProofFile(null);
    setShowProofModal(true);
  };

  const parseAmountInput = (value) => {
    if (!value) return 0;
    const digits = String(value).replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  };

  const formatAmountInput = (value) => {
    const numeric = parseAmountInput(value);
    return numeric ? numeric.toLocaleString("vi-VN") : "";
  };

  const handleSubmitPaymentProof = async () => {
    const amountValue = parseAmountInput(proofAmount);
    if (!proofMethod) { setProofError("Vui lòng chọn phương thức thanh toán."); return; }
    if (!amountValue) { setProofError("Số tiền không hợp lệ."); return; }
    if (!proofTransactionCode.trim()) { setProofError("Vui lòng nhập mã giao dịch."); return; }
    if (!proofFile) { setProofError("Vui lòng tải lên chứng từ thanh toán."); return; }

    try {
      setSubmittingProof(true);
      setProofError(null);

      const uploadResult = await paymentService.uploadPaymentProof(proofFile);
      const paymentType = resolvePaymentType(contract);

      await paymentService.createCashPayment({
        contractId: parseInt(id, 10),
        amount: amountValue,
        paymentType,
        paymentMethod: proofMethod,
        transactionCode: proofTransactionCode.trim(),
        proofUrl: uploadResult?.url,
        proofNote: proofNote?.trim() || null
      });

      setCashPaymentSuccess(true);
      setShowProofModal(false);
    } catch (err) {
      console.error("Error submitting payment proof:", err);
      setProofError(err.response?.data?.message || "Không thể gửi xác nhận thanh toán");
    } finally {
      setSubmittingProof(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#0ea5e9",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
          }} />
          <div style={{ color: "#64748b", fontSize: "0.95rem" }}>Đang tải thông tin thanh toán...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "3rem 2rem", maxWidth: 560, margin: "0 auto" }}>
        <div style={{
          color: "#991b1b", padding: "1.2rem 1.5rem", backgroundColor: "#fef2f2",
          borderRadius: 14, border: "1px solid #fecaca", marginBottom: "1.5rem",
          fontSize: "0.95rem", lineHeight: 1.6,
        }}>
          {error}
        </div>
        <button
          onClick={() => navigate(`/contracts/${id}`)}
          style={{
            padding: "10px 24px", borderRadius: 10,
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem",
          }}
        >
          Quay lại hợp đồng
        </button>
      </div>
    );
  }

  const paymentAmount = isTerminationPayment
    ? (contract?.earlyTerminationFee || 0)
    : isExtensionPayment
      ? ((extensionInfo?.proposedMonthlyPayment || 0) * (extensionInfo?.durationMonths || 0))
      : (contract?.depositAmount || contract?.monthlyPayment || 0);

  const paymentLabel = isTerminationPayment
    ? "Phí kết thúc sớm"
    : isExtensionPayment
      ? `Phí gia hạn ${extensionInfo?.durationMonths || 0} tháng`
      : (contract?.depositAmount ? "Tiền đặt cọc" : "Thanh toán tháng đầu");

  return (
    <div style={{
      padding: "2rem", maxWidth: 640, margin: "0 auto",
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Cash Payment Success ── */}
      {cashPaymentSuccess && (
        <div style={{
          animation: "fadeUp 0.4s ease both",
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          borderRadius: 20, padding: "2.5rem 2rem", textAlign: "center",
          border: "1px solid #bbf7d0",
          boxShadow: "0 8px 32px rgba(34,197,94,0.12)",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.2rem",
            boxShadow: "0 6px 20px rgba(34,197,94,0.35)",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#14532d", margin: "0 0 0.6rem" }}>
            Đã gửi xác nhận thanh toán!
          </h2>
          <p style={{ color: "#166534", fontSize: "0.92rem", lineHeight: 1.7, margin: "0 0 1.8rem" }}>
            Chứng từ thanh toán đã được gửi đến chủ kho để xác minh.<br/>
            Bạn sẽ nhận thông báo sau khi chủ kho xử lý.
          </p>
          <button
            onClick={() => navigate(`/contracts/${id}`)}
            style={{
              padding: "12px 32px", borderRadius: 12,
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff", border: "none", fontWeight: 700, cursor: "pointer",
              fontSize: "0.95rem", boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
              transition: "all 0.18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(34,197,94,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(34,197,94,0.3)"; }}
          >
            Quay về hợp đồng
          </button>
        </div>
      )}

      {/* ── Payment Proof Modal ── */}
      {showProofModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fadeUp 0.2s ease",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "2rem 2rem 1.6rem",
            maxWidth: 520, width: "92%",
            boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.3rem" }}>
              Gửi xác nhận thanh toán
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6, margin: "0 0 1.4rem" }}>
              Vui lòng nhập thông tin và tải lên chứng từ để chủ kho xác minh.
            </p>

            {manualPayment?.status === "REUPLOAD_REQUESTED" && (
              <div style={{
                background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12,
                padding: "10px 12px", fontSize: "0.85rem", color: "#92400e",
                marginBottom: 14,
              }}>
                Chủ kho yêu cầu tải lại chứng từ. Vui lòng cập nhật thông tin và gửi lại.
              </div>
            )}

            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                Phương thức thanh toán
                <select
                  value={proofMethod}
                  onChange={(e) => setProofMethod(e.target.value)}
                  style={{
                    marginTop: 6, width: "100%", padding: "10px 12px",
                    borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff",
                    fontSize: "0.9rem", outline: "none",
                  }}
                >
                  <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                  <option value="CASH">Tiền mặt</option>
                </select>
              </label>

              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                Số tiền
                <input
                  type="text"
                  value={formatAmountInput(proofAmount)}
                  onChange={(e) => setProofAmount(e.target.value)}
                  placeholder="250.000"
                  style={{
                    marginTop: 6, width: "100%", padding: "10px 12px",
                    borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff",
                    fontSize: "0.9rem", outline: "none",
                  }}
                />
              </label>

              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                Mã giao dịch
                <input
                  type="text"
                  value={proofTransactionCode}
                  onChange={(e) => setProofTransactionCode(e.target.value)}
                  placeholder="ABC123"
                  style={{
                    marginTop: 6, width: "100%", padding: "10px 12px",
                    borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff",
                    fontSize: "0.9rem", outline: "none",
                  }}
                />
              </label>

              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                Tải lên chứng từ
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  style={{ marginTop: 6, width: "100%" }}
                />
              </label>

              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                Ghi chú
                <textarea
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="Tôi đã chuyển khoản lúc 8h sáng"
                  style={{
                    marginTop: 6, width: "100%", padding: "10px 12px",
                    borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff",
                    fontSize: "0.9rem", outline: "none", minHeight: 90, resize: "vertical",
                  }}
                />
              </label>
            </div>

            {proofError && (
              <div style={{
                marginTop: 12, padding: "10px 12px",
                background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
                color: "#991b1b", fontSize: "0.85rem",
              }}>
                {proofError}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                onClick={() => setShowProofModal(false)}
                style={{
                  flex: 1, padding: "11px 20px", borderRadius: 12,
                  border: "1.5px solid #e2e8f0", background: "#fff",
                  color: "#475569", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitPaymentProof}
                disabled={submittingProof}
                style={{
                  flex: 1, padding: "11px 20px", borderRadius: 12, border: "none",
                  background: submittingProof ? "#94a3b8" : "linear-gradient(135deg, #0ea5e9, #2563eb)",
                  color: "#fff", fontWeight: 700, fontSize: "0.9rem",
                  cursor: submittingProof ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 16px rgba(37,99,235,0.28)",
                  transition: "all 0.15s",
                }}
              >
                {submittingProof ? "Đang gửi..." : "Gửi xác nhận thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ animation: "fadeUp 0.3s ease both" }}>
        <button
          onClick={() => navigate(`/contracts/${id}`)}
          style={{
            padding: "8px 16px", borderRadius: 10,
            border: "1.5px solid #e2e8f0", background: "#fff",
            color: "#475569", fontWeight: 600, cursor: "pointer",
            fontSize: "0.88rem", marginBottom: "1.5rem",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.background = "#f8fafc"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}
        >
          ← Quay lại
        </button>

        <h1 style={{
          fontSize: "1.6rem", fontWeight: 800, color: "#0f172a",
          margin: "0 0 4px", letterSpacing: "-0.02em",
        }}>
          Thanh toán hợp đồng
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
          {contract?.contractNumber}
        </p>
      </div>

      {!cashPaymentSuccess && (
        <>
          {/* ── Payment Amount Card ── */}
          <div style={{
            animation: "fadeUp 0.35s ease both",
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)",
            borderRadius: 18, padding: "1.8rem 2rem",
            marginBottom: "1.8rem", position: "relative", overflow: "hidden",
          }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(14,165,233,0.1)" }} />
            <div style={{ position: "absolute", bottom: -15, right: 60, width: 70, height: 70, borderRadius: "50%", background: "rgba(14,165,233,0.06)" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Số tiền cần thanh toán
              </div>
              <div style={{
                fontSize: "2.2rem", fontWeight: 800, color: "#fff",
                letterSpacing: "-0.02em", marginBottom: 6,
              }}>
                {formatCurrency(paymentAmount)}
              </div>
              <div style={{
                display: "inline-block",
                padding: "4px 12px", borderRadius: 20,
                background: "rgba(14,165,233,0.2)", color: "#7dd3fc",
                fontSize: "0.8rem", fontWeight: 600,
              }}>
                {paymentLabel}
              </div>
            </div>
          </div>

          {/* ── Payment Methods ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.4s ease both" }}>
            {/* Online Payment */}
            <button
              onClick={handleOnlinePayment}
              onMouseEnter={() => setHoveredMethod("online")}
              onMouseLeave={() => setHoveredMethod(null)}
              style={{
                padding: "1.4rem 1.6rem", borderRadius: 16,
                border: hoveredMethod === "online" ? "2px solid #0ea5e9" : "2px solid #e2e8f0",
                background: hoveredMethod === "online" ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)" : "#fff",
                cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: "1.2rem",
                transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                transform: hoveredMethod === "online" ? "translateY(-2px)" : "translateY(0)",
                boxShadow: hoveredMethod === "online"
                  ? "0 8px 28px rgba(14,165,233,0.15)"
                  : "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              {/* Number indicator */}
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: hoveredMethod === "online"
                  ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                  : "linear-gradient(135deg, #e0f2fe, #bae6fd)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "1.1rem",
                color: hoveredMethod === "online" ? "#fff" : "#0284c7",
                transition: "all 0.25s",
                flexShrink: 0,
              }}>
                1
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "1.05rem", fontWeight: 700, color: "#0f172a",
                  marginBottom: 4,
                }}>
                  Thanh toán trực tuyến
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 }}>
                  Quét mã QR hoặc chuyển khoản ngân hàng
                </div>
                <div style={{
                  marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap",
                }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 6,
                    background: "#f0f9ff", color: "#0369a1",
                    fontSize: "0.75rem", fontWeight: 600,
                  }}>
                    Nhanh chóng
                  </span>
                  <span style={{
                    padding: "3px 10px", borderRadius: 6,
                    background: "#f0f9ff", color: "#0369a1",
                    fontSize: "0.75rem", fontWeight: 600,
                  }}>
                    Tự động xác nhận
                  </span>
                </div>
              </div>
              <div style={{
                color: hoveredMethod === "online" ? "#0284c7" : "#cbd5e1",
                fontSize: "1.2rem", fontWeight: 700,
                transition: "all 0.25s",
                transform: hoveredMethod === "online" ? "translateX(3px)" : "translateX(0)",
              }}>
                →
              </div>
            </button>

            {/* Cash Payment */}
            <button
              onClick={handleCashPayment}
              disabled={submittingProof}
              onMouseEnter={() => !submittingProof && setHoveredMethod("cash")}
              onMouseLeave={() => setHoveredMethod(null)}
              style={{
                padding: "1.4rem 1.6rem", borderRadius: 16,
                border: hoveredMethod === "cash" ? "2px solid #22c55e" : "2px solid #e2e8f0",
                background: hoveredMethod === "cash" ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : "#fff",
                cursor: submittingProof ? "not-allowed" : "pointer",
                opacity: submittingProof ? 0.6 : 1,
                textAlign: "left",
                display: "flex", alignItems: "center", gap: "1.2rem",
                transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
                transform: hoveredMethod === "cash" ? "translateY(-2px)" : "translateY(0)",
                boxShadow: hoveredMethod === "cash"
                  ? "0 8px 28px rgba(34,197,94,0.15)"
                  : "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: hoveredMethod === "cash"
                  ? "linear-gradient(135deg, #22c55e, #16a34a)"
                  : "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "1.1rem",
                color: hoveredMethod === "cash" ? "#fff" : "#16a34a",
                transition: "all 0.25s",
                flexShrink: 0,
              }}>
                2
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "1.05rem", fontWeight: 700, color: "#0f172a",
                  marginBottom: 4,
                }}>
                  {submittingProof ? "Đang gửi..." : "Gửi xác nhận thanh toán"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 }}>
                  Gửi chứng từ để chủ kho xác minh thanh toán
                </div>
                <div style={{
                  marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap",
                }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 6,
                    background: "#f0fdf4", color: "#15803d",
                    fontSize: "0.75rem", fontWeight: 600,
                  }}>
                    Tiền mặt
                  </span>
                  <span style={{
                    padding: "3px 10px", borderRadius: 6,
                    background: "#f0fdf4", color: "#15803d",
                    fontSize: "0.75rem", fontWeight: 600,
                  }}>
                    Cần xác nhận từ chủ kho
                  </span>
                </div>
              </div>
              <div style={{
                color: hoveredMethod === "cash" ? "#16a34a" : "#cbd5e1",
                fontSize: "1.2rem", fontWeight: 700,
                transition: "all 0.25s",
                transform: hoveredMethod === "cash" ? "translateX(3px)" : "translateX(0)",
              }}>
                →
              </div>
            </button>
          </div>

          {/* ── Notes ── */}
          <div style={{
            marginTop: "1.8rem", padding: "1.2rem 1.4rem",
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            borderRadius: 14, border: "1px solid #fde68a",
            animation: "fadeUp 0.45s ease both",
          }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#92400e", marginBottom: 8 }}>
              Lưu ý quan trọng
            </div>
            <ul style={{
              margin: 0, paddingLeft: "1.3rem",
              fontSize: "0.84rem", color: "#78350f",
              lineHeight: 1.8,
            }}>
              <li>Thanh toán đúng số tiền hiển thị trên màn hình.</li>
              <li>Nội dung chuyển khoản phải chính xác theo mã thanh toán.</li>
              <li>Thanh toán trực tuyến sẽ được hệ thống xác nhận tự động.</li>
              <li>Thanh toán tiền mặt cần chủ kho xác nhận trước khi ghi nhận hoàn tất.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default ContractPaymentSelection;

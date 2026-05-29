import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import paymentService from "../services/paymentService";
import axiosClient from "../services/axiosClient";
import { useToast } from "../context/ToastContext";

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const formatTimeOnly = (dateStr) => {
  if (!dateStr) return "—";
  const raw = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
  return new Date(raw).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const formatMethod = (method) => {
  if (method === "BANK_TRANSFER") return "Chuyển khoản ngân hàng";
  if (method === "CASH") return "Tiền mặt";
  return method || "—";
};

const apiBase = axiosClient.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
const buildFileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${apiBase}${url}`;
};

const PendingCashPayments = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectPaymentId, setRejectPaymentId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReuploadModal, setShowReuploadModal] = useState(false);
  const [reuploadPaymentId, setReuploadPaymentId] = useState(null);
  const [reuploadReason, setReuploadReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [searchKeyword, setSearchKeyword] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await paymentService.getOwnerCashPayments();
      setPayments(data);
      setError(null);
    } catch (err) {
      console.error("Error loading pending payments:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleApprove = async (paymentId) => {
    if (!window.confirm("Xác nhận đã nhận thanh toán tiền mặt?")) return;
    try {
      setProcessingId(paymentId);
      await paymentService.confirmCashPayment(paymentId, true);
      showToast("Đã xác nhận thanh toán thành công!", "success");
      loadPayments();
    } catch (err) {
      showToast(err.response?.data?.message || "Không thể xác nhận thanh toán", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (paymentId) => {
    setRejectPaymentId(paymentId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) { showToast("Vui lòng nhập lý do từ chối", "warning"); return; }
    try {
      setProcessingId(rejectPaymentId);
      await paymentService.confirmCashPayment(rejectPaymentId, false, rejectReason);
      showToast("Đã từ chối thanh toán", "success");
      setShowRejectModal(false);
      loadPayments();
    } catch (err) {
      showToast(err.response?.data?.message || "Không thể từ chối thanh toán", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestReuploadClick = (paymentId) => {
    setReuploadPaymentId(paymentId);
    setReuploadReason("");
    setShowReuploadModal(true);
  };

  const handleReuploadConfirm = async () => {
    try {
      setProcessingId(reuploadPaymentId);
      await paymentService.requestPaymentReupload(reuploadPaymentId, reuploadReason.trim() || null);
      showToast("Đã yêu cầu tải lại chứng từ", "success");
      setShowReuploadModal(false);
      loadPayments();
    } catch (err) {
      showToast(err.response?.data?.message || "Không thể yêu cầu tải lại chứng từ", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const matchPayment = (payment) => {
    if (!normalizedKeyword) return true;
    const searchable = [
      payment.paymentCode, payment.contract?.contractNumber,
      payment.contract?.renterName, payment.contract?.warehouse?.name,
    ].filter(Boolean).join(" ").toLowerCase();
    return searchable.includes(normalizedKeyword);
  };

  const pendingPayments = payments.filter((p) => ["PENDING_CONFIRMATION", "REUPLOAD_REQUESTED"].includes(p.status));
  const confirmedPayments = payments.filter((p) => ["COMPLETED", "CANCELLED"].includes(p.status));
  const filteredPending = pendingPayments.filter(matchPayment);
  const filteredConfirmed = confirmedPayments.filter(matchPayment);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#0ea5e9",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
          }} />
          <div style={{ color: "#64748b", fontSize: "0.92rem" }}>Đang tải danh sách thanh toán...</div>
        </div>
      </div>
    );
  }

  const renderCard = (payment) => {
    const isProcessing = processingId === payment.paymentId;
    const isVerificationPending = payment.status === "PENDING_CONFIRMATION";
    const isReuploadRequested = payment.status === "REUPLOAD_REQUESTED";
    const isRejected = payment.status === "CANCELLED";
    const statusLabel = isVerificationPending
      ? "Chờ xác minh"
      : isReuploadRequested
        ? "Yêu cầu tải lại"
        : isRejected
          ? "Đã từ chối"
          : "Đã xác nhận";
    const statusStyle = isVerificationPending
      ? { background: "linear-gradient(135deg, #fef3c7, #fde68a)", color: "#92400e" }
      : isReuploadRequested
        ? { background: "linear-gradient(135deg, #fee2e2, #fecaca)", color: "#991b1b" }
        : isRejected
          ? { background: "linear-gradient(135deg, #fee2e2, #fecaca)", color: "#991b1b" }
          : { background: "linear-gradient(135deg, #dcfce7, #bbf7d0)", color: "#166534" };
    const proofTime = payment.proofSubmittedAt || payment.createdAt;
    const proofUrl = buildFileUrl(payment.proofUrl);
    const isImageProof = proofUrl && /\.(png|jpg|jpeg)$/i.test(proofUrl);
    return (
      <div
        key={payment.paymentId}
        style={{
          background: "#fff", borderRadius: 16, border: "1px solid #eef1f6",
          padding: "1.4rem 1.6rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
          animation: "fadeUp 0.35s ease both",
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
      >
        {/* Top row: badge + code + amount */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              padding: "4px 12px", borderRadius: 20,
              background: statusStyle.background,
              color: statusStyle.color,
              fontSize: "0.8rem", fontWeight: 700,
            }}>
              {statusLabel}
            </span>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>
              {payment.paymentCode}
            </span>
          </div>
          <div style={{
            fontSize: "1.4rem", fontWeight: 800, color: "#0f172a",
            letterSpacing: "-0.02em",
          }}>
            {formatCurrency(payment.amount)}
          </div>
        </div>

        {/* Info grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "10px 24px", marginBottom: "1rem",
        }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
              Hợp đồng
            </div>
            <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
              {payment.contract?.contractNumber || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
              Khách thuê
            </div>
            <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
              {payment.contract?.renterName || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
              Kho
            </div>
            <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
              {payment.contract?.warehouse?.name || "—"}
            </div>
          </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
                Thời gian
              </div>
              <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
                {formatTimeOnly(proofTime)}
              </div>
            </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
            Chứng từ thanh toán
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
            <div style={{ fontSize: "0.85rem", color: "#475569" }}>
              Số tiền: <strong style={{ color: "#0f172a" }}>{formatCurrency(payment.amount)}</strong>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#475569" }}>
              Mã giao dịch: <strong style={{ color: "#0f172a" }}>{payment.transactionCode || "—"}</strong>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#475569" }}>
              Ảnh chứng từ:{" "}
              {proofUrl ? (
                <a href={proofUrl} target="_blank" rel="noreferrer" style={{ color: "#0ea5e9", fontWeight: 700 }}>
                  đính kèm
                </a>
              ) : (
                <span style={{ color: "#94a3b8" }}>—</span>
              )}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#475569" }}>
              Phương thức: <strong style={{ color: "#0f172a" }}>{formatMethod(payment.paymentMethod)}</strong>
            </div>
          </div>
          {isImageProof && (
            <div style={{ marginTop: 10 }}>
              <img
                src={proofUrl}
                alt="Payment proof"
                style={{ width: "100%", maxWidth: 320, borderRadius: 10, border: "1px solid #e2e8f0" }}
              />
            </div>
          )}
          {payment.proofNote && (
            <div style={{ marginTop: 10, fontSize: "0.85rem", color: "#475569" }}>
              Ghi chú: <span style={{ color: "#0f172a", fontWeight: 600 }}>{payment.proofNote}</span>
            </div>
          )}
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: "#f1f5f9", margin: "0 -0.4rem 1rem" }} />

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {isVerificationPending && (
            <>
              <button
                onClick={() => handleApprove(payment.paymentId)}
                disabled={isProcessing}
                style={{
                  padding: "9px 20px", borderRadius: 10, border: "none",
                  background: isProcessing ? "#94a3b8" : "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff", fontWeight: 700, fontSize: "0.85rem",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 10px rgba(34,197,94,0.25)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!isProcessing) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(34,197,94,0.35)"; }}}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(34,197,94,0.25)"; }}
              >
                {isProcessing ? "Đang xử lý..." : "Xác nhận thanh toán"}
              </button>
              <button
                onClick={() => handleRejectClick(payment.paymentId)}
                disabled={isProcessing}
                style={{
                  padding: "9px 20px", borderRadius: 10,
                  border: "1.5px solid #fca5a5", background: "#fff",
                  color: "#dc2626", fontWeight: 700, fontSize: "0.85rem",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  opacity: isProcessing ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#f87171"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#fca5a5"; }}
              >
                Từ chối thanh toán
              </button>
              <button
                onClick={() => handleRequestReuploadClick(payment.paymentId)}
                disabled={isProcessing}
                style={{
                  padding: "9px 20px", borderRadius: 10,
                  border: "1.5px solid #fde68a", background: "#fff",
                  color: "#92400e", fontWeight: 700, fontSize: "0.85rem",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  opacity: isProcessing ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fffbeb"; e.currentTarget.style.borderColor = "#fcd34d"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#fde68a"; }}
              >
                Yêu cầu tải lại chứng từ
              </button>
            </>
          )}
          <button
            onClick={() => navigate(`/contracts/${payment.contract?.contractId}`)}
            style={{
              padding: "9px 20px", borderRadius: 10,
              border: "1.5px solid #e2e8f0", background: "#fff",
              color: "#475569", fontWeight: 600, fontSize: "0.85rem",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.background = "#f8fafc"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}
          >
            Xem hợp đồng
          </button>
        </div>
      </div>
    );
  };

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
          Xác nhận thanh toán
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", margin: 0, position: "relative" }}>
          Xác minh chứng từ thanh toán từ khách thuê
        </p>

        {/* Stats */}
        <div style={{
          display: "flex", gap: 16, marginTop: 20, position: "relative",
        }}>
          <div style={{
            padding: "10px 20px", borderRadius: 12,
            background: "rgba(255,255,255,0.08)", backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Chờ xác minh
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fbbf24" }}>
              {pendingPayments.length}
            </div>
          </div>
          <div style={{
            padding: "10px 20px", borderRadius: 12,
            background: "rgba(255,255,255,0.08)", backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Đã xử lý
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#4ade80" }}>
              {confirmedPayments.length}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          color: "#991b1b", padding: "12px 16px", background: "#fef2f2",
          borderRadius: 12, border: "1px solid #fecaca", marginBottom: 16,
          fontSize: "0.9rem",
        }}>
          {error}
        </div>
      )}

      {payments.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "#fff", borderRadius: 18,
          border: "1px solid #eef1f6",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{ color: "#475569", fontSize: "1.05rem", fontWeight: 600 }}>
            Không có thanh toán cần xác minh
          </div>
          <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 4 }}>
            Tất cả giao dịch đã được xử lý
          </div>
        </div>
      ) : (
        <>
          {/* ── Tabs ── */}
          <div style={{
            display: "flex", gap: 4, marginBottom: 20,
            background: "#f1f5f9", borderRadius: 14, padding: 4,
          }}>
            {[
              { key: "pending", label: `Chờ xác minh (${pendingPayments.length})` },
              { key: "confirmed", label: `Đã xử lý (${confirmedPayments.length})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: 11,
                  border: "none", fontWeight: 700, fontSize: "0.88rem",
                  cursor: "pointer", transition: "all 0.2s",
                  background: activeTab === tab.key ? "#fff" : "transparent",
                  color: activeTab === tab.key ? "#0f172a" : "#64748b",
                  boxShadow: activeTab === tab.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Search ── */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo mã thanh toán, mã hợp đồng, khách thuê, tên kho..."
              style={{
                width: "100%", maxWidth: 520, padding: "10px 16px",
                borderRadius: 12, border: "1.5px solid #e2e8f0",
                fontSize: "0.9rem", outline: "none", background: "#fff",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#0ea5e9"}
              onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
            />
          </div>

          {/* ── Cards ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {activeTab === "pending" ? (
              filteredPending.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: "0.92rem", padding: "2rem 0", textAlign: "center" }}>
                  {normalizedKeyword ? "Không tìm thấy thanh toán phù hợp." : "Không có thanh toán chờ xác minh."}
                </div>
              ) : (
                filteredPending.map((p) => renderCard(p))
              )
            ) : (
              filteredConfirmed.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: "0.92rem", padding: "2rem 0", textAlign: "center" }}>
                  {normalizedKeyword ? "Không tìm thấy thanh toán phù hợp." : "Chưa có thanh toán nào đã xử lý."}
                </div>
              ) : (
                filteredConfirmed.map((p) => renderCard(p))
              )
            )}
          </div>
        </>
      )}

      {/* ── Reject Modal ── */}
      {showRejectModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fadeUp 0.2s ease",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "2rem 2rem 1.5rem",
            maxWidth: 460, width: "90%",
            boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1rem",
              boxShadow: "0 6px 20px rgba(239,68,68,0.3)",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>

            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.4rem", textAlign: "center" }}>
              Từ chối thanh toán
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.88rem", textAlign: "center", margin: "0 0 1.2rem", lineHeight: 1.5 }}>
              Vui lòng nhập lý do từ chối thanh toán
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Chưa nhận được tiền mặt từ khách..."
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 12,
                border: "1.5px solid #e2e8f0", fontSize: "0.9rem",
                minHeight: 100, resize: "vertical", marginBottom: "1.2rem",
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#f87171"}
              onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
            />

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{
                  flex: 1, padding: "11px 20px", borderRadius: 12,
                  border: "1.5px solid #e2e8f0", background: "#fff",
                  color: "#475569", fontWeight: 700, fontSize: "0.9rem",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}
              >
                Hủy
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!!processingId}
                style={{
                  flex: 1, padding: "11px 20px", borderRadius: 12, border: "none",
                  background: processingId ? "#94a3b8" : "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff", fontWeight: 700, fontSize: "0.9rem",
                  cursor: processingId ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
                  transition: "all 0.15s",
                }}
              >
                {processingId ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reupload Modal ── */}
      {showReuploadModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fadeUp 0.2s ease",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "2rem 2rem 1.5rem",
            maxWidth: 460, width: "90%",
            boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1rem",
              boxShadow: "0 6px 20px rgba(245,158,11,0.3)",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-2.64-6.36"/>
                <polyline points="22 4 21 12 13 11"/>
              </svg>
            </div>

            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.4rem", textAlign: "center" }}>
              Yêu cầu tải lại chứng từ
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.88rem", textAlign: "center", margin: "0 0 1.2rem", lineHeight: 1.5 }}>
              Bạn có thể ghi chú lý do để khách thuê cập nhật chứng từ đúng hơn.
            </p>

            <textarea
              value={reuploadReason}
              onChange={(e) => setReuploadReason(e.target.value)}
              placeholder="Ví dụ: Ảnh bị mờ, mã giao dịch chưa rõ..."
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 12,
                border: "1.5px solid #e2e8f0", fontSize: "0.9rem",
                minHeight: 90, resize: "vertical", marginBottom: "1.2rem",
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#f59e0b"}
              onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
            />

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowReuploadModal(false)}
                style={{
                  flex: 1, padding: "11px 20px", borderRadius: 12,
                  border: "1.5px solid #e2e8f0", background: "#fff",
                  color: "#475569", fontWeight: 700, fontSize: "0.9rem",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}
              >
                Hủy
              </button>
              <button
                onClick={handleReuploadConfirm}
                disabled={!!processingId}
                style={{
                  flex: 1, padding: "11px 20px", borderRadius: 12, border: "none",
                  background: processingId ? "#94a3b8" : "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#fff", fontWeight: 700, fontSize: "0.9rem",
                  cursor: processingId ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
                  transition: "all 0.15s",
                }}
              >
                {processingId ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingCashPayments;

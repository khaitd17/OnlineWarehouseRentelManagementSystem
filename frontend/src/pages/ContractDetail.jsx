import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import rentalService from "../services/rentalService";
import paymentService from "../services/paymentService";
import api from "../services/axiosClient";
import ContractSigningModal from "../components/ContractSigningModal";
import TerminateContractModal from "../components/TerminateContractModal";
import SigningHistoryTimeline from "../components/SigningHistoryTimeline";
import AuditLogList from "../components/AuditLogList";
import ExpiryCountdown from "../components/ExpiryCountdown";
import CustomAreaSelectorModal from "../components/warehouse/CustomAreaSelectorModal";


const statusConfig = {
  DRAFT:      { bg: "#f1f5f9", color: "#64748b", label: "Bản nháp" },
  NEGOTIATING: { bg: "#dbeafe", color: "#2563eb", label: "Đang đàm phán" },
  REVISION_REQUESTED: { bg: "#fef3c7", color: "#d97706", label: "Yêu cầu chỉnh sửa" },
  APPROVED_FOR_SIGNING: { bg: "#dcfce7", color: "#16a34a", label: "Sẵn sàng ký" },
  PENDING_OWNER_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ chủ kho ký" },
  PENDING_RENTER_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ người thuê ký" },
  PENDING_SIGNATURE: { bg: "#fef3c7", color: "#d97706", label: "Chờ xác thực ký" },
  SIGNED:     { bg: "#dbeafe", color: "#2563eb", label: "Đã ký" },
  PENDING_PAYMENT: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ thanh toán" },
  PENDING_PAYMENT_CONFIRMATION: { bg: "#dbeafe", color: "#2563eb", label: "Chờ xác nhận từ chủ kho" },
  PAYMENT_FAILED: { bg: "#fee2e2", color: "#dc2626", label: "Thanh toán thất bại" },
  ACTIVE:     { bg: "#dcfce7", color: "#16a34a", label: "Đang hiệu lực" },
  COMPLETED:  { bg: "#e0e7ff", color: "#6366f1", label: "Đã hoàn thành" },
  CLOSED:     { bg: "#f1f5f9", color: "#64748b", label: "Đã đóng" },
  EXPIRED:    { bg: "#fef3c7", color: "#d97706", label: "Đã hết hạn" },
  TERMINATED: { bg: "#fee2e2", color: "#dc2626", label: "Đã chấm dứt" },
  CANCELLED:  { bg: "#fee2e2", color: "#dc2626", label: "Đã hủy" },
  CANCELLED_BY_USER: { bg: "#fee2e2", color: "#dc2626", label: "Người dùng hủy" },
  CANCELLED_BY_OWNER: { bg: "#fee2e2", color: "#dc2626", label: "Chủ kho hủy" },
  CANCELLED_NO_PAYMENT: { bg: "#fee2e2", color: "#dc2626", label: "Hủy - Không thanh toán" },
  OVERDUE:    { bg: "#fee2e2", color: "#dc2626", label: "Quá hạn" },
  EXPIRED_SIGNATURE: { bg: "#fee2e2", color: "#dc2626", label: "Hết hạn ký" },
  EXPIRED_PAYMENT: { bg: "#fee2e2", color: "#dc2626", label: "Hết hạn thanh toán" },
  // 2-party approval statuses
  PENDING_TERMINATION: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ xác nhận kết thúc sớm" },
  PENDING_CLOSE: { bg: "#fef3c7", color: "#f59e0b", label: "Chờ xác nhận kết thúc" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const revisionSectionOptions = [
  { value: "rental price", label: "Giá thuê" },
  { value: "deposit", label: "Tiền đặt cọc" },
  { value: "payment terms", label: "Điều khoản thanh toán" },
  { value: "violation terms", label: "Điều khoản vi phạm" },
  { value: "termination terms", label: "Điều khoản chấm dứt" },
  { value: "other", label: "Khác" }
];

const revisionStatusDisplay = {
  OPEN: { label: "Đang chờ", color: "#d97706", bg: "#fef3c7" },
  ACCEPTED: { label: "Đồng ý", color: "#16a34a", bg: "#dcfce7" },
  REJECTED: { label: "Từ chối", color: "#dc2626", bg: "#fee2e2" },
  RESOLVED: { label: "Đã áp dụng", color: "#2563eb", bg: "#dbeafe" }
};

const InfoRow = ({ label, value }) => (
  <div style={{
    padding: "10px 14px", borderRadius: 10,
    background: "#f8fafc", border: "1px solid #f1f5f9",
    display: "flex", flexDirection: "column", gap: 3,
  }}>
    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {label}
    </span>
    <span style={{ fontSize: "0.92rem", color: "#0f172a", fontWeight: 600 }}>{value || "—"}</span>
  </div>
);

const Section = ({ title, children, action, accent = "#0ea5e9" }) => (
  <div style={{
    backgroundColor: "#fff", borderRadius: 18, overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
    border: "1px solid #eef1f6", marginBottom: "1rem",
  }}>
    <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44, transparent)` }} />
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: "0.82rem", fontWeight: 800, color: accent, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </h2>
        {action}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {children}
      </div>
    </div>
  </div>
);

const CollapsibleSection = ({ title, isOpen, onToggle, children, accent = "#64748b" }) => (
  <div style={{
    backgroundColor: "#fff", borderRadius: 18, overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
    border: "1px solid #eef1f6", marginBottom: "1rem",
  }}>
    <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44, transparent)` }} />
    <div style={{ padding: "20px 24px" }}>
      <div
        onClick={onToggle}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}>
        <h2 style={{ fontSize: "0.82rem", fontWeight: 800, color: accent, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </h2>
        <span style={{
          width: 28, height: 28, borderRadius: 8,
          background: isOpen ? `${accent}12` : "#f8fafc",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.85rem", fontWeight: 800, color: accent,
          transition: "all 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)",
        }}>
          ▾
        </span>
      </div>
      {isOpen && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
          {children}
        </div>
      )}
    </div>
  </div>
);

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [revisionThreads, setRevisionThreads] = useState([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [revisionSection, setRevisionSection] = useState("rental price");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [applyingChanges, setApplyingChanges] = useState(false);
  const [approvingSigning, setApprovingSigning] = useState(false);
  const [sendingDraft, setSendingDraft] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [changeForm, setChangeForm] = useState({
    monthlyPayment: "",
    depositAmount: "",
    startDate: "",
    durationMonths: "",
    terms: ""
  });
  const [resolveAcceptedThreads, setResolveAcceptedThreads] = useState(true);
  const revisionSectionLabels = revisionSectionOptions.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {});

  // New states for additional features
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [signingHistory, setSigningHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showSigningHistory, setShowSigningHistory] = useState(true);

  // Modal states
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);
  
  // Approval action states
  const [processingApproval, setProcessingApproval] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [terminationFee, setTerminationFee] = useState('');
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [reuploadPayment, setReuploadPayment] = useState(null);

  // Floor plan state
  const [warehouseInfo, setWarehouseInfo] = useState(null);

  // Zone assignment state
  const [showZoneModal, setShowZoneModal] = useState(false);
  const reloadContract = () => {
    setRefreshKey(k => k + 1);
  };

  const scrollToTab = (tab) => {
    if (tab === "overview") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(`contract-tab-${tab}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    navigate({
      pathname: location.pathname,
      search: `?tab=${tab}`
    }, { replace: true });
    scrollToTab(tab);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
      setTimeout(() => scrollToTab(tab), 100);
    }
  }, [location.search]);

  // Handle approve termination/close
  const handleApprove = async ({ useModalFee = false } = {}) => {
    if (!window.confirm("Bạn có chắc chắn muốn đồng ý yêu cầu này?")) return;
    setProcessingApproval(true);
    try {
      const fee = useModalFee
        ? (terminationFee === "" ? null : Number(terminationFee))
        : null;

      if (useModalFee && fee !== null && (Number.isNaN(fee) || fee < 0)) {
        alert("Phí kết thúc sớm không hợp lệ");
        return;
      }

      const result = await rentalService.approveTermination(contract.contractId, fee);

      const success = result?.success ?? result?.Success;
      const message = result?.message ?? result?.Message;
      const isFullyApproved = result?.isFullyApproved ?? result?.IsFullyApproved;
      const earlyTerminationFee = result?.earlyTerminationFee ?? result?.EarlyTerminationFee ?? 0;
      const requiresPayment = result?.requiresPayment ?? result?.RequiresPayment;

      if (!success) {
        alert(message || "Có lỗi xảy ra khi xác nhận");
        return;
      }

      if (requiresPayment) {
        setTerminationFee('');
        setShowApprovalModal(false);

        if (contract?.isCurrentUserRenter) {
          alert(message || "Vui lòng thanh toán phí kết thúc sớm để hoàn tất.");
          navigate(`/contracts/${contract.contractId}/payment?purpose=termination`);
          return;
        }

        alert(message || "Đã xác nhận thành công. Đang chờ người thuê thanh toán.");
        reloadContract();
        return;
      }

      if (isFullyApproved) {
        alert(message || "Hợp đồng đã kết thúc thành công!");
        setTerminationFee('');
        setShowApprovalModal(false);
        reloadContract();
        return;
      }

      if (contract?.isCurrentUserOwner && useModalFee) {
        const feeText = Number(earlyTerminationFee) > 0
          ? `mức phí ${formatCurrency(earlyTerminationFee)}`
          : "mức phí 0đ";
        alert(message || `Đã duyệt yêu cầu và gửi ${feeText} cho người thuê.`);
      } else {
        alert(message || "Đã xác nhận thành công! Đang chờ bên còn lại xác nhận.");
      }

      setTerminationFee('');
      setShowApprovalModal(false);
      reloadContract();
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra khi xác nhận");
    } finally {
      setProcessingApproval(false);
    }
  };

  // Handle reject termination/close
  const handleReject = async () => {
    const reason = window.prompt("Nhập lý do từ chối (nếu có):");
    setProcessingApproval(true);
    try {
      await rentalService.rejectTermination(contract.contractId, reason || "");
      alert("Đã từ chối yêu cầu!");
      reloadContract();
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra khi từ chối");
    } finally {
      setProcessingApproval(false);
    }
  };

  // Handle request close
  const handleRequestClose = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn yêu cầu kết thúc hợp đồng này?")) return;
    setProcessingApproval(true);
    try {
      await rentalService.requestClose(contract.contractId);
      alert("Yêu cầu kết thúc đã được gửi. Đang chờ bên còn lại xác nhận.");
      reloadContract();
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu");
    } finally {
      setProcessingApproval(false);
    }
  };

  // Fetch contract
  useEffect(() => {
    setLoading(true);
    rentalService.getContractById(id)
      .then(data => {
        setContract(data);
        setChangeForm({
          monthlyPayment: data?.monthlyPayment ?? "",
          depositAmount: data?.depositAmount ?? "",
          startDate: data?.startDate ? new Date(data.startDate).toISOString().slice(0, 10) : "",
          durationMonths: data?.startDate && data?.endDate
            ? Math.max(1, Math.round((new Date(data.endDate) - new Date(data.startDate)) / (1000 * 60 * 60 * 24 * 30)))
            : "",
          terms: data?.terms ?? ""
        });
        // If PENDING_PAYMENT, check if a payment is already submitted
        if (data?.status === "PENDING_PAYMENT" || data?.status === "SIGNED") {
          paymentService.getPaymentsByContract(id)
            .then(payments => {
              if (Array.isArray(payments)) {
                const manualPayments = payments.filter(p =>
                  p.paymentMethod === "CASH" || p.paymentMethod === "BANK_TRANSFER"
                );
                const reuploadRequestedPayment = manualPayments.find(p => p.status === "REUPLOAD_REQUESTED");
                // Trường hợp 1: Thanh toán tiền mặt đã gửi, chờ chủ kho xác nhận
                const cashPending = manualPayments.some(p => p.status === "PENDING_CONFIRMATION");
                // Trường hợp 2: Thanh toán online đã hoàn tất (ngân hàng xác nhận) nhưng contract chưa update
                const onlineCompleted = payments.some(p => p.paymentMethod !== "CASH" && p.status === "COMPLETED");
                setReuploadPayment(reuploadRequestedPayment || null);
                setHasPendingPayment(cashPending || onlineCompleted);
              }
            })
            .catch(() => {}); // silently ignore
        } else {
          setHasPendingPayment(false);
          setReuploadPayment(null);
        }
      })
      .catch((err) => {
        if (err.response?.status === 403) setError("Bạn không có quyền xem hợp đồng này.");
        else if (err.response?.status === 404) setError("Không tìm thấy hợp đồng.");
        else setError("Không thể tải thông tin hợp đồng.");
      })
      .finally(() => setLoading(false));
  }, [id, refreshKey]);

  // Fetch warehouse areas for floor plan after contract loads
  useEffect(() => {
    if (!contract?.warehouseId) return;

    api.get(`/Warehouse/${contract.warehouseId}`)
      .then(res => setWarehouseInfo(res.data))
      .catch(() => {});
  }, [contract?.warehouseId]);

  useEffect(() => {
    if (!contract?.contractId) return;
    setLoadingRevisions(true);
    rentalService.getContractRevisionThreads(contract.contractId)
      .then((data) => setRevisionThreads(Array.isArray(data) ? data : []))
      .catch(() => setRevisionThreads([]))
      .finally(() => setLoadingRevisions(false));
  }, [contract?.contractId, refreshKey]);

  useEffect(() => {
    if (!contract?.contractId) return;
    setLoadingVersions(true);
    rentalService.getContractVersions(contract.contractId)
      .then((data) => setVersionHistory(Array.isArray(data) ? data : []))
      .catch(() => setVersionHistory([]))
      .finally(() => setLoadingVersions(false));
  }, [contract?.contractId, refreshKey]);

  // Fetch signing history
  const [signingCurrentUserId, setSigningCurrentUserId] = useState(null);
  useEffect(() => {
    if (contract?.contractId) {
      setLoadingHistory(true);
      rentalService.getContractSigningHistory(contract.contractId)
        .then((data) => {
          // New shape: { currentUserId, events } OR old shape: array
          if (data && data.events) {
            setSigningHistory(data.events);
            setSigningCurrentUserId(data.currentUserId);
          } else {
            setSigningHistory(Array.isArray(data) ? data : []);
          }
        })
        .catch(() => setSigningHistory([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [contract?.contractId]);

  // Fetch audit logs when expanded
  useEffect(() => {
    if (showAuditLogs && contract?.contractId && auditLogs.length === 0) {
      setLoadingLogs(true);
      rentalService.getContractAuditLogs(contract.contractId)
        .then(setAuditLogs)
        .catch(() => setAuditLogs([]))
        .finally(() => setLoadingLogs(false));
    }
  }, [showAuditLogs, contract?.contractId, auditLogs.length]);

  // Download PDF handler
  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await rentalService.downloadContractPdf(contract.contractId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HopDong_${contract.contractNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert("Không thể tải PDF hợp đồng. Vui lòng thử lại.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Calculate action button visibility
  const canTerminate = contract?.status === "ACTIVE";
  const canRequestClose = contract?.status === "ACTIVE";
  const daysUntilExpiry = contract?.endDate
    ? Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  // Check if current user can approve/reject termination or close request
  const isPendingTermination = contract?.status === "PENDING_TERMINATION";
  const isPendingClose = contract?.status === "PENDING_CLOSE";
  const isPendingApproval = isPendingTermination || isPendingClose;
  const isRequester = (contract?.terminationRequestedBy === "RENTER" && contract?.isCurrentUserRenter) ||
                      (contract?.terminationRequestedBy === "OWNER" && contract?.isCurrentUserOwner);
  const isRenterInitiatedTermination = isPendingTermination && contract?.terminationRequestedBy === "RENTER";
  const hasCurrentUserApproved = (contract?.isCurrentUserOwner && contract?.ownerApprovedTermination) ||
                                 (contract?.isCurrentUserRenter && contract?.renterApprovedTermination);
  const canOwnerReviewRenterTermination = isRenterInitiatedTermination && contract?.isCurrentUserOwner && !contract?.ownerApprovedTermination;
  const canRenterRespondToOwnerReview = isRenterInitiatedTermination && contract?.isCurrentUserRenter && contract?.ownerApprovedTermination && !contract?.renterApprovedTermination;
  const canPayTerminationFee = isPendingTermination &&
                               contract?.isCurrentUserRenter &&
                               contract?.ownerApprovedTermination &&
                               contract?.renterApprovedTermination &&
                               Number(contract?.earlyTerminationFee || 0) > 0;
  const canStandardApproveOrReject = isPendingApproval &&
                                     !isRequester &&
                                     !hasCurrentUserApproved &&
                                     !canOwnerReviewRenterTermination &&
                                     !canRenterRespondToOwnerReview;
  const canApproveOrReject = canOwnerReviewRenterTermination || canRenterRespondToOwnerReview || canStandardApproveOrReject;
  const waitingForCounterparty = isPendingApproval && !isRequester && hasCurrentUserApproved && !canPayTerminationFee;
  const shouldShowApprovalModal = canOwnerReviewRenterTermination;

  const handleDeclineContract = async () => {
    if (!declineReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    setIsSubmittingDecline(true);
    try {
      await rentalService.declineContract(contract.contractId, declineReason);
      alert('Đã từ chối hợp đồng thành công');
      setShowDeclineModal(false);
      setDeclineReason('');
      reloadContract();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối hợp đồng');
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionMessage.trim()) {
      alert("Vui lòng nhập nội dung yêu cầu chỉnh sửa");
      return;
    }
    try {
      await rentalService.requestContractRevision(contract.contractId, {
        section: revisionSection,
        message: revisionMessage.trim()
      });
      setRevisionMessage("");
      reloadContract();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể gửi yêu cầu chỉnh sửa");
    }
  };

  const handleSendDraft = async () => {
    try {
      setSendingDraft(true);
      await rentalService.sendContractDraft(contract.contractId);
      reloadContract();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể gửi bản nháp");
    } finally {
      setSendingDraft(false);
    }
  };

  const handleReplyRevision = async (threadId) => {
    const message = (replyDrafts[threadId] || "").trim();
    if (!message) {
      alert("Vui lòng nhập nội dung phản hồi");
      return;
    }
    try {
      await rentalService.replyContractRevision(threadId, message);
      setReplyDrafts(prev => ({ ...prev, [threadId]: "" }));
      reloadContract();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể gửi phản hồi");
    }
  };

  const handleAcceptRevision = async (threadId) => {
    try {
      await rentalService.acceptContractRevision(threadId);
      reloadContract();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể chấp nhận yêu cầu");
    }
  };

  const handleRejectRevision = async (threadId) => {
    try {
      await rentalService.rejectContractRevision(threadId);
      reloadContract();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể từ chối yêu cầu");
    }
  };

  const handleApplyChanges = async () => {
    if (!changeForm.monthlyPayment || Number(changeForm.monthlyPayment) <= 0) {
      alert("Vui lòng nhập giá thuê hợp lệ");
      return;
    }
    if (!changeForm.startDate) {
      alert("Vui lòng chọn ngày bắt đầu hợp đồng");
      return;
    }
    if (!changeForm.durationMonths || Number(changeForm.durationMonths) < 1) {
      alert("Vui lòng nhập thời hạn hợp đồng hợp lệ");
      return;
    }

    const resolveThreadIds = resolveAcceptedThreads
      ? revisionThreads.filter(t => t.status === "ACCEPTED").map(t => t.threadId)
      : [];

    try {
      setApplyingChanges(true);
      await rentalService.applyContractChanges(contract.contractId, {
        monthlyPayment: Number(changeForm.monthlyPayment),
        depositAmount: changeForm.depositAmount === "" ? null : Number(changeForm.depositAmount),
        startDate: changeForm.startDate,
        durationMonths: Number(changeForm.durationMonths),
        terms: changeForm.terms,
        resolveThreadIds
      });
      reloadContract();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể áp dụng chỉnh sửa");
    } finally {
      setApplyingChanges(false);
    }
  };

  const handleApproveForSigning = async () => {
    try {
      setApprovingSigning(true);
      await rentalService.approveContractForSigning(contract.contractId);
      reloadContract();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể duyệt ký");
    } finally {
      setApprovingSigning(false);
    }
  };

  // Access control: Determine who can sign/pay based on status and role
  const canOwnerSign = contract?.isCurrentUserOwner && contract?.status === "APPROVED_FOR_SIGNING";
  const canRenterSign = contract?.isCurrentUserRenter && contract?.status === "PENDING_RENTER_SIGNATURE";
  const canRenterDecline = contract?.isCurrentUserRenter && contract?.status === "PENDING_RENTER_SIGNATURE";
  const hasReuploadRequest = Boolean(reuploadPayment);
  // canRenterPay: true only if no payment has been submitted/pending yet
  const canRenterPay = contract?.isCurrentUserRenter &&
    (contract?.status === "PENDING_PAYMENT" || contract?.status === "SIGNED") &&
    !hasPendingPayment;
  const isNegotiating = ["NEGOTIATING", "REVISION_REQUESTED"].includes(contract?.status);
  const canRequestRevision = contract?.isCurrentUserRenter && isNegotiating;
  const canOwnerRespondRevision = contract?.isCurrentUserOwner && isNegotiating;
  const canApproveForSigning = contract?.isCurrentUserOwner && isNegotiating;

  if (loading) return (
    <div style={{ padding: "5rem 2rem", textAlign: "center" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid #e2e8f0", borderTopColor: "#0ea5e9", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
      <p style={{ fontWeight: 600, color: "#64748b", fontSize: "0.95rem" }}>Đang tải hợp đồng...</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #fef2f2, #fff1f2)", borderRadius: 14, border: "1px solid #fecaca", fontSize: "0.9rem", fontWeight: 600, color: "#991b1b", marginBottom: 16 }}>
        {error}
      </div>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>← Quay lại</button>
    </div>
  );

  if (!contract) return null;

  // If payment already submitted but contract still PENDING_PAYMENT, show a different status label
  const effectiveStatus = hasPendingPayment && contract.status === "PENDING_PAYMENT"
    ? "PENDING_PAYMENT_CONFIRMATION"
    : contract.status;
  const status = statusConfig[effectiveStatus] || { bg: "#f1f5f9", color: "#64748b", label: contract.status };

  return (
    <div style={{ padding: "0 2rem 3rem", maxWidth: 940, margin: "0 auto", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <style>{`
        @keyframes cardFadeIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
        .cd-btn { transition: all 0.18s ease; }
        .cd-btn:hover { transform: translateY(-1px); filter: brightness(1.06); }
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

        {/* Back + Download row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, position: "relative" }}>
          <button
            onClick={() => navigate(-1)}
            className="cd-btn"
            style={{
              padding: "8px 18px", borderRadius: 10,
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.85)", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem",
              backdropFilter: "blur(8px)",
            }}
          >
            ← Quay lại
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="cd-btn"
            style={{
              padding: "8px 20px", borderRadius: 10,
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.85)", fontWeight: 600,
              cursor: downloadingPdf ? "not-allowed" : "pointer", fontSize: "0.85rem",
              backdropFilter: "blur(8px)", opacity: downloadingPdf ? 0.5 : 1,
            }}
          >
            {downloadingPdf ? "Đang tải..." : "Tải PDF"}
          </button>
        </div>

        {/* Contract title row */}
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "rgba(14,165,233,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
            HỢP ĐỒNG
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
              {contract.contractNumber}
            </h1>
            <span style={{
              padding: "5px 16px", borderRadius: 20,
              backgroundColor: `${status.color}22`, color: status.color === "#64748b" ? "#cbd5e1" : status.color,
              fontSize: "0.78rem", fontWeight: 700,
              border: `1.5px solid ${status.color}30`,
            }}>
              {status.label}
            </span>
          </div>
          <p style={{ color: "rgba(148,163,184,0.8)", margin: "8px 0 0", fontSize: "0.85rem" }}>
            Tạo ngày {formatDate(contract.createdAt)}
          </p>
        </div>

        {/* Quick stats in header */}
        <div style={{ display: "flex", gap: 16, marginTop: 20, position: "relative", flexWrap: "wrap" }}>
          {[
            { label: "Kho", value: contract.warehouseName },
            { label: "Giá/tháng", value: formatCurrency(contract.monthlyPayment) },
            { label: "Thời hạn", value: `${formatDate(contract.startDate)} — ${formatDate(contract.endDate)}` },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: "10px 18px", borderRadius: 12,
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              flex: "1 1 0", minWidth: 140,
            }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(148,163,184,0.7)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{stat.label}</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0 22px" }}>
        {[
          { key: "overview", label: "Tổng quan" },
          { key: "negotiation", label: "Đàm phán" },
          { key: "versions", label: "Lịch sử phiên bản" },
          { key: "signing", label: "Ký hợp đồng" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: activeTab === tab.key ? "1.5px solid #0ea5e9" : "1px solid #e2e8f0",
              background: activeTab === tab.key ? "#e0f2fe" : "#fff",
              color: activeTab === tab.key ? "#0369a1" : "#64748b",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
              boxShadow: activeTab === tab.key ? "0 2px 8px rgba(14,165,233,0.25)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Two-party info ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, animation: "cardFadeIn 0.4s ease 0.1s both" }}>
        {contract.ownerName && (
          <Section title="Bên cho thuê — Bên A" accent="#2563eb">
            <InfoRow label="Họ tên" value={contract.ownerName} />
            <InfoRow label="Số điện thoại" value={contract.ownerPhone || "—"} />
          </Section>
        )}
        <Section title="Bên thuê — Bên B" accent="#7c3aed">
          <InfoRow label="Họ tên" value={contract.renterName} />
          <InfoRow label="Email" value={contract.renterEmail} />
          <InfoRow label="Số điện thoại" value={contract.renterPhone || "—"} />
        </Section>
      </div>

      {/* Thông tin kho */}
      <div style={{ animation: "cardFadeIn 0.4s ease 0.15s both" }}>
        <Section title="Thông tin kho" accent="#0891b2">
          <InfoRow label="Tên kho" value={contract.warehouseName} />
          <InfoRow label="Địa chỉ" value={contract.warehouseAddress} />
          <InfoRow label="Diện tích thuê" value={`${contract.requestedArea || 0} m²`} />
        </Section>
      </div>

      {/* Thời hạn hợp đồng */}
      <div style={{ animation: "cardFadeIn 0.4s ease 0.2s both" }}>
        <Section title="Thời hạn hợp đồng" accent="#059669">
          <InfoRow label="Ngày bắt đầu" value={formatDate(contract.startDate)} />
          <InfoRow label="Ngày kết thúc" value={formatDate(contract.endDate)} />
          {contract.status === "ACTIVE" && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{
                padding: "10px 16px",
                background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                borderRadius: 10, borderLeft: "4px solid #f59e0b",
                color: "#92400e", fontSize: "0.85rem", fontWeight: 600,
              }}>
                Còn {daysUntilExpiry} ngày nữa hết hạn hợp đồng
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* Thông tin tài chính */}
      <div style={{ animation: "cardFadeIn 0.4s ease 0.25s both" }}>
        <Section title="Thông tin tài chính" accent="#d97706">
          <InfoRow label="Giá thuê/tháng" value={formatCurrency(contract.monthlyPayment)} />
          <InfoRow label="Tổng giá trị hợp đồng" value={formatCurrency(contract.totalValue)} />
          {contract.depositAmount != null && (
            <InfoRow label="Tiền đặt cọc" value={formatCurrency(contract.depositAmount)} />
          )}
        </Section>
      </div>

      {/* Điều khoản */}
      {(() => {
        const termsText = (contract.terms || "").trim();
        return (
          <div style={{
            backgroundColor: "#fff", borderRadius: 18, overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
            border: "1px solid #eef1f6", marginBottom: "1rem",
            animation: "cardFadeIn 0.4s ease 0.3s both",
          }}>
            <div style={{ height: 3, background: "linear-gradient(90deg, #64748b, #64748b44, transparent)" }} />
            <div style={{ padding: "20px 24px" }}>
              <h2 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#64748b", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Điều khoản hợp đồng
              </h2>
              <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>
                {termsText || "Chưa có điều khoản được cập nhật cho hợp đồng này."}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Ảnh / tài liệu đính kèm từ chủ kho */}
      {contract.contractImageUrl && (
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem",
            paddingBottom: "0.8rem", borderBottom: "1px solid #f1f5f9" }}>
            Tài liệu đính kèm từ chủ kho
          </h2>
          {/\.(jpg|jpeg|png|gif|webp)$/i.test(contract.contractImageUrl) ? (
            <div>
              <img
                src={`http://localhost:5276${contract.contractImageUrl}`}
                alt="Tài liệu hợp đồng"
                style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "10px",
                  objectFit: "contain", border: "1px solid #e2e8f0" }}
              />
              <div style={{ marginTop: "0.8rem" }}>
                <a href={`http://localhost:5276${contract.contractImageUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: "#0095c7", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
                  Xem ảnh gốc
                </a>
              </div>
            </div>
          ) : (
            <a href={`http://localhost:5276${contract.contractImageUrl}`}
              target="_blank" rel="noopener noreferrer"
              style={{ color: "#0095c7", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
              Xem tài liệu đính kèm
            </a>
          )}
        </div>
      )}

      {/* Thông báo DRAFT */}
      {contract.status === "DRAFT" && (
        <div style={{ marginBottom: "1rem", padding: "1rem 1.5rem", backgroundColor: "#fefce8",
          borderRadius: "12px", border: "1px solid #fde047", color: "#854d0e", fontSize: "0.9rem" }}>
          <strong>Hợp đồng đang ở trạng thái bản nháp.</strong> Chủ kho cần gửi bản nháp để bắt đầu đàm phán.
        </div>
      )}

      {/* PDF Links */}
      {(contract.contractFileUrl || contract.ownerSignedFileUrl || contract.signedFileUrl) && (
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem",
            paddingBottom: "0.8rem", borderBottom: "1px solid #f1f5f9" }}>
            Tài liệu hợp đồng
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {contract.signedFileUrl && (
              <a href={`http://localhost:5276${contract.signedFileUrl}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "#16a34a", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>verified</span>
                Hợp đồng đã ký đầy đủ ({formatDate(contract.signedAt)})
              </a>
            )}
            {!contract.signedFileUrl && contract.ownerSignedFileUrl && (
              <a href={`http://localhost:5276${contract.ownerSignedFileUrl}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "#0095c7", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit_document</span>
                Hợp đồng đã ký bởi chủ kho ({formatDate(contract.ownerSignedAt)})
              </a>
            )}
            {!contract.signedFileUrl && !contract.ownerSignedFileUrl && contract.contractFileUrl && (
              <a href={`http://localhost:5276${contract.contractFileUrl}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "#64748b", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>description</span>
                Hợp đồng gốc (chưa ký)
              </a>
            )}
          </div>
        </div>
      )}

      {/* Signing History Section */}
      <CollapsibleSection
        title="Lịch sử ký hợp đồng"
        isOpen={showSigningHistory}
        onToggle={() => setShowSigningHistory(!showSigningHistory)}
      >
        <SigningHistoryTimeline history={signingHistory} loading={loadingHistory} currentUserId={signingCurrentUserId} />
      </CollapsibleSection>

      {/* Audit Log Section */}
      <CollapsibleSection
        title="Nhật ký hoạt động"
        isOpen={showAuditLogs}
        onToggle={() => setShowAuditLogs(!showAuditLogs)}
      >
        <AuditLogList logs={auditLogs} loading={loadingLogs} />
      </CollapsibleSection>

      {/* Pending Approval Section - Show when waiting for approval from the other party */}
      {isPendingApproval && (
        <div style={{ 
          backgroundColor: "#fef3c7", borderRadius: "16px", padding: "1.5rem 2rem",
          border: "1px solid #fde047", marginBottom: "1rem"
        }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#92400e", marginBottom: "0.8rem" }}>
            ⏳ {contract.status === "PENDING_TERMINATION" ? "Yêu cầu kết thúc sớm đang chờ xác nhận" : "Yêu cầu kết thúc hợp đồng đang chờ xác nhận"}
          </h2>
          <p style={{ color: "#92400e", fontSize: "0.9rem", marginBottom: "1rem" }}>
            {contract.terminationRequestedBy === "RENTER" ? "Người thuê" : "Chủ kho"} đã gửi yêu cầu {contract.status === "PENDING_TERMINATION" ? "kết thúc sớm" : "kết thúc"} hợp đồng.
            {contract.terminationReason && <><br/><strong>Lý do:</strong> {contract.terminationReason}</>}
            {isRenterInitiatedTermination && contract.ownerApprovedTermination && (
              <>
                <br />
                <strong>Phí kết thúc sớm được đề xuất:</strong> {formatCurrency(contract.earlyTerminationFee ?? 0)}
              </>
            )}
          </p>
          {canApproveOrReject && (
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  if (shouldShowApprovalModal) {
                    setShowApprovalModal(true);
                  } else {
                    handleApprove();
                  }
                }}
                disabled={processingApproval}
                style={{
                  padding: "0.7rem 1.2rem",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: processingApproval ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  opacity: processingApproval ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                {canOwnerReviewRenterTermination
                  ? "Duyệt và đặt phí"
                  : canRenterRespondToOwnerReview && (contract.earlyTerminationFee ?? 0) > 0
                    ? "Đồng ý và thanh toán"
                    : "Đồng ý"}
              </button>
              <button
                onClick={handleReject}
                disabled={processingApproval}
                style={{
                  padding: "0.7rem 1.2rem",
                  borderRadius: "10px",
                  border: "1px solid #dc2626",
                  backgroundColor: "#fff",
                  color: "#dc2626",
                  fontWeight: 600,
                  cursor: processingApproval ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  opacity: processingApproval ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>cancel</span>
                {canRenterRespondToOwnerReview ? "Không đồng ý mức phí" : "Từ chối"}
              </button>
            </div>
          )}
          {canPayTerminationFee && (
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
              <button
                onClick={() => navigate(`/contracts/${contract.contractId}/payment?purpose=termination`)}
                style={{
                  padding: "0.7rem 1.2rem",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>payments</span>
                Thanh toán phí kết thúc sớm
              </button>
            </div>
          )}
          {isRequester && !canRenterRespondToOwnerReview && (
            <p style={{ color: "#92400e", fontSize: "0.85rem", fontStyle: "italic" }}>
              {isRenterInitiatedTermination && !contract.ownerApprovedTermination
                ? "Bạn đã gửi yêu cầu này. Đang chờ chủ kho duyệt và đề xuất mức phí."
                : "Bạn đã gửi yêu cầu này. Đang chờ bên còn lại xác nhận."}
            </p>
          )}
          {waitingForCounterparty && (
            <p style={{ color: "#92400e", fontSize: "0.85rem", fontStyle: "italic" }}>
              Bạn đã xác nhận yêu cầu này. Đang chờ bên còn lại hoàn tất bước tiếp theo.
            </p>
          )}
        </div>
      )}

      <div id="contract-tab-negotiation" style={{ scrollMarginTop: 120 }}>
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "18px",
          padding: "1.5rem 2rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          border: "1px solid #f1f5f9",
          marginBottom: "1rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Đàm phán điều khoản</h2>
            <span style={{
              padding: "4px 12px",
              borderRadius: 999,
              background: isNegotiating ? "#e0f2fe" : "#f1f5f9",
              color: isNegotiating ? "#0369a1" : "#64748b",
              fontWeight: 700,
              fontSize: "0.75rem"
            }}>
              {contract.status === "DRAFT" ? "Chưa bắt đầu" : (isNegotiating ? "Đang đàm phán" : "Đã kết thúc")}
            </span>
          </div>

          {contract.status === "DRAFT" && contract.isCurrentUserOwner && (
            <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ fontSize: "0.85rem", color: "#475569", marginBottom: 8 }}>
                Hợp đồng đang ở trạng thái bản nháp. Gửi bản nháp để bắt đầu đàm phán.
              </div>
              <button
                onClick={handleSendDraft}
                disabled={sendingDraft}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: sendingDraft ? "#94a3b8" : "#2563eb",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: sendingDraft ? "not-allowed" : "pointer"
                }}
              >
                {sendingDraft ? "Đang gửi..." : "Gửi bản nháp"}
              </button>
            </div>
          )}

          {canRequestRevision && (
            <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>Yêu cầu chỉnh sửa</div>
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 10 }}>
                <select
                  value={revisionSection}
                  onChange={(e) => setRevisionSection(e.target.value)}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.85rem" }}
                >
                  {revisionSectionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <textarea
                  value={revisionMessage}
                  onChange={(e) => setRevisionMessage(e.target.value)}
                  rows={2}
                  placeholder="Nhập nội dung yêu cầu chỉnh sửa..."
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.85rem" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  onClick={handleRequestRevision}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Gửi yêu cầu
                </button>
              </div>
            </div>
          )}

          {loadingRevisions ? (
            <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Đang tải trao đổi...</div>
          ) : revisionThreads.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Chưa có yêu cầu chỉnh sửa nào.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {revisionThreads.map(thread => {
                const statusMeta = revisionStatusDisplay[thread.status] || { label: thread.status, color: "#64748b", bg: "#f1f5f9" };
                return (
                  <div key={thread.threadId} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
                        {revisionSectionLabels[thread.section] || thread.section}
                      </div>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: statusMeta.bg,
                        color: statusMeta.color,
                        fontSize: "0.72rem",
                        fontWeight: 700
                      }}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                      {thread.comments?.map(comment => (
                        <div key={comment.commentId} style={{ padding: "8px 10px", borderRadius: 10, background: "#f8fafc" }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a" }}>{comment.userName}</div>
                          <div style={{ fontSize: "0.85rem", color: "#334155", marginTop: 2 }}>{comment.message}</div>
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 4 }}>
                            {new Date(comment.createdAt).toLocaleString("vi-VN")}
                          </div>
                        </div>
                      ))}
                    </div>

                    {canOwnerRespondRevision && thread.status === "OPEN" && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <button
                          onClick={() => handleAcceptRevision(thread.threadId)}
                          style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                        >
                          Accept & Update
                        </button>
                        <button
                          onClick={() => handleRejectRevision(thread.threadId)}
                          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff", color: "#dc2626", fontWeight: 700, cursor: "pointer" }}
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {isNegotiating && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          value={replyDrafts[thread.threadId] || ""}
                          onChange={(e) => setReplyDrafts(prev => ({ ...prev, [thread.threadId]: e.target.value }))}
                          placeholder="Phản hồi..."
                          style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                        />
                        <button
                          onClick={() => handleReplyRevision(thread.threadId)}
                          style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {canOwnerRespondRevision && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
              <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>Áp dụng thay đổi</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <input
                  type="number"
                  value={changeForm.monthlyPayment}
                  onChange={(e) => setChangeForm(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                  placeholder="Giá thuê / tháng"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <input
                  type="number"
                  value={changeForm.depositAmount}
                  onChange={(e) => setChangeForm(prev => ({ ...prev, depositAmount: e.target.value }))}
                  placeholder="Tiền đặt cọc"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <input
                  type="date"
                  value={changeForm.startDate}
                  onChange={(e) => setChangeForm(prev => ({ ...prev, startDate: e.target.value }))}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <input
                  type="number"
                  value={changeForm.durationMonths}
                  onChange={(e) => setChangeForm(prev => ({ ...prev, durationMonths: e.target.value }))}
                  placeholder="Thời hạn (tháng)"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
              </div>
              <textarea
                value={changeForm.terms}
                onChange={(e) => setChangeForm(prev => ({ ...prev, terms: e.target.value }))}
                rows={3}
                placeholder="Điều khoản hợp đồng"
                style={{ marginTop: 10, width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: "0.85rem", color: "#475569" }}>
                <input
                  type="checkbox"
                  checked={resolveAcceptedThreads}
                  onChange={(e) => setResolveAcceptedThreads(e.target.checked)}
                />
                Đánh dấu các yêu cầu đã đồng ý là đã áp dụng
              </label>
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button
                  onClick={handleApplyChanges}
                  disabled={applyingChanges}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: applyingChanges ? "#94a3b8" : "#2563eb",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: applyingChanges ? "not-allowed" : "pointer"
                  }}
                >
                  {applyingChanges ? "Đang áp dụng..." : "Apply Changes"}
                </button>
                <button
                  onClick={handleApproveForSigning}
                  disabled={approvingSigning}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #10b981",
                    background: approvingSigning ? "#d1fae5" : "#ecfdf5",
                    color: "#047857",
                    fontWeight: 700,
                    cursor: approvingSigning ? "not-allowed" : "pointer"
                  }}
                >
                  {approvingSigning ? "Đang duyệt..." : "Approve for signing"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div id="contract-tab-versions" style={{ scrollMarginTop: 120 }}>
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "18px",
          padding: "1.5rem 2rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          border: "1px solid #f1f5f9",
          marginBottom: "1rem"
        }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Lịch sử phiên bản</h2>
          {loadingVersions ? (
            <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Đang tải phiên bản...</div>
          ) : versionHistory.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Chưa có phiên bản nào.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {versionHistory.map(version => {
                let snapshot = {};
                try {
                  snapshot = JSON.parse(version.snapshotJson || "{}");
                } catch {
                  snapshot = {};
                }
                return (
                  <div key={version.versionId} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>Version {version.versionNumber}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {new Date(version.createdAt).toLocaleString("vi-VN")} · {version.createdByName}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                      <div style={{ fontSize: "0.82rem", color: "#475569" }}>Giá/tháng: <strong>{formatCurrency(snapshot.MonthlyPayment ?? snapshot.monthlyPayment)}</strong></div>
                      <div style={{ fontSize: "0.82rem", color: "#475569" }}>Tiền cọc: <strong>{formatCurrency(snapshot.DepositAmount ?? snapshot.depositAmount)}</strong></div>
                      <div style={{ fontSize: "0.82rem", color: "#475569" }}>Ngày bắt đầu: <strong>{snapshot.StartDate ? formatDate(snapshot.StartDate) : "—"}</strong></div>
                      <div style={{ fontSize: "0.82rem", color: "#475569" }}>Ngày kết thúc: <strong>{snapshot.EndDate ? formatDate(snapshot.EndDate) : "—"}</strong></div>
                    </div>
                    {snapshot.Terms && (
                      <div style={{ marginTop: 8, fontSize: "0.82rem", color: "#334155" }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Điều khoản</div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{snapshot.Terms}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions Section */}
      {(canTerminate || canRequestClose) && !isPendingApproval && (
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem 2rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem",
            paddingBottom: "0.8rem", borderBottom: "1px solid #f1f5f9" }}>
            Thao tác
          </h2>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            {canRequestClose && (
              <button
                onClick={handleRequestClose}
                disabled={processingApproval}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#10b981",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: processingApproval ? "not-allowed" : "pointer",
                  fontSize: "0.88rem",
                  opacity: processingApproval ? 0.7 : 1,
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                  transition: "all 0.2s ease",
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={e => { if (!processingApproval) { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.35)"; e.target.style.backgroundColor = "#059669"; } }}
                onMouseLeave={e => { if (!processingApproval) { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 2px 8px rgba(16, 185, 129, 0.25)"; e.target.style.backgroundColor = "#10b981"; } }}
              >
                Kết thúc hợp đồng
              </button>
            )}
            {canTerminate && (
              <button
                onClick={() => setShowTerminateModal(true)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid #fecaca",
                  backgroundColor: "#fff",
                  color: "#dc2626",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  boxShadow: "0 2px 8px rgba(220, 38, 38, 0.08)",
                  transition: "all 0.2s ease",
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.15)"; e.target.style.backgroundColor = "#fef2f2"; }}
                onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 2px 8px rgba(220, 38, 38, 0.08)"; e.target.style.backgroundColor = "#fff"; }}
              >
                Kết thúc sớm
              </button>
            )}
          </div>
        </div>
      )}

      {/* Signing Button - Only for users who have permission to sign */}
      <div id="contract-tab-signing" style={{ scrollMarginTop: 120 }}>
      {(canOwnerSign || canRenterSign) && (
        <div>
          {/* Signature Expiry Countdown */}
          {contract.renterSignatureExpiry && (
            <ExpiryCountdown
              expiryDate={contract.renterSignatureExpiry}
              onExpired={() => {
                alert('Thời gian ký hợp đồng đã hết. Hợp đồng sẽ bị hủy.');
                reloadContract();
              }}
              warningThresholdMinutes={720}
              className="mb-3"
            />
          )}
          
          <button
            onClick={() => setShowSigningModal(true)}
            style={{
              marginTop: "0.5rem",
              width: "100%",
              padding: "1rem",
              backgroundColor: "#0095c7",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0077a3"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#0095c7"}
          >
            Ký hợp đồng
          </button>
          
          {/* Decline button - Only for renter */}
          {canRenterDecline && (
            <button
              onClick={() => setShowDeclineModal(true)}
              style={{
                marginTop: "0.5rem",
                width: "100%",
                padding: "0.875rem",
                backgroundColor: "#fff",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#fef2f2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
              }}
            >
              Từ chối hợp đồng này
            </button>
          )}
        </div>
      )}
      </div>

      {/* Payment Button - Only for renter, only if no payment submitted yet */}
      {canRenterPay && (
        <div style={{ marginTop: "0.5rem" }}>
          <div style={{
            padding: "1rem 1.5rem",
            backgroundColor: "#fef3c7",
            borderRadius: "12px",
            border: "1px solid #fde047",
            color: "#854d0e",
            fontSize: "0.9rem",
            marginBottom: "1rem"
          }}>
            {hasReuploadRequest ? (
              <>
                <strong>Chủ kho yêu cầu tải lại chứng từ thanh toán.</strong> Vui lòng cập nhật và gửi lại xác nhận.
                {reuploadPayment?.proofRequestReason && (
                  <div style={{ marginTop: 6, fontSize: "0.85rem" }}>
                    <strong>Lý do:</strong> {reuploadPayment.proofRequestReason}
                  </div>
                )}
              </>
            ) : (
              <>
                <strong>Hợp đồng đã ký thành công!</strong> Vui lòng thanh toán để kích hoạt hợp đồng.
              </>
            )}
          </div>
          <button
            onClick={() => navigate(`/contracts/${id}/payment`)}
            style={{
              width: "100%",
              padding: "1rem",
              backgroundColor: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#15803d"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#16a34a"}
          >
            {hasReuploadRequest ? "Gửi lại chứng từ" : "Thanh toán ngay"}
          </button>
        </div>
      )}

      {/* Payment submitted, awaiting owner confirmation */}
      {hasPendingPayment && contract?.isCurrentUserRenter &&
        (contract?.status === "PENDING_PAYMENT" || contract?.status === "SIGNED") && (
        <div style={{
          marginTop: "0.5rem",
          padding: "16px 20px",
          backgroundColor: "#eff6ff",
          borderRadius: "14px",
          border: "1px solid #bfdbfe",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 700, color: "#1d4ed8", fontSize: "0.92rem", marginBottom: 3 }}>
              Đang chờ chủ kho xác nhận thanh toán
            </div>
            <div style={{ fontSize: "0.82rem", color: "#3b82f6" }}>
              Bạn đã gửi thanh toán thành công. Chủ kho sẽ xác nhận và kích hoạt hợp đồng sớm nhất có thể.
            </div>
          </div>
        </div>
      )}

      {/* Signing Modal */}
      {showSigningModal && (
        <ContractSigningModal
          contract={contract}
          isOwner={contract.isCurrentUserOwner}
          onClose={() => setShowSigningModal(false)}
          onSignSuccess={reloadContract}
        />
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Từ chối hợp đồng</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Nhập lý do từ chối hợp đồng..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                }}
                disabled={isSubmittingDecline}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={handleDeclineContract}
                disabled={isSubmittingDecline}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmittingDecline ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {showTerminateModal && (
        <TerminateContractModal
          contract={contract}
          onClose={() => setShowTerminateModal(false)}
          onSuccess={reloadContract}
        />
      )}

      {/* Approval Modal - Fee Input for Owner Approval */}
      {showApprovalModal && shouldShowApprovalModal && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            maxWidth: "450px",
            width: "90%",
            padding: "2rem",
          }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
              Xác nhận yêu cầu kết thúc sớm
            </h2>

            <div style={{
              backgroundColor: "#f8fafc",
              borderRadius: "10px",
              padding: "1rem",
              marginBottom: "1.5rem",
              border: "1px solid #f1f5f9",
            }}>
              <div style={{ marginBottom: "0.5rem" }}>
                <span style={{ color: "#94a3b8" }}>Lý do:</span>
                <div style={{ fontWeight: 500, color: "#0f172a" }}>{contract.terminationReason}</div>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "0.5rem",
                display: "block",
              }}>
                Phí kết thúc sớm (VND) - Tùy chọn
              </label>
              <input
                type="number"
                value={terminationFee}
                onChange={(e) => setTerminationFee(e.target.value)}
                placeholder="0"
                min="0"
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.3rem" }}>
                Nhập 0 hoặc để trống nếu không thu phí
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setTerminationFee('');
                }}
                disabled={processingApproval}
                style={{
                  padding: "0.7rem 1.5rem",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#fff",
                  color: "#64748b",
                  fontWeight: 600,
                  cursor: processingApproval ? "not-allowed" : "pointer",
                  opacity: processingApproval ? 0.6 : 1,
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => handleApprove({ useModalFee: true })}
                disabled={processingApproval}
                style={{
                  padding: "0.7rem 1.5rem",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: processingApproval ? "not-allowed" : "pointer",
                  opacity: processingApproval ? 0.6 : 1,
                }}
              >
                {processingApproval ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

const backBtnStyle = {
  padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0",
  backgroundColor: "#fff", color: "#64748b", fontWeight: 600,
  cursor: "pointer", fontSize: "0.88rem",
};

export default ContractDetail;

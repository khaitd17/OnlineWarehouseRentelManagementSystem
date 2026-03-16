import React, { useState, useRef } from "react";
import rentalService from "../services/rentalService";
import SignatureCanvas from "./SignatureCanvas";

const ContractSigningModal = ({ contract, onClose, onSignSuccess }) => {
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Sign
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const signatureCanvasRef = useRef(null);

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setError("");
      await rentalService.sendContractOtp(contract.contractId);
      setOtpSent(true);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter a 6-digit OTP code");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await rentalService.verifyContractOtp(contract.contractId, otpCode);
      setOtpCode("");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
      setError("Please draw your signature");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const signatureBase64 = signatureCanvasRef.current.toBase64();
      const result = await rentalService.signContract(contract.contractId, signatureBase64);
      alert("Hợp đồng đã được ký thành công!");
      onSignSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to sign contract");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSignature = () => {
    signatureCanvasRef.current?.clear();
  };

  return (
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
        borderRadius: "12px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        maxWidth: "600px",
        width: "90%",
        maxHeight: "90vh",
        overflow: "auto",
        padding: "2rem",
      }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Ký hợp đồng {contract.contractNumber}
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.5rem", margin: 0 }}>
            Bước {step} / 3
          </p>
        </div>

        {error && (
          <div style={{
            color: "#dc2626",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              Bước đầu tiên: Gửi mã OTP xác thực qua email {contract.renterEmail}
            </p>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "#0095c7",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ color: "#64748b", marginBottom: "1rem" }}>
              Nhập mã OTP 6 chữ số mà bạn vừa nhận được qua email
            </p>
            <input
              type="text"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength="6"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "1.2rem",
                textAlign: "center",
                letterSpacing: "0.2em",
                marginBottom: "1.5rem",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.length !== 6}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: otpCode.length === 6 ? "#0095c7" : "#cbd5e1",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: loading || otpCode.length !== 6 ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Đang xác thực..." : "Xác thực OTP"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <p style={{ color: "#64748b", marginBottom: "1rem" }}>
              Vẽ chữ ký của bạn trên khung bên dưới
            </p>
            <SignatureCanvas ref={signatureCanvasRef} />
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", marginBottom: "1.5rem" }}>
              <button
                onClick={handleClearSignature}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  backgroundColor: "#f1f5f9",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Xóa
              </button>
              <button
                onClick={handleSignContract}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  backgroundColor: "#0095c7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Đang ký..." : "Ký hợp đồng"}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px 16px",
            backgroundColor: "#f1f5f9",
            color: "#0f172a",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default ContractSigningModal;

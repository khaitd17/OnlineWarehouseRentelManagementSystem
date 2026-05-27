import React, { useState, useRef } from "react";
import rentalService from "../services/rentalService";
import SignatureCanvas from "./SignatureCanvas";

const ContractSigningModal = ({ contract, onClose, onSignSuccess, isOwner = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const signatureCanvasRef = useRef(null);

  const handleSignContract = async () => {
    if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
      setError("Please draw your signature");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const signatureBase64 = signatureCanvasRef.current.toBase64();
      
      // Use different API endpoint based on role
      if (isOwner) {
        await rentalService.ownerSignContract(contract.contractId, signatureBase64);
      } else {
        await rentalService.signContract(contract.contractId, signatureBase64);
      }
      
      alert("Hợp đồng đã được ký thành công!");
      onSignSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to sign contract";
      const detail = err.response?.data?.error;
      setError(detail ? `${msg}: ${detail}` : msg);
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
      backgroundColor: "rgba(15, 23, 42, 0.45)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      animation: "cardFadeIn 0.3s ease-out"
    }}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "24px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
        maxWidth: "540px",
        width: "90%",
        maxHeight: "90vh",
        overflow: "auto",
        padding: "28px",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        boxSizing: "border-box"
      }}>
        {/* Soft Blue Badge Icon & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            backgroundColor: "#e0f2fe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span className="material-symbols-outlined" style={{ color: "#0ea5e9", fontSize: "24px" }}>
              draw
            </span>
          </div>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Ký hợp đồng
            </h2>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "2px 0 0" }}>
              Mã hợp đồng: {contract.contractNumber}
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            color: "#dc2626",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}>
            {error}
          </div>
        )}

        <div>
          <p style={{
            fontSize: "0.78rem",
            fontWeight: 800,
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "12px"
          }}>
            Vẽ chữ ký của bạn vào khung bên dưới <span style={{ color: "#ef4444" }}>*</span>
          </p>
          
          <SignatureCanvas ref={signatureCanvasRef} />
          
          <div style={{ display: "flex", gap: "12px", marginTop: "16px", marginBottom: "20px" }}>
            <button
              onClick={handleClearSignature}
              style={{
                flex: 1,
                padding: "10px 18px",
                backgroundColor: "#fff",
                color: "#64748b",
                border: "1.5px solid #cbd5e1",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                transition: "all 0.18s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f8fafc";
                e.target.style.color = "#475569";
                e.target.style.borderColor = "#94a3b8";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#fff";
                e.target.style.color = "#64748b";
                e.target.style.borderColor = "#cbd5e1";
              }}
            >
              Xóa nét vẽ
            </button>
            <button
              onClick={handleSignContract}
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 18px",
                backgroundColor: "#0ea5e9",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(14, 165, 233, 0.2)",
                transition: "all 0.18s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = "#0284c7";
                  e.target.style.boxShadow = "0 6px 16px rgba(14, 165, 233, 0.3)";
                  e.target.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = "#0ea5e9";
                  e.target.style.boxShadow = "0 4px 12px rgba(14, 165, 233, 0.2)";
                  e.target.style.transform = "none";
                }
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>verified</span>
              {loading ? "Đang ký kết..." : "Ký hợp đồng"}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "10px 18px",
            backgroundColor: "#fff",
            color: "#64748b",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "0.88rem",
            cursor: "pointer",
            transition: "all 0.18s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#f8fafc";
            e.target.style.color = "#475569";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#fff";
            e.target.style.color = "#64748b";
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default ContractSigningModal;

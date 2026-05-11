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

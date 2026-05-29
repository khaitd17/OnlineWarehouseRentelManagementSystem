import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 24px",
          borderRadius: "20px",
          background: toast.type === "success" 
            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)"
            : toast.type === "error"
              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)"
              : toast.type === "warning"
                ? "linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)"
                : "linear-gradient(135deg, rgba(2, 132, 199, 0.95) 0%, rgba(3, 105, 161, 0.95) 100%)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          boxShadow: toast.type === "success"
            ? "0 10px 30px rgba(16, 185, 129, 0.35)"
            : toast.type === "error"
              ? "0 10px 30px rgba(239, 68, 68, 0.35)"
              : toast.type === "warning"
                ? "0 10px 30px rgba(245, 158, 11, 0.35)"
                : "0 10px 30px rgba(2, 132, 199, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: "0.95rem",
          minWidth: "280px",
          maxWidth: "420px",
          animation: "slideInRightGlobal 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          transition: "all 0.3s ease"
        }}>
          <style>{`
            @keyframes slideInRightGlobal {
              from {
                opacity: 0;
                transform: translateX(40px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateX(0) scale(1);
              }
            }
          `}</style>
          <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
            {toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : toast.type === "warning" ? "warning" : "info"}
          </span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              marginLeft: "8px"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
};

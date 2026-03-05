import React from "react";
import Modal from "./Modal";

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Xác nhận", confirmClass = "admin-btn-primary", loading }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || "Xác nhận"}
      footer={
        <>
          <button className="admin-btn admin-btn-outline" onClick={onClose} disabled={loading}>Hủy</button>
          <button className={`admin-btn ${confirmClass}`} onClick={onConfirm} disabled={loading}>
            {loading ? "Đang xử lý..." : confirmText}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

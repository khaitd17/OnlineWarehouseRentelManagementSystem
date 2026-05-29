import { useState } from "react";
import staffService from "../services/staffService";
import { useToast } from "../context/ToastContext";

function AssignStaffModal({ staff, warehouses, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    warehouseId: "",
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.warehouseId) {
        setError("Vui lòng chọn kho");
        setLoading(false);
        return;
      }

      const startDate = formData.startDate ? new Date(formData.startDate).toISOString().split("T")[0] : null;
      const endDate = formData.endDate ? new Date(formData.endDate).toISOString().split("T")[0] : null;

      await staffService.assignStaffToWarehouse(
        staff.staffId,
        parseInt(formData.warehouseId, 10),
        startDate,
        endDate,
        formData.notes
      );

      showToast("Giao nhân viên vào kho thành công!", "success");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Giao nhân viên vào kho thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  const modalStyle = {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "1000",
  };

  const contentStyle = {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "8px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  };

  const formGroupStyle = {
    marginBottom: "20px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: "bold",
    color: "#333",
    fontSize: "14px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const selectStyle = {
    ...inputStyle,
  };

  const buttonContainerStyle = {
    display: "flex",
    gap: "10px",
    marginTop: "25px",
  };

  const submitButtonStyle = {
    flex: 1,
    padding: "10px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  };

  const cancelButtonStyle = {
    flex: 1,
    padding: "10px",
    backgroundColor: "#999",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  };

  const errorStyle = {
    color: "red",
    padding: "10px",
    marginBottom: "20px",
    backgroundColor: "#ffe6e6",
    borderRadius: "4px",
    borderLeft: "4px solid red",
  };

  return (
    <div style={modalStyle}>
      <div style={contentStyle}>
        <h2 style={{ marginTop: "0" }}>Giao nhân viên vào kho</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Nhân viên: <strong>{staff.fullName}</strong> ({staff.email})
        </p>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Chọn kho *</label>
            <select
              name="warehouseId"
              value={formData.warehouseId}
              onChange={handleChange}
              style={selectStyle}
              required
            >
              <option value="">-- Chọn kho --</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                  Kho {warehouse.warehouseId} - {warehouse.name || "N/A"}
                </option>
              ))}
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Ngày bắt đầu</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Ngày kết thúc</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Ghi chú</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
              placeholder="Nhập ghi chú..."
            />
          </div>

          <div style={buttonContainerStyle}>
            <button
              type="submit"
              style={submitButtonStyle}
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Giao nhân viên"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={cancelButtonStyle}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignStaffModal;

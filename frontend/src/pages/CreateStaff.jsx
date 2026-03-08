import { useState, useEffect } from "react";
import staffService from "../services/staffService";
import { useNavigate } from "react-router-dom";
import { getMyWarehouses } from "../services/warehouseService";

function CreateStaff() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    warehouseId: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getMyWarehouses();
        setWarehouses(data || []);
      } catch (err) {
        console.error("Error fetching warehouses:", err);
        setError("Không thể tải danh sách kho");
      } finally {
        setLoadingWarehouses(false);
      }
    };
    fetchWarehouses();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (!form.fullName.trim()) {
        setError("Vui lòng nhập họ và tên");
        setLoading(false);
        return;
      }
      if (!form.email.trim()) {
        setError("Vui lòng nhập email");
        setLoading(false);
        return;
      }
      if (!form.warehouseId) {
        setError("Vui lòng chọn kho làm việc");
        setLoading(false);
        return;
      }

      // convert numeric fields
      const payload = {
        ...form,
        warehouseId: parseInt(form.warehouseId, 10),
        startDate: form.startDate ? form.startDate : null,
        endDate: form.endDate ? form.endDate : null,
      };

      const result = await staffService.createStaff(payload);
      setSuccess(`Nhân viên đã được tạo thành công! User ID: ${result.staffUserId}`);
      
      // Reset form
      setForm({
        fullName: "",
        email: "",
        phone: "",
        warehouseId: "",
        startDate: "",
        endDate: "",
        notes: "",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/list-staff");
      }, 2000);
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message || "Tạo nhân viên thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const formStyle = {
    maxWidth: "600px",
    margin: "20px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    fontFamily: "Arial, sans-serif",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginTop: "15px",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#333",
  };

  const buttonContainerStyle = {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
  };

  const buttonStyle = {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s",
  };

  const submitButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#4CAF50",
    color: "white",
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#999",
    color: "white",
  };

  const errorStyle = {
    color: "red",
    padding: "10px",
    marginBottom: "15px",
    backgroundColor: "#ffe6e6",
    borderRadius: "4px",
    borderLeft: "4px solid red",
  };

  const successStyle = {
    color: "green",
    padding: "10px",
    marginBottom: "15px",
    backgroundColor: "#e6ffe6",
    borderRadius: "4px",
    borderLeft: "4px solid green",
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", color: "#333" }}>Tạo nhân viên mới</h2>

      <div style={formStyle}>
        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div>
            <label style={labelStyle}>Họ và tên *</label>
            <input
              name="fullName"
              placeholder="Nhập họ và tên"
              value={form.fullName}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Email *</label>
            <input
              name="email"
              type="email"
              placeholder="Nhập email"
              value={form.email}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Số điện thoại</label>
            <input
              name="phone"
              placeholder="Nhập số điện thoại"
              value={form.phone}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Kho làm việc *</label>
            {loadingWarehouses ? (
              <div style={{ ...inputStyle, backgroundColor: "#f0f0f0" }}>
                Đang tải danh sách kho...
              </div>
            ) : warehouses.length === 0 ? (
              <div style={{ ...inputStyle, backgroundColor: "#ffe6e6", color: "red" }}>
                Không có kho nào. Vui lòng tạo kho trước.
              </div>
            ) : (
              <select
                name="warehouseId"
                value={form.warehouseId}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: "pointer" }}
                required
              >
                <option value="">-- Chọn kho --</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                    Kho {warehouse.warehouseId} - {warehouse.name || "N/A"}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label style={labelStyle}>Ngày bắt đầu</label>
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Ngày kết thúc</label>
            <input
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Ghi chú</label>
            <textarea
              name="notes"
              placeholder="Nhập ghi chú (tùy chọn)"
              value={form.notes}
              onChange={handleChange}
              style={{
                ...inputStyle,
                minHeight: "80px",
                resize: "vertical",
              }}
            />
          </div>

          <div style={buttonContainerStyle}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...submitButtonStyle,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Đang tạo..." : "Tạo nhân viên"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/list-staff")}
              style={cancelButtonStyle}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateStaff;

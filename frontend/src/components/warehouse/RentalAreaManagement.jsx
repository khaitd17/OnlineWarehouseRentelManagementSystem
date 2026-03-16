import React, { useState, useEffect } from "react";
import api from "../../api/api";

const RentalAreaManagement = ({ warehouseId }) => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    description: "",
  });
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/RentalAreas/warehouse/${warehouseId}`);
      setAreas(res.data);
    } catch (err) {
      console.error("Failed to fetch rental areas", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (warehouseId) {
      fetchAreas();
    }
  }, [warehouseId]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openCreateForm = () => {
    setFormError("");
    setEditingId(null);
    setFormData({ name: "", size: "", description: "" });
    setShowForm(true);
  };

  const openEditForm = (area) => {
    setFormError("");
    setEditingId(area.id);
    setFormData({
      name: area.name,
      size: area.size,
      description: area.description || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitLoading(true);

    try {
      if (editingId) {
        await api.put(`/RentalAreas/${editingId}`, {
          id: editingId,
          name: formData.name,
          size: parseFloat(formData.size),
          description: formData.description,
        });
        alert("Cập nhật thành công!");
      } else {
        await api.post(`/RentalAreas`, {
          warehouseId: parseInt(warehouseId),
          name: formData.name,
          size: parseFloat(formData.size),
          description: formData.description,
        });
        alert("Thêm mới thành công!");
      }
      closeForm();
      fetchAreas();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      setFormError(errMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khu vực này không?")) {
      try {
        await api.delete(`/RentalAreas/${id}`);
        alert("Xóa thành công!");
        fetchAreas();
      } catch (err) {
        alert("Lỗi khi xóa: " + (err.response?.data?.error || err.message));
      }
    }
  };

  return (
    <div style={{ marginTop: "2rem", backgroundColor: "#fff", padding: "2.5rem", borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Quản lý Khu vực Thuê (Rental Areas)</h2>
        {!showForm && (
          <button
            onClick={openCreateForm}
            style={{ padding: "0.6rem 1.2rem", backgroundColor: "#0095c7", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
          >
            + Thêm khu vực
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ backgroundColor: "#f8fafc", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}>
            {editingId ? "Sửa khu vực" : "Thêm khu vực mới"}
          </h3>
          
          {formError && (
            <div style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "0.8rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem" }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#475569" }}>Tên khu vực</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }}
                  placeholder="VD: Khu A, Lô 1..."
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#475569" }}>Diện tích (m²)</label>
                <input
                  required
                  type="number"
                  min="1"
                  step="0.1"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }}
                  placeholder="VD: 100"
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#475569" }}>Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", resize: "vertical" }}
                placeholder="Mô tả khu vực, tiện ích..."
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button
                type="submit"
                disabled={submitLoading}
                style={{ padding: "0.8rem 1.5rem", backgroundColor: "#0095c7", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: submitLoading ? "not-allowed" : "pointer" }}
              >
                {submitLoading ? "Đang lưu..." : "Lưu khu vực"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                style={{ padding: "0.8rem 1.5rem", backgroundColor: "#fff", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#64748b" }}>Đang tải danh sách...</p>
      ) : areas.length === 0 ? (
        <p style={{ color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>Chưa có khu vực thuê nào.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.9rem", color: "#64748b" }}>Tên khu vực</th>
                <th style={{ padding: "1rem", textAlign: "right", fontSize: "0.9rem", color: "#64748b" }}>Diện tích (m²)</th>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.9rem", color: "#64748b" }}>Mô tả</th>
                <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.9rem", color: "#64748b" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => (
                <tr key={area.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "1rem", fontWeight: 600, color: "#1e293b" }}>{area.name}</td>
                  <td style={{ padding: "1rem", textAlign: "right", color: "#0095c7", fontWeight: 700 }}>{area.size}</td>
                  <td style={{ padding: "1rem", color: "#475569", fontSize: "0.9rem" }}>{area.description || "-"}</td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    <button
                      onClick={() => openEditForm(area)}
                      style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontWeight: 600, marginRight: "1rem" }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(area.id)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 600 }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RentalAreaManagement;

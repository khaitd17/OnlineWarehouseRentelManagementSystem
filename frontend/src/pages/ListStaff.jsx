import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import staffService from "../services/staffService";
import { getMyWarehouses } from "../services/warehouseService";
import AssignStaffModal from "../components/AssignStaffModal";

function ListStaff() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const warehouseIdParam = searchParams.get("warehouseId");

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouseIdParam || "");
  const [warehouses, setWarehouses] = useState([]);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaffForAssign, setSelectedStaffForAssign] = useState(null);

  useEffect(() => {
    fetchWarehouses();
    fetchStaffList(1);
  }, [warehouseIdParam]);

  useEffect(() => {
    if (selectedWarehouse !== "") {
      fetchStaffList(1);
    }
  }, [selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const data = await getMyWarehouses();
      setWarehouses(data || []);
    } catch (err) {
      console.error("Error fetching warehouses:", err);
    }
  };

  const fetchStaffList = async (pageNumber) => {
    setLoading(true);
    setError(null);
    try {
      const warehouseId = selectedWarehouse ? parseInt(selectedWarehouse, 10) : null;
      const data = await staffService.listStaff(
        warehouseId,
        pageNumber,
        pagination.pageSize,
        searchKeyword
      );
      console.log("Fetched staff data:", data); // Debug log
      setStaffList(data.data);
      setPagination({
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
        totalPages: data.totalPages,
      });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Lấy danh sách nhân viên thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  const handleSearchSubmit = () => {
    setPagination((prev) => ({ ...prev, pageNumber: 1 }));
    fetchStaffList(1);
  };

  const handleWarehouseChange = (e) => {
    setSelectedWarehouse(e.target.value);
    setPagination((prev) => ({ ...prev, pageNumber: 1 }));
  };

  const handlePreviousPage = () => {
    if (pagination.pageNumber > 1) {
      fetchStaffList(pagination.pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.pageNumber < pagination.totalPages) {
      fetchStaffList(pagination.pageNumber + 1);
    }
  };

  const handleInactiveStaff = async (staffId, staffName) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn vô hiệu hóa nhân viên ${staffName}?`
      )
    ) {
      try {
        const warehouseId = selectedWarehouse
          ? parseInt(selectedWarehouse, 10)
          : null;
        await staffService.inactiveStaffAssignment(staffId, warehouseId);
        alert("Vô hiệu hóa nhân viên thành công!");
        fetchStaffList(pagination.pageNumber);
      } catch (err) {
        console.error(err);
        alert(
          err.response?.data?.message ||
            "Vô hiệu hóa nhân viên thất bại. Vui lòng thử lại."
        );
      }
    }
  };

  const handleOpenAssignModal = (staff) => {
    setSelectedStaffForAssign(staff);
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedStaffForAssign(null);
  };

  const handleAssignSuccess = () => {
    fetchStaffList(pagination.pageNumber);
  };

  const formatDate = (date) => {
    if (!date) return "";
    
    // Handle DateOnly string from C# backend (YYYY-MM-DD format)
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-');
      return new Date(year, month - 1, day).toLocaleDateString("vi-VN");
    }
    
    try {
      return new Date(date).toLocaleDateString("vi-VN");
    } catch (e) {
      console.error("Error parsing date:", date, e);
      return "";
    }
  };

  const containerStyle = {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "10px",
    flexWrap: "wrap",
  };

  const filterStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    alignItems: "center",
    flexWrap: "wrap",
  };

  const inputStyle = {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
  };

  const selectStyle = {
    ...inputStyle,
  };

  const buttonStyle = {
    padding: "8px 16px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  };

  const addButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#4CAF50",
    color: "white",
  };

  const searchButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#2196F3",
    color: "white",
  };

  const inactiveButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#f44336",
    color: "white",
    padding: "6px 12px",
    fontSize: "12px",
  };

  const assignButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#FF9800",
    color: "white",
    padding: "6px 12px",
    fontSize: "12px",
    marginRight: "5px",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  };

  const thStyle = {
    backgroundColor: "#f0f0f0",
    border: "1px solid #ddd",
    padding: "12px",
    textAlign: "left",
    fontWeight: "bold",
    color: "#333",
  };

  const tdStyle = {
    border: "1px solid #ddd",
    padding: "12px",
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: "0" }}>Danh sách nhân viên</h2>
        <button
          onClick={() => navigate("/create-staff")}
          style={addButtonStyle}
        >
          + Thêm nhân viên
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "red",
            padding: "10px",
            marginBottom: "20px",
            backgroundColor: "#ffe6e6",
            borderRadius: "4px",
            borderLeft: "4px solid red",
          }}
        >
          {error}
        </div>
      )}

      <div style={filterStyle}>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchKeyword}
          onChange={handleSearchChange}
          onKeyPress={(e) => e.key === "Enter" && handleSearchSubmit()}
          style={{ ...inputStyle, minWidth: "250px" }}
        />
        <button onClick={handleSearchSubmit} style={searchButtonStyle}>
          Tìm kiếm
        </button>

        <select
          value={selectedWarehouse}
          onChange={handleWarehouseChange}
          style={{ ...selectStyle, minWidth: "200px" }}
        >
          <option value="">-- Tất cả kho --</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
              Kho {warehouse.warehouseId} - {warehouse.name || "N/A"}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          Đang tải...
        </div>
      )}

      {!loading && staffList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          Không có nhân viên nào.
        </div>
      ) : (
        <>
          <table style={tableStyle}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Họ tên</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Số điện thoại</th>
                <th style={thStyle}>Kho ID</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}>Ngày bắt đầu</th>
                <th style={thStyle}>Ngày kết thúc</th>
                <th style={thStyle}>Ghi chú</th>
                <th style={thStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff, index) => (
                <tr key={index}>
                  <td style={tdStyle}>{staff.assignmentId}</td>
                  <td style={tdStyle}>{staff.fullName}</td>
                  <td style={tdStyle}>{staff.email}</td>
                  <td style={tdStyle}>{staff.phone || ""}</td>
                  <td style={tdStyle}>{staff.warehouseId}</td>
                  <td style={tdStyle}>
                    {staff.status && (
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor:
                            staff.status?.toUpperCase() === "ACTIVE" ? "#e6ffe6" : "#ffe6e6",
                          color:
                            staff.status?.toUpperCase() === "ACTIVE" ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {staff.status}
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>{formatDate(staff.assignedAt)}</td>
                  <td style={tdStyle}>
                    {staff.endDate ? formatDate(staff.endDate) : ""}
                  </td>
                  <td style={tdStyle}>{staff.notes || ""}</td>
                  <td style={tdStyle}>
                    {staff.status?.toUpperCase() === "ACTIVE" && (
                      <>
                        <button
                          onClick={() => handleOpenAssignModal(staff)}
                          style={assignButtonStyle}
                        >
                          Giao kho
                        </button>
                        <button
                          onClick={() =>
                            handleInactiveStaff(
                              staff.staffId,
                              staff.fullName
                            )
                          }
                          style={inactiveButtonStyle}
                        >
                          Vô hiệu hóa
                        </button>
                      </>
                    )}
                    {staff.status?.toUpperCase() !== "ACTIVE" && (
                      <span style={{ color: "#999" }}>--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "20px",
              padding: "10px",
              backgroundColor: "#f9f9f9",
              borderRadius: "4px",
            }}
          >
            <button
              onClick={handlePreviousPage}
              disabled={pagination.pageNumber <= 1}
              style={{
                ...buttonStyle,
                backgroundColor: pagination.pageNumber <= 1 ? "#ddd" : "#2196F3",
                color: pagination.pageNumber <= 1 ? "#999" : "white",
                cursor:
                  pagination.pageNumber <= 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Trang trước
            </button>

            <span style={{ fontWeight: "bold", color: "#333" }}>
              Trang {pagination.pageNumber} / {pagination.totalPages} (Tổng:{" "}
              {pagination.totalCount} nhân viên)
            </span>

            <button
              onClick={handleNextPage}
              disabled={pagination.pageNumber >= pagination.totalPages}
              style={{
                ...buttonStyle,
                backgroundColor:
                  pagination.pageNumber >= pagination.totalPages
                    ? "#ddd"
                    : "#2196F3",
                color:
                  pagination.pageNumber >= pagination.totalPages
                    ? "#999"
                    : "white",
                cursor:
                  pagination.pageNumber >= pagination.totalPages
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Trang sau →
            </button>
          </div>
        </>
      )}
      
      {showAssignModal && selectedStaffForAssign && (
        <AssignStaffModal
          staff={selectedStaffForAssign}
          warehouses={warehouses}
          onClose={handleCloseAssignModal}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
}

export default ListStaff;

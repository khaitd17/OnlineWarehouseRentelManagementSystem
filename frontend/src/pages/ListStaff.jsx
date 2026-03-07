import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import staffService from "../services/staffService";

function ListStaff() {
  const [searchParams] = useSearchParams();
  const warehouseId = searchParams.get("warehouseId");

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchStaffList(1);
  }, [warehouseId]);

  const fetchStaffList = async (pageNumber) => {
    setLoading(true);
    setError(null);
    try {
      const warehouseIdNum = warehouseId ? parseInt(warehouseId, 10) : null;
      const data = await staffService.listStaff(
        warehouseIdNum,
        pageNumber,
        pagination.pageSize
      );
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

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  return (
    <div className="list-staff-container" style={{ padding: "20px" }}>
      <h2>
        {warehouseId
          ? `Danh sách nhân viên - Kho ID: ${warehouseId}`
          : "Danh sách tất cả nhân viên"}
      </h2>

      {error && (
        <div
          style={{
            color: "red",
            padding: "10px",
            marginBottom: "20px",
            backgroundColor: "#ffe6e6",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      {loading && <p>Đang tải...</p>}

      {!loading && staffList.length === 0 ? (
        <p>Không có nhân viên nào.</p>
      ) : (
        <>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "20px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                  ID
                </th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                  Họ tên
                </th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                  Email
                </th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                  Số điện thoại
                </th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                  Kho ID
                </th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                  Trạng thái
                </th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                  Ngày bắt đầu
                </th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                  Ngày kết thúc
                </th>
                <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff, index) => (
                <tr key={index}>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {staff.assignmentId}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {staff.fullName}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {staff.email}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {staff.phone || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {staff.warehouseId}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor:
                          staff.status === "Active" ? "#e6ffe6" : "#ffe6e6",
                        color:
                          staff.status === "Active" ? "green" : "red",
                      }}
                    >
                      {staff.status || "N/A"}
                    </span>
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {formatDate(staff.assignedAt)}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {staff.endDate ? formatDate(staff.endDate) : "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {staff.notes || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className="pagination"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={handlePreviousPage}
              disabled={pagination.pageNumber <= 1}
              style={{
                padding: "8px 16px",
                cursor:
                  pagination.pageNumber <= 1 ? "not-allowed" : "pointer",
                opacity: pagination.pageNumber <= 1 ? 0.5 : 1,
              }}
            >
              Trang trước
            </button>

            <span>
              Trang {pagination.pageNumber} / {pagination.totalPages} (Tổng:{" "}
              {pagination.totalCount} nhân viên)
            </span>

            <button
              onClick={handleNextPage}
              disabled={pagination.pageNumber >= pagination.totalPages}
              style={{
                padding: "8px 16px",
                cursor:
                  pagination.pageNumber >= pagination.totalPages
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  pagination.pageNumber >= pagination.totalPages ? 0.5 : 1,
              }}
            >
              Trang sau
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ListStaff;

import axiosClient from "./axiosClient";

const staffService = {
  createStaff: async (data) => {
    const response = await axiosClient.post("/staff/create", data);
    return response.data;
  },

  listStaff: async (warehouseId = null, pageNumber = 1, pageSize = 10, searchKeyword = "") => {
    const params = new URLSearchParams();
    if (warehouseId) {
      params.append("warehouseId", warehouseId);
    }
    if (searchKeyword) {
      params.append("searchKeyword", searchKeyword);
    }
    params.append("pageNumber", pageNumber);
    params.append("pageSize", pageSize);

    const response = await axiosClient.get(`/staff/list?${params.toString()}`);
    return response.data;
  },

  inactiveStaffAssignment: async (staffId, warehouseId = null) => {
    const response = await axiosClient.post("/staff/inactive", {
      staffId,
      warehouseId
    });
    return response.data;
  },

  assignStaffToWarehouse: async (staffId, warehouseId, startDate = null, endDate = null, notes = null) => {
    const response = await axiosClient.post("/staff/assign", {
      staffId,
      warehouseId,
      startDate,
      endDate,
      notes
    });
    return response.data;
  },
};

export default staffService;

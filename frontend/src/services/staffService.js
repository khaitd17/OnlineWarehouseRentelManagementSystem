import axiosClient from "./axiosClient";

const staffService = {
  createStaff: async (data) => {
    const response = await axiosClient.post("/staff/create", data);
    return response.data;
  },

  listStaff: async (warehouseId = null, pageNumber = 1, pageSize = 10) => {
    const params = new URLSearchParams();
    if (warehouseId) {
      params.append("warehouseId", warehouseId);
    }
    params.append("pageNumber", pageNumber);
    params.append("pageSize", pageSize);

    const response = await axiosClient.get(`/staff/list?${params.toString()}`);
    return response.data;
  },
};

export default staffService;

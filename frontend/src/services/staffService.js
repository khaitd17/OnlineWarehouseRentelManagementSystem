import axiosClient from "./axiosClient";

const staffService = {
  createStaff: async (data) => {
    const response = await axiosClient.post("/staff/create", data);
    return response.data;
  },

  // [COMMENTED OUT - Database schema changes in progress]
  // Staff assignment functionality is temporarily disabled
  listStaff: async (warehouseId = null, pageNumber = 1, pageSize = 10, searchKeyword = "") => {
    throw new Error("Staff listing is currently disabled. Database changes are in progress.");
    
    // const params = new URLSearchParams();
    // if (warehouseId) {
    //   params.append("warehouseId", warehouseId);
    // }
    // if (searchKeyword) {
    //   params.append("searchKeyword", searchKeyword);
    // }
    // params.append("pageNumber", pageNumber);
    // params.append("pageSize", pageSize);

    // const response = await axiosClient.get(`/staff/list?${params.toString()}`);
    // return response.data;
  },

  inactiveStaffAssignment: async (staffId, warehouseId = null) => {
    throw new Error("Staff deactivation is currently disabled. Database changes are in progress.");
    
    // const response = await axiosClient.post("/staff/inactive", {
    //   staffId,
    //   warehouseId
    // });
    // return response.data;
  },

  assignStaffToWarehouse: async (staffId, warehouseId, startDate = null, endDate = null, notes = null) => {
    throw new Error("Staff assignment is currently disabled. Database changes are in progress.");
    
    // const response = await axiosClient.post("/staff/assign", {
    //   staffId,
    //   warehouseId,
    //   startDate,
    //   endDate,
    //   notes
    // });
    // return response.data;
  },
};

export default staffService;

import axiosClient from "./axiosClient";

const staffService = {
  createStaff: async (data) => {
    const response = await axiosClient.post("/staff/create", data);
    return response.data;
  },

  listStaff: async (warehouseId, page = 1, pageSize = 20, search = "") => {
    const params = new URLSearchParams({ warehouseId, page, pageSize });
    if (search) params.append("search", search);
    const response = await axiosClient.get(`/staff/list?${params.toString()}`);
    return response.data;
  },

  /**
   * Lấy membership của current user trong một kho cụ thể.
   * Trả về { membershipId, roleCode, isAllSkill, isAllZone, skillIds, zoneIds }
   */
  getMyMembership: async (warehouseId) => {
    const response = await axiosClient.get(`/staff/my-membership?warehouseId=${warehouseId}`);
    return response.data;
  },

  /**
   * Lấy danh sách kho mà user có quyền tạo nhân viên (role OPERATOR hoặc MANAGER).
   * Trả về [{ warehouseId, warehouseName, roleCode }]
   */
  getMyManagedWarehouses: async () => {
    const response = await axiosClient.get("/staff/my-managed-warehouses");
    return response.data;
  },

  /**
   * Lấy danh sách skills và zones của một kho (dùng để render form chọn khi tạo nhân viên).
   */
  getWarehouseOptions: async (warehouseId) => {
    const response = await axiosClient.get(`/staff/warehouse-options?warehouseId=${warehouseId}`);
    return response.data; // { skills: [...], zones: [...] }
  },

  /**
   * Cập nhật role, skills, zones của một membership (reassign).
   */
  reassignMembership: async (data) => {
    const response = await axiosClient.put("/staff/reassign", data);
    return response.data;
  },

  deactivateMembership: async (membershipId) => {
    const response = await axiosClient.post("/staff/deactivate", { membershipId });
    return response.data;
  },

  activateMembership: async (membershipId) => {
    const response = await axiosClient.post("/staff/activate", { membershipId });
    return response.data;
  },
};

export default staffService;

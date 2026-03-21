import axiosClient from "./axiosClient";

const warehouseShiftService = {
  getWarehouseShifts: async (warehouseId) => {
    const res = await axiosClient.get(`/schedule/warehouse-shifts?warehouseId=${warehouseId}`);
    return res.data;
  },

  generateSchedule: async (warehouseId, from, to) => {
    const res = await axiosClient.post("/schedule/generate", { warehouseId, from, to });
    return res.data;
  },
};

export default warehouseShiftService;

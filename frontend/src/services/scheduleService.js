import axiosClient from "./axiosClient";

const scheduleService = {
  getMySchedule: async (warehouseId, from, to) => {
    const res = await axiosClient.get(`/schedule/my-schedule?warehouseId=${warehouseId}&from=${from}&to=${to}`);
    return res.data;
  },
};

export default scheduleService;

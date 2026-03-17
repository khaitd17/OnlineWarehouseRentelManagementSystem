import axiosClient from "./axiosClient";

const scheduleService = {
  /**
   * Lấy lịch cá nhân của user đang đăng nhập (ca làm + task) trong một kho.
   * @param {number} warehouseId
   * @param {string} from - YYYY-MM-DD
   * @param {string} to   - YYYY-MM-DD
   */
  getMySchedule: async (warehouseId, from, to) => {
    const response = await axiosClient.get(
      `/staff/my-schedule?warehouseId=${warehouseId}&from=${from}&to=${to}`
    );
    return response.data;
  },
};

export default scheduleService;

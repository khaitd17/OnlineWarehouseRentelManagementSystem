import axiosClient from "./axiosClient";

export const getStaffSchedule = (warehouseId, from, to) =>
  axiosClient.get(`/schedule/staff?warehouseId=${warehouseId}&from=${from}&to=${to}`).then(r => r.data);

export const saveShifts = (shifts) =>
  axiosClient.post("/schedule/shifts", { shifts }).then(r => r.data);


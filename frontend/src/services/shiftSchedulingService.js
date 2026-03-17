import axiosClient from "./axiosClient";

export const getStaffSchedule = (warehouseId, from, to) =>
  axiosClient
    .get(`/staff/schedule?warehouseId=${warehouseId}&from=${from}&to=${to}`)
    .then(r => r.data);

export const saveShifts = (shifts) =>
  axiosClient.post("/staff/shifts", { shifts }).then(r => r.data);

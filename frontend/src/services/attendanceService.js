import axiosClient from './axiosClient';

const attendanceService = {
  // Diem danh vao ca (multipart/form-data: staffShiftId + photo)
  checkIn: async (staffShiftId, photoFile) => {
    const form = new FormData();
    form.append('staffShiftId', staffShiftId);
    if (photoFile) form.append('photo', photoFile);
    const res = await axiosClient.post('/attendance/check-in', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Diem danh ra ca (multipart/form-data: staffShiftId + photo)
  checkOut: async (staffShiftId, photoFile) => {
    const form = new FormData();
    form.append('staffShiftId', staffShiftId);
    if (photoFile) form.append('photo', photoFile);
    const res = await axiosClient.post('/attendance/check-out', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Cap nhat so gio tang ca cho 1 shift (MANAGER/OPERATOR)
  setOvertime: async (staffShiftId, hours) => {
    await axiosClient.put(`/attendance/${staffShiftId}/overtime`, { hours });
  },

  // Cap nhat tang ca hang loat cho nhieu nhan vien (MANAGER/OPERATOR)
  bulkSetOvertime: async (warehouseId, date, membershipIds, hours) => {
    await axiosClient.post('/attendance/bulk-overtime', {
      warehouseId,
      date,
      membershipIds,
      hours,
    });
  },
};

export default attendanceService;

// ─── Task Scheduling Service ──────────────────────────────────────────────────
// Real API calls using axiosClient (JWT auto-injected)
import axiosClient from "./axiosClient";

export async function getMyWarehouses() {
  const res = await axiosClient.get("/staff/my-warehouses");
  return res.data;
}

export async function getWarehouseZones(warehouseId) {
  const res = await axiosClient.get(`/staff/warehouse-options/${warehouseId}`);
  return res.data.zones || [];
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

/**
 * Lấy tasks của tuần theo phạm vi manager.
 * @returns { scheduled: TaskDto[], unscheduled: TaskDto[] }
 */
export async function getWeekTasks(warehouseId, weekStart) {
  const params = new URLSearchParams({ warehouseId });
  if (weekStart) params.append("weekStart", weekStart instanceof Date ? weekStart.toISOString() : weekStart);
  const res = await axiosClient.get(`/tasks?${params}`);
  return res.data; // { scheduled, unscheduled }
}

/**
 * Lấy tất cả task chưa lên lịch.
 * Shortcut: gọi getWeekTasks không truyền weekStart
 */
export async function getUnscheduledTasks(warehouseId) {
  const res = await axiosClient.get(`/tasks?warehouseId=${warehouseId}`);
  return res.data.unscheduled;
}

/**
 * Lấy danh sách TaskType để dropdown Create Task
 */
export async function getTaskTypes() {
  const res = await axiosClient.get("/tasks/types");
  return res.data;
}

/**
 * Tạo task mới
 * @param {number} warehouseId
 * @param {{ taskTypeId, isAllZone, zoneIds, note, scheduledAt }} data
 */
export async function createTask(warehouseId, data) {
  const res = await axiosClient.post(`/tasks/create?warehouseId=${warehouseId}`, data);
  return res.data;
}

/**
 * Lên lịch task: set ScheduledAt (date + time)
 * @param {number} taskId
 * @param {Date|string} scheduledAt ISO datetime
 */
export async function scheduleTask(taskId, scheduledAt) {
  const res = await axiosClient.put(`/tasks/${taskId}/schedule`, {
    scheduledAt: scheduledAt instanceof Date ? scheduledAt.toISOString() : scheduledAt,
  });
  return res.data;
}

/**
 * Huỷ lịch task
 */
export async function unscheduleTask(taskId) {
  const res = await axiosClient.put(`/tasks/${taskId}/unschedule`);
  return res.data;
}

/**
 * Lấy nhân viên eligible cho task (theo TaskType.IsAllSkill)
 */
export async function getEligibleStaff(taskId) {
  const res = await axiosClient.get(`/tasks/${taskId}/eligible-staff`);
  return res.data;
}

/**
 * Gán nhân viên vào task
 * @param {number} taskId
 * @param {number[]} membershipIds
 */
export async function assignStaff(taskId, membershipIds) {
  const res = await axiosClient.put(`/tasks/${taskId}/assign`, { membershipIds });
  return res.data;
}

// ─── Backwards-compatible helpers (dùng trong TaskSchedulingPage) ─────────────
/**
 * @deprecated Use getEligibleStaff(taskId) instead
 */
export async function getAvailableStaff(taskId) {
  return getEligibleStaff(taskId);
}

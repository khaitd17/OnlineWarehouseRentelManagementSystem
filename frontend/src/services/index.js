// ── Export tất cả services ──────────────────────────────────────────

export { default as authService } from "./authService";
export { default as userService } from "./userService";
export { default as warehouseService } from "./warehouseService";
export { default as inventoryService } from "./inventoryService";
export { default as staffService } from "./staffService";
export { default as equipmentService } from "./equipmentService";
export { default as adminService } from "./adminService";
export { default as taskSchedulingService } from "./taskSchedulingService";
export { default as rentalService } from "./rentalService";
export { default as paymentService } from "./paymentService";
export { default as returnService } from "./returnService";
export { default as contractExtensionService } from "./contractExtensionService";
export { default as contractManagementService } from "./contractManagementService";
export { default as notificationService } from "./notificationService";

// ── Legacy compatibility exports ──────────────────────────────────────────
// Để đảm bảo compatibility với code hiện có

import authService from "./authService";
import userService from "./userService";
import warehouseService from "./warehouseService";
import inventoryService from "./inventoryService";
import staffService from "./staffService";
import equipmentService from "./equipmentService";
import adminService from "./adminService";
import taskSchedulingService from "./taskSchedulingService";
import rentalService from "./rentalService";
import paymentService from "./paymentService";
import returnService from "./returnService";
import contractExtensionService from "./contractExtensionService";
import contractManagementService from "./contractManagementService";
import notificationService from "./notificationService";

// Default export object chứa tất cả services
export default {
  auth: authService,
  user: userService,
  warehouse: warehouseService,
  inventory: inventoryService,
  staff: staffService,
  equipment: equipmentService,
  admin: adminService,
  taskScheduling: taskSchedulingService,
  rental: rentalService,
  payment: paymentService,
  return: returnService,
  contractExtension: contractExtensionService,
  contractManagement: contractManagementService,
  notification: notificationService
};

// ── Service utilities ──────────────────────────────────────────
/**
 * Initialize toàn bộ services với token
 * @param {string} token - JWT token
 */
export const initializeServices = async (token) => {
  try {
    // Initialize notification service với token
    if (token) {
      await notificationService.initializeConnection(token);
      await notificationService.requestPermission();
    }

    console.log("Services initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing services:", error);
    return false;
  }
};

/**
 * Cleanup toàn bộ services khi logout
 */
export const cleanupServices = async () => {
  try {
    // Disconnect notification service
    await notificationService.disconnect();

    // Clear any cached data
    notificationService.clearAllNotifications();

    console.log("Services cleaned up successfully");
    return true;
  } catch (error) {
    console.error("Error cleaning up services:", error);
    return false;
  }
};

/**
 * Get connection status của tất cả services
 */
export const getServicesStatus = () => {
  return {
    notification: {
      isConnected: notificationService.isConnectedToHub(),
      status: notificationService.getConnectionStatus()
    },
    // Có thể thêm status của các services khác nếu cần
  };
};
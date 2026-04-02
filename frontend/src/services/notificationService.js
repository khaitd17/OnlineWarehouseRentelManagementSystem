import * as signalR from "@microsoft/signalr";
import axiosClient from "./axiosClient";

class NotificationService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 3000;
  }

  // ── SignalR Connection Management ──────────────────────────────────────────

  /**
   * Initialize SignalR connection
   * @param {string} accessToken - JWT token for authentication
   * @returns {Promise<boolean>} connection success
   */
  async initializeConnection(accessToken) {
    try {
      // Create connection
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${process.env.REACT_APP_API_URL || 'http://localhost:5276'}/hubs/notifications`, {
          accessTokenFactory: () => accessToken
        })
        .configureLogging(signalR.LogLevel.Information)
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

      // Setup connection event handlers
      this.setupConnectionHandlers();

      // Setup notification event handlers
      this.setupNotificationHandlers();

      // Start connection
      await this.connection.start();

      console.log("SignalR connection established");
      this.isConnected = true;
      this.retryCount = 0;

      return true;
    } catch (error) {
      console.error("Error initializing SignalR connection:", error);
      this.isConnected = false;
      await this.retryConnection(accessToken);
      return false;
    }
  }

  /**
   * Setup connection event handlers
   */
  setupConnectionHandlers() {
    if (!this.connection) return;

    this.connection.onreconnecting((error) => {
      console.log("SignalR reconnecting...", error);
      this.isConnected = false;
      this.notifyListeners('connectionStatusChanged', { isConnected: false });
    });

    this.connection.onreconnected((connectionId) => {
      console.log("SignalR reconnected:", connectionId);
      this.isConnected = true;
      this.retryCount = 0;
      this.notifyListeners('connectionStatusChanged', { isConnected: true });
    });

    this.connection.onclose((error) => {
      console.log("SignalR connection closed:", error);
      this.isConnected = false;
      this.notifyListeners('connectionStatusChanged', { isConnected: false });

      // Auto retry if not manually disconnected
      if (error) {
        setTimeout(() => this.retryConnection(), this.retryDelay);
      }
    });
  }

  /**
   * Setup notification event handlers
   */
  setupNotificationHandlers() {
    if (!this.connection) return;

    // Contract status notifications
    this.connection.on("ContractStatusChanged", (data) => {
      console.log("Contract status changed:", data);
      this.processNotification({
        type: "CONTRACT_STATUS_CHANGED",
        title: "Cập nhật hợp đồng",
        message: `Hợp đồng ${data.contractNumber} đã chuyển sang trạng thái ${data.newStatus}`,
        data: data,
        timestamp: new Date()
      });
    });

    // Payment notifications
    this.connection.on("PaymentStatusChanged", (data) => {
      console.log("Payment status changed:", data);
      this.processNotification({
        type: "PAYMENT_STATUS_CHANGED",
        title: "Cập nhật thanh toán",
        message: `Thanh toán ${data.paymentCode} đã ${data.status === 'COMPLETED' ? 'thành công' : 'thất bại'}`,
        data: data,
        timestamp: new Date()
      });
    });

    // Contract extension notifications
    this.connection.on("ExtensionRequestReceived", (data) => {
      console.log("Extension request received:", data);
      this.processNotification({
        type: "EXTENSION_REQUEST_RECEIVED",
        title: "Yêu cầu gia hạn",
        message: `Có yêu cầu gia hạn hợp đồng ${data.contractNumber}`,
        data: data,
        timestamp: new Date()
      });
    });

    // Return warehouse notifications
    this.connection.on("ReturnInspectionRequired", (data) => {
      console.log("Return inspection required:", data);
      this.processNotification({
        type: "RETURN_INSPECTION_REQUIRED",
        title: "Yêu cầu kiểm tra trả kho",
        message: `Cần kiểm tra việc trả kho cho hợp đồng ${data.contractNumber}`,
        data: data,
        timestamp: new Date()
      });
    });

    // General notifications
    this.connection.on("GeneralNotification", (data) => {
      console.log("General notification:", data);
      this.processNotification({
        type: "GENERAL",
        title: data.title || "Thông báo",
        message: data.message,
        data: data,
        timestamp: new Date()
      });
    });

    // System notifications
    this.connection.on("SystemNotification", (data) => {
      console.log("System notification:", data);
      this.processNotification({
        type: "SYSTEM",
        title: "Thông báo hệ thống",
        message: data.message,
        data: data,
        timestamp: new Date(),
        priority: "high"
      });
    });
  }

  /**
   * Process incoming notification
   * @param {Object} notification
   */
  processNotification(notification) {
    // Save to local storage for persistence
    this.saveNotificationToStorage(notification);

    // Notify all listeners
    this.notifyListeners('notificationReceived', notification);

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);
  }

  /**
   * Retry connection with exponential backoff
   * @param {string} accessToken
   */
  async retryConnection(accessToken) {
    if (this.retryCount >= this.maxRetries) {
      console.error("Max retry attempts reached");
      return;
    }

    this.retryCount++;
    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);

    console.log(`Retrying connection in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);

    setTimeout(async () => {
      try {
        await this.initializeConnection(accessToken);
      } catch (error) {
        console.error("Retry connection failed:", error);
        await this.retryConnection(accessToken);
      }
    }, delay);
  }

  /**
   * Disconnect SignalR connection
   */
  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log("SignalR connection disconnected");
    }
  }

  // ── Event Management ──────────────────────────────────────────

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback to remove
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Notify all listeners for an event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  notifyListeners(event, data) {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // ── Browser Notifications ──────────────────────────────────────────

  /**
   * Request notification permission
   * @returns {Promise<string>} Permission result
   */
  async requestPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return "denied";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Show browser notification
   * @param {Object} notification
   */
  showBrowserNotification(notification) {
    if (Notification.permission !== "granted") return;

    const options = {
      body: notification.message,
      icon: "/logo192.png",
      tag: notification.type,
      requireInteraction: notification.priority === "high"
    };

    const browserNotification = new Notification(notification.title, options);

    browserNotification.onclick = () => {
      window.focus();
      this.notifyListeners('notificationClicked', notification);
      browserNotification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);
  }

  // ── Storage Management ──────────────────────────────────────────

  /**
   * Save notification to localStorage
   * @param {Object} notification
   */
  saveNotificationToStorage(notification) {
    try {
      const stored = this.getStoredNotifications();
      stored.unshift({
        ...notification,
        id: Date.now(),
        read: false
      });

      // Keep only last 50 notifications
      const limited = stored.slice(0, 50);

      localStorage.setItem("notifications", JSON.stringify(limited));
    } catch (error) {
      console.error("Error saving notification to storage:", error);
    }
  }

  /**
   * Get notifications from localStorage
   * @returns {Array} Stored notifications
   */
  getStoredNotifications() {
    try {
      const stored = localStorage.getItem("notifications");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error getting stored notifications:", error);
      return [];
    }
  }

  /**
   * Mark notification as read
   * @param {number} notificationId
   */
  markAsRead(notificationId) {
    try {
      const stored = this.getStoredNotifications();
      const notification = stored.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        localStorage.setItem("notifications", JSON.stringify(stored));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    try {
      const stored = this.getStoredNotifications();
      stored.forEach(n => n.read = true);
      localStorage.setItem("notifications", JSON.stringify(stored));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications() {
    try {
      localStorage.removeItem("notifications");
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }

  /**
   * Get unread count
   * @returns {number} Unread notifications count
   */
  getUnreadCount() {
    return this.getStoredNotifications().filter(n => !n.read).length;
  }

  // ── API Notifications ──────────────────────────────────────────

  /**
   * Get notifications from API
   * @param {number} page
   * @param {number} limit
   * @returns {Promise} API notifications
   */
  async getNotifications(page = 1, limit = 20) {
    const response = await axiosClient.get("/notifications", {
      params: { page, limit }
    });
    return response.data;
  }

  /**
   * Mark notification as read via API
   * @param {number} notificationId
   * @returns {Promise}
   */
  async markNotificationAsRead(notificationId) {
    const response = await axiosClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  /**
   * Get unread count from API
   * @returns {Promise<number>}
   */
  async getUnreadCountFromAPI() {
    const response = await axiosClient.get("/notifications/unread-count");
    return response.data.count;
  }

  // ── Connection Status ──────────────────────────────────────────

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnectedToHub() {
    return this.isConnected && this.connection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Get connection status
   * @returns {string}
   */
  getConnectionStatus() {
    if (!this.connection) return "disconnected";

    switch(this.connection.state) {
      case signalR.HubConnectionState.Connected:
        return "connected";
      case signalR.HubConnectionState.Connecting:
        return "connecting";
      case signalR.HubConnectionState.Reconnecting:
        return "reconnecting";
      case signalR.HubConnectionState.Disconnected:
        return "disconnected";
      case signalR.HubConnectionState.Disconnecting:
        return "disconnecting";
      default:
        return "unknown";
    }
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
export default notificationService;

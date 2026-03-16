import axiosClient from "./axiosClient";

const notificationService = {
    getNotifications: () => axiosClient.get("/notifications"),
    markAsRead: (id) => axiosClient.put(`/notifications/${id}/read`),
    getUnreadCount: () => axiosClient.get("/notifications/unread-count"),
};

export default notificationService;

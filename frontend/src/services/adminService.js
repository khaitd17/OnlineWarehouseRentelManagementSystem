import axiosClient from "./axiosClient";

const adminService = {
    // === LOOKUP ===
    getRoles: () => axiosClient.get("/admin/roles"),
    getOwners: () => axiosClient.get("/admin/owners"),
    getWarehousesLookup: () => axiosClient.get("/admin/warehouses"),

    // === ACCOUNTS ===
    getAccounts: (params) => axiosClient.get("/admin/accounts",{ params }),
    updateAccountStatus: (id,status) => axiosClient.put(`/admin/accounts/${id}/status`,{ status }),

    // === WAREHOUSES ===
    getWarehousesByOwner: (ownerId,params) => axiosClient.get(`/admin/owners/${ownerId}/warehouses`,{ params }),
    getWarehouseDetail: (id) => axiosClient.get(`/admin/warehouses/${id}`),
    manageListing: (id,action) => axiosClient.put(`/admin/warehouses/${id}/listing`,{ action }),
    approveWarehouse: (id,data) => axiosClient.put(`/admin/warehouses/${id}/approve`,data),

    // === REPORTS ===
    getSystemReports: (params) => axiosClient.get("/admin/reports",{ params }),
    exportSystemReports: (params) => axiosClient.get("/admin/reports/export",{ params,responseType: "blob" }),

    // === AUDIT SESSIONS ===
    getAuditSessions: (params) => axiosClient.get("/audit-sessions",{ params }),
    getAuditSessionDetail: (id) => axiosClient.get(`/audit-sessions/${id}`),
    createAuditSession: (data) => axiosClient.post("/audit-sessions",data),
    recordAuditResults: (id,data) => axiosClient.post(`/audit-sessions/${id}/results`,data),
    getAuditResults: (id,params) => axiosClient.get(`/audit-sessions/${id}/results`,{ params }),
    exportAuditReport: (id) => axiosClient.get(`/audit-sessions/${id}/export`,{ responseType: "blob" }),
    closeAuditSession: (id,data) => axiosClient.put(`/audit-sessions/${id}/close`,data || {}),
};

export default adminService;

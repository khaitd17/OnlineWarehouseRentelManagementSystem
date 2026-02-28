import axiosClient from "./axiosClient";

const AdminService = {
    getReports: () => {
        return axiosClient.get("/Admin/reports");
    },

    // User management
    getUsers: (params) => {
        return axiosClient.get("/Admin/users",{ params });
    },
    createUser: (userData) => {
        return axiosClient.post("/Admin/users",userData);
    },
    updateUser: (id,userData) => {
        return axiosClient.put(`/Admin/users/${id}`,userData);
    },
    deleteUser: (id) => {
        return axiosClient.delete(`/Admin/users/${id}`);
    },

    // Warehouse management
    getWarehouses: (params) => {
        return axiosClient.get("/Admin/warehouses",{ params });
    },
    getWarehouseById: (id) => {
        return axiosClient.get(`/Admin/warehouses/${id}`);
    },
    uploadImage: (file) => {
        const formData = new FormData();
        formData.append("file",file);
        return axiosClient.post("/Admin/upload",formData,{
            headers: { "Content-Type": "multipart/form-data" }
        });
    },
    createWarehouse: (warehouseData) => {
        return axiosClient.post("/Admin/warehouses",warehouseData);
    },
    updateWarehouse: (id,warehouseData) => {
        return axiosClient.put(`/Admin/warehouses/${id}`,warehouseData);
    },
    approveWarehouse: (approvalData) => {
        return axiosClient.put("/Admin/warehouses/approve",approvalData);
    },
    deleteWarehouse: (id) => {
        return axiosClient.delete(`/Admin/warehouses/${id}`);
    },

    // Metadata
    getRoles: () => {
        return axiosClient.get("/Admin/roles");
    },
    getOwners: () => {
        return axiosClient.get("/Admin/owners");
    }
};

export default AdminService;

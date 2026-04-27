import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:5276/api",
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Response interceptor to handle 401 errors
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Do not redirect if the request is a login attempt
            const originalUrl = error.config?.url || '';
            if (!originalUrl.includes('/auth/login')) {
                // Token expired or invalid
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                
                // Redirect to login page
                window.location.href = "/auth";
            }
        }
        
        if (error.response?.status === 400 || error.response?.status === 500) {
            const originalUrl = error.config?.url || '';
            const isAdminRoute = originalUrl.includes('/admin/');
            const message = error.response.data?.message || error.response.data || "";
            const msgStr = typeof message === 'string' ? message : JSON.stringify(message);

            if (!isAdminRoute && (msgStr.includes("giới hạn gói") || msgStr.includes("hết hạn") || msgStr.includes("nâng cấp gói"))) {
                import('antd').then(({ Modal }) => {
                    Modal.warning({
                        title: 'Giới hạn Gói dịch vụ',
                        content: msgStr,
                        okText: 'Nâng cấp ngay',
                        cancelText: 'Bỏ qua',
                        showCancel: true,
                        onOk: () => { window.location.href = '/subscription'; }
                    });
                });
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
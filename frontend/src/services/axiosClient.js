import axios from "axios";
import { toast } from "sonner";

const axiosClient = axios.create({
    baseURL: "http://localhost:5276/api", // Corrected backend port from launchSettings.json
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Adding response interceptor for consistent error handling and toast notifications
axiosClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";

        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Only redirect if not already on login page to avoid loops
            if (!window.location.pathname.startsWith("/login")) {
                window.location.href = "/login";
            }
        }

        toast.error(message);
        return Promise.reject(error);
    }
);

export default axiosClient;
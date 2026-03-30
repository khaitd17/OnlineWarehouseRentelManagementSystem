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
            // Token expired or invalid
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            
            // Redirect to login page
            window.location.href = "/auth";
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
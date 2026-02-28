import axiosClient from "./axiosClient";

const AuthService = {
    login: (email,password) => {
        return axiosClient.post("/Auth/login",{ email,password });
    },

    // Add other auth methods as needed (register, getProfile, etc.)
};

export default AuthService;

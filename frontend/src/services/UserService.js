import axiosClient from "./axiosClient";

const UserService = {
    getProfile: () => {
        return axiosClient.get("/User/profile");
    },
    uploadAvatar: (file) => {
        const formData = new FormData();
        formData.append("file",file);
        return axiosClient.post("/User/upload-avatar",formData,{
            headers: { "Content-Type": "multipart/form-data" }
        });
    }
};

export default UserService;

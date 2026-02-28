import { useAuthStore } from "../lib/stores/authStore";

export const useAuth = () => {
    const { user,token,isAuthenticated,setUser,logout } = useAuthStore();

    return {
        user,
        token,
        isAuthenticated,
        setUser,
        logout,
        isLoading: false, // Simple CRA implementation doesn't need complex loading for initial mount
    };
};

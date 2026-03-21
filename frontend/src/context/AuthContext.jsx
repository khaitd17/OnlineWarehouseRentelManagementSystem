import { createContext, useState, useContext, useEffect } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => authService.getCurrentUser());
    const [warehouseContext, setWarehouseContext] = useState(() => authService.getWarehouseContext());

    // Listen for auth changes dispatched by authService (login/logout)
    useEffect(() => {
        const handleAuthChange = () => {
            setUser(authService.getCurrentUser());
            setWarehouseContext(authService.getWarehouseContext());
        };
        window.addEventListener("authChange", handleAuthChange);
        return () => window.removeEventListener("authChange", handleAuthChange);
    }, []);

    const login = (userData, ctx) => {
        localStorage.setItem("user", JSON.stringify(userData));
        if (ctx) localStorage.setItem("warehouseContext", JSON.stringify(ctx));
        setUser(userData);
        setWarehouseContext(ctx || null);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setWarehouseContext(null);
        window.dispatchEvent(new Event("authChange"));
    };

    // Get all effective roles: systemRole + all warehouse roles
    const getEffectiveRoles = () => {
        const roles = new Set();
        const systemRole = (user?.role || user?.roleName || "").toUpperCase();
        if (systemRole) roles.add(systemRole);
        const warehouses = warehouseContext?.warehouses || [];
        warehouses.forEach(w => {
            if (w.role) roles.add(w.role.toUpperCase());
        });
        return Array.from(roles);
    };

    // True if user has any RENTER warehouse membership
    const isRenter = () => {
        const warehouses = warehouseContext?.warehouses || [];
        return warehouses.some(w => (w.role || "").toUpperCase() === "RENTER");
    };

    // True if user has any STAFF or MANAGER warehouse membership
    const isStaff = () => {
        const warehouses = warehouseContext?.warehouses || [];
        return warehouses.some(w => {
            const r = (w.role || "").toUpperCase();
            return r === "STAFF" || r === "MANAGER";
        });
    };

    // True if user has any OWNER or OPERATOR warehouse membership
    const isOwner = () => {
        const warehouses = warehouseContext?.warehouses || [];
        return warehouses.some(w => {
            const r = (w.role || "").toUpperCase();
            return r === "OWNER" || r === "OPERATOR";
        });
    };

    return (
        <AuthContext.Provider value={{
            user,
            warehouseContext,
            login,
            logout,
            getEffectiveRoles,
            isRenter,
            isStaff,
            isOwner,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
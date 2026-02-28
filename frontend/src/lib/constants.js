export const UserRole = {
    ADMIN: "ADMIN",
    OWNER: "OWNER",
    RENTER: "RENTER",
    STAFF: "STAFF",
};

export const MENU_ITEMS = [
    {
        name: "Tổng quan",
        path: "/dashboard",
        icon: "LayoutDashboard",
        roles: [UserRole.ADMIN],
    },
    {
        name: "Người dùng",
        path: "/users",
        icon: "Users",
        roles: [UserRole.ADMIN],
    },
    {
        name: "Kho bãi",
        path: "/warehouses",
        icon: "Building2",
        roles: [UserRole.ADMIN,UserRole.OWNER],
    }
];

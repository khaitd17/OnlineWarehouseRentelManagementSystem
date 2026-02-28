import React,{ useState,useEffect,useCallback } from "react";
import { MainLayout } from "../../layouts/MainLayout";
import { DataTable } from "../../components/common/DataTable";
import { BaseModal } from "../../components/common/BaseModal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import AdminService from "../../services/AdminService";
import { Edit2,Trash2,UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export default function UsersPage() {
    const [users,setUsers] = useState([]);
    const [roles,setRoles] = useState([]);
    const [totalRecords,setTotalRecords] = useState(0);
    const [loading,setLoading] = useState(true);
    const [isModalOpen,setIsModalOpen] = useState(false);
    const [currentUser,setCurrentUser] = useState(null);

    // Query state
    const [page,setPage] = useState(1);
    const [pageSize,setPageSize] = useState(10);
    const [search,setSearch] = useState("");
    const [sortBy,setSortBy] = useState("createdAt");
    const [isAscending,setIsAscending] = useState(false);

    const [formData,setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        roleId: "",
        status: "ACTIVE"
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const sortMap = {
                fullName: "FullName",
                email: "Email",
                roleName: "Role.RoleName",
                status: "Status",
                createdAt: "CreatedAt"
            };
            const response = await AdminService.getUsers({
                pageNumber: page,
                pageSize: pageSize,
                search: search,
                sortBy: sortMap[sortBy] || "CreatedAt",
                isAscending: isAscending
            });
            if (response.success) {
                setUsers(response.data.items || []);
                setTotalRecords(response.data.totalCount || 0);
            }
        } catch (err) {
            console.error("Failed to fetch users",err);
        } finally {
            setLoading(false);
        }
    },[page,pageSize,search,sortBy,isAscending]);

    const fetchRoles = async () => {
        try {
            const rolesRes = await AdminService.getRoles();
            if (rolesRes.success) {
                setRoles(rolesRes.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch roles",err);
        }
    };

    useEffect(() => {
        fetchRoles();
    },[]);

    useEffect(() => {
        fetchUsers();
    },[fetchUsers]);

    const handleOpenAddModal = () => {
        setCurrentUser(null);
        const defaultRole = roles.find(r => r.roleName === "RENTER")?.roleId || (roles[0]?.roleId || "");
        setFormData({ fullName: "",email: "",password: "",phone: "",roleId: defaultRole,status: "ACTIVE" });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user) => {
        setCurrentUser(user);
        const role = roles.find(r => r.roleName === user.roleName);
        setFormData({
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || "",
            roleId: role?.roleId || "",
            status: user.status
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentUser) {
                await AdminService.updateUser(currentUser.userId,{
                    userId: currentUser.userId,
                    ...formData
                });
                toast.success("Cập nhật thành công!");
            } else {
                await AdminService.createUser(formData);
                toast.success("Thêm mới thành công!");
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) { }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
        try {
            await AdminService.deleteUser(id);
            toast.success("Đã xóa người dùng!");
            fetchUsers();
        } catch (err) { }
    };

    const handleSort = (key,direction) => {
        setSortBy(key);
        setIsAscending(direction === 'asc');
    };

    const columns = [
        {
            key: "fullName",
            title: "Họ và Tên",
            sortable: true,
            render: (u) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {u.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-gray-900">{u.fullName}</span>
                </div>
            )
        },
        { key: "email",title: "Email",sortable: true },
        {
            key: "roleName",
            title: "Vai trò",
            render: (u) => (
                <span className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                    u.roleName === "ADMIN" ? "bg-red-50 text-red-600 border border-red-100" :
                        u.roleName === "OWNER" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                            "bg-gray-50 text-gray-600 border border-gray-100"
                )}>
                    {u.roleName}
                </span>
            )
        },
        {
            key: "status",
            title: "Trạng thái",
            render: (u) => (
                <span className={cn(
                    "flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-tight",
                    u.status.toUpperCase() === "ACTIVE" ? "text-green-600" : "text-gray-400"
                )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full",u.status.toUpperCase() === "ACTIVE" ? "bg-green-600" : "bg-gray-400")} />
                    {u.status}
                </span>
            )
        },
        {
            key: "createdAt",
            title: "Ngày tạo",
            sortable: true,
            render: (u) => <span className="text-gray-500 font-medium">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</span>
        }
    ];

    return (
        <MainLayout>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Người dùng</h1>
                        <p className="text-gray-500 font-medium mt-1">Quản lý tài khoản quản trị viên, chủ kho và người thuê.</p>
                    </div>
                    <Button onClick={handleOpenAddModal} className="rounded-md flex items-center gap-2 pr-6 shadow-sm hover:shadow transition-all font-bold">
                        <UserPlus size={18} /> Thêm người dùng
                    </Button>
                </div>

                <DataTable
                    data={users}
                    columns={columns}
                    totalRecords={totalRecords}
                    loading={loading}
                    page={page}
                    pageSize={pageSize}
                    keyword={search}
                    sortBy={sortBy}
                    sortDirection={isAscending ? 'asc' : 'desc'}
                    itemName="người dùng"
                    onPageChange={setPage}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                    onSearch={(val) => { setSearch(val); setPage(1); }}
                    onSort={handleSort}
                    rowActions={(u) => [
                        { label: "Sửa thông tin",icon: <Edit2 size={14} />,onClick: () => handleOpenEditModal(u) },
                        { label: "Xóa tài khoản",icon: <Trash2 size={14} />,onClick: () => handleDelete(u.userId),className: "text-red-600 hover:bg-red-50" }
                    ]}
                />

                <BaseModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    title={currentUser ? "Cập nhật người dùng" : "Thêm người dùng mới"}
                    subtitle={currentUser ? `Sửa thông tin cho ${currentUser.fullName}` : "Điền đầy đủ các thông tin bên dưới."}
                    onSubmit={handleSubmit}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label>Họ và tên</Label>
                            <Input
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData,fullName: e.target.value })}
                                required
                                className="rounded-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData,email: e.target.value })}
                                required
                                disabled={!!currentUser}
                                className="rounded-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Số điện thoại</Label>
                            <Input
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData,phone: e.target.value })}
                                className="rounded-md"
                            />
                        </div>
                        {!currentUser && (
                            <div className="col-span-2 space-y-2">
                                <Label>Mật khẩu</Label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData,password: e.target.value })}
                                    required
                                    className="rounded-md"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Vai trò</Label>
                            <select
                                className="w-full h-11 rounded-md border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-primary shadow-sm outline-none"
                                value={formData.roleId}
                                onChange={e => setFormData({ ...formData,roleId: Number(e.target.value) })}
                                required
                            >
                                <option value="" disabled>Chọn vai trò</option>
                                {roles.map(r => (
                                    <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Trạng thái</Label>
                            <select
                                className="w-full h-11 rounded-md border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-primary shadow-sm outline-none"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData,status: e.target.value })}
                            >
                                <option value="ACTIVE">Hoạt động</option>
                                <option value="PENDING">Chờ duyệt</option>
                                <option value="SUSPENDED">Tạm dừng</option>
                            </select>
                        </div>
                    </div>
                </BaseModal>
            </div>
        </MainLayout>
    );
}

import React,{ useState,useEffect,useCallback } from "react";
import { MainLayout } from "../../layouts/MainLayout";
import { DataTable } from "../../components/common/DataTable";
import { BaseModal } from "../../components/common/BaseModal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import AdminService from "../../services/AdminService";
import { Plus,Edit2,Trash2,MapPin,CheckCircle,Eye,Upload,X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export default function WarehousesPage() {
    const [warehouses,setWarehouses] = useState([]);
    const [owners,setOwners] = useState([]);
    const [totalRecords,setTotalRecords] = useState(0);
    const [loading,setLoading] = useState(true);

    // Modals
    const [isModalOpen,setIsModalOpen] = useState(false);
    const [isDetailModalOpen,setIsDetailModalOpen] = useState(false);

    // Data states
    const [currentWarehouse,setCurrentWarehouse] = useState(null);
    const [warehouseDetail,setWarehouseDetail] = useState(null);
    const [uploading,setUploading] = useState(false);
    const [submitting,setSubmitting] = useState(false);

    // Query state
    const [page,setPage] = useState(1);
    const [pageSize,setPageSize] = useState(10);
    const [search,setSearch] = useState("");
    const [sortBy,setSortBy] = useState("createdAt");
    const [isAscending,setIsAscending] = useState(false);

    const [formData,setFormData] = useState({
        name: "",
        address: "",
        totalArea: "",
        availableArea: "",
        ownerId: "",
        status: "PENDING",
        description: "",
        operatingHours: "",
        lat: "",
        lng: "",
        mediaUrls: []
    });

    const fetchWarehouses = useCallback(async () => {
        setLoading(true);
        try {
            const sortMap = {
                name: "Name",
                ownerName: "Owner.FullName",
                totalArea: "TotalArea",
                status: "Status",
                createdAt: "CreatedAt"
            };
            const response = await AdminService.getWarehouses({
                pageNumber: page,
                pageSize: pageSize,
                search: search,
                sortBy: sortMap[sortBy] || "CreatedAt",
                isAscending: isAscending
            });
            if (response.success) {
                setWarehouses(response.data.items || []);
                setTotalRecords(response.data.totalCount || 0);
            }
        } catch (err) {
            console.error("Failed to fetch warehouses",err);
            toast.error("Không thể tải danh sách kho.");
        } finally {
            setLoading(false);
        }
    },[page,pageSize,search,sortBy,isAscending]);

    const fetchOwners = async () => {
        try {
            const ownersRes = await AdminService.getOwners();
            if (ownersRes.success) {
                setOwners(ownersRes.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch owners",err);
        }
    };

    useEffect(() => {
        fetchOwners();
        fetchWarehouses();
    },[fetchWarehouses]);

    const handleOpenAddModal = () => {
        setCurrentWarehouse(null);
        setFormData({
            name: "",
            address: "",
            totalArea: "",
            availableArea: "",
            ownerId: owners.length > 0 ? owners[0].userId : "",
            status: "PENDING",
            description: "",
            operatingHours: "",
            lat: "",
            lng: "",
            mediaUrls: []
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = async (w) => {
        setLoading(true);
        try {
            const res = await AdminService.getWarehouseById(w.warehouseId);
            if (res.success) {
                const detail = res.data;
                setCurrentWarehouse(detail);
                setFormData({
                    name: detail.name,
                    address: detail.address,
                    totalArea: detail.totalArea,
                    availableArea: detail.availableArea,
                    ownerId: detail.ownerId,
                    status: detail.status,
                    description: detail.description || "",
                    operatingHours: detail.operatingHours || "",
                    lat: detail.lat || "",
                    lng: detail.lng || "",
                    mediaUrls: detail.media.map(m => m.mediaUrl)
                });
                setIsModalOpen(true);
            }
        } catch (err) {
            toast.error("Không thể tải thông tin chi tiết");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (id) => {
        setLoading(true);
        try {
            const res = await AdminService.getWarehouseById(id);
            if (res.success) {
                setWarehouseDetail(res.data);
                setIsDetailModalOpen(true);
            }
        } catch (err) {
            toast.error("Không thể tải chi tiết kho");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const newUrls = [...formData.mediaUrls];

        try {
            for (const file of files) {
                const res = await AdminService.uploadImage(file);
                if (res.url) {
                    newUrls.push(res.url);
                }
            }
            setFormData(prev => ({ ...prev,mediaUrls: newUrls }));
            toast.success(`Đã tải lên ${files.length} ảnh`);
        } catch (err) {
            toast.error("Lỗi khi tải ảnh lên");
        } finally {
            setUploading(false);
            e.target.value = null;
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            mediaUrls: prev.mediaUrls.filter((_,i) => i !== index)
        }));
    };

    const handleTotalAreaChange = (val) => {
        setFormData(prev => ({
            ...prev,
            totalArea: val,
            availableArea: (prev.availableArea === "" || prev.availableArea === prev.totalArea) ? val : prev.availableArea
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!formData.ownerId) {
            toast.error("Vui lòng chọn chủ sở hữu kho!");
            return;
        }

        if (Number(formData.availableArea) > Number(formData.totalArea)) {
            toast.error("Diện tích trống không thể lớn hơn tổng diện tích!");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                totalArea: Number(formData.totalArea),
                availableArea: Number(formData.availableArea),
                ownerId: Number(formData.ownerId),
                lat: formData.lat ? Number(formData.lat) : null,
                lng: formData.lng ? Number(formData.lng) : null
            };

            if (currentWarehouse) {
                await AdminService.updateWarehouse(currentWarehouse.warehouseId,{
                    warehouseId: currentWarehouse.warehouseId,
                    ...payload
                });
                toast.success("Cập nhật kho thành công!");
            } else {
                await AdminService.createWarehouse(payload);
                toast.success("Thêm kho bãi mới thành công!");
            }
            setIsModalOpen(false);
            fetchWarehouses();
        } catch (err) {
            // Lỗi đã được xử lý bởi interceptor
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await AdminService.approveWarehouse({ warehouseId: id,status: "APPROVED",remarks: "Approved by Admin" });
            toast.success("Đã phê duyệt kho!");
            fetchWarehouses();
        } catch (err) { }
    };

    const handleSort = (key,direction) => {
        setSortBy(key);
        setIsAscending(direction === 'asc');
    };

    const columns = [
        {
            key: "name",
            title: "Tên Kho",
            sortable: true,
            render: (w) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{w.name}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {w.address}
                    </span>
                </div>
            )
        },
        {
            key: "ownerName",
            title: "Chủ sở hữu",
            render: (w) => (
                <span className="font-medium text-gray-900">{w.ownerName}</span>
            )
        },
        {
            key: "totalArea",
            title: "Diện tích",
            sortable: true,
            render: (w) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{w.totalArea} m²</span>
                    <span className="text-xs text-gray-500">Trống: {w.availableArea} m²</span>
                </div>
            )
        },
        {
            key: "status",
            title: "Trạng thái",
            sortable: true,
            render: (w) => (
                <span className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                    w.status === "APPROVED" || w.status === "ACTIVE" ? "bg-green-50 text-green-600 border border-green-100" :
                        w.status === "PENDING" ? "bg-orange-50 text-orange-600 border border-orange-100" :
                            "bg-gray-50 text-gray-600 border border-gray-100"
                )}>
                    {w.status}
                </span>
            )
        }
    ];

    return (
        <MainLayout>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Kho bãi</h1>
                        <p className="text-gray-500 font-medium mt-1">Quản lý danh sách kho bãi, thông tin chi tiết và phê duyệt hệ thống.</p>
                    </div>
                    <Button onClick={handleOpenAddModal} className="rounded-md flex items-center gap-2 pr-6 shadow-sm hover:shadow transition-all font-bold">
                        <Plus size={18} /> Thêm kho bãi
                    </Button>
                </div>

                <DataTable
                    data={warehouses}
                    columns={columns}
                    totalRecords={totalRecords}
                    loading={loading}
                    page={page}
                    pageSize={pageSize}
                    keyword={search}
                    sortBy={sortBy}
                    sortDirection={isAscending ? 'asc' : 'desc'}
                    itemName="kho bãi"
                    onPageChange={setPage}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                    onSearch={(val) => { setSearch(val); setPage(1); }}
                    onSort={handleSort}
                    rowActions={(w) => [
                        { label: "Xem chi tiết",icon: <Eye size={14} />,onClick: () => handleViewDetail(w.warehouseId) },
                        { label: "Sửa thông tin",icon: <Edit2 size={14} />,onClick: () => handleOpenEditModal(w) },
                        { label: "Duyệt kho",icon: <CheckCircle size={14} />,onClick: () => handleApprove(w.warehouseId),hidden: w.status !== "PENDING",className: "text-green-600 hover:bg-green-50" },
                        { label: "Xóa kho",icon: <Trash2 size={14} />,onClick: () => { },className: "text-red-600 hover:bg-red-50" }
                    ]}
                />

                {/* Form Modal: Clean style matching UsersPage */}
                <BaseModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    title={currentWarehouse ? "Cập nhật kho bãi" : "Thêm kho bãi mới"}
                    subtitle="Điền đầy đủ các thông tin bên dưới."
                    onSubmit={handleSubmit}
                    loading={submitting}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label>Tên kho bãi</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData,name: e.target.value })}
                                required
                                className="rounded-md"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label>Địa chỉ chi tiết</Label>
                            <Input
                                value={formData.address}
                                onChange={e => setFormData({ ...formData,address: e.target.value })}
                                required
                                className="rounded-md"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tổng diện tích (m²)</Label>
                            <Input
                                type="number"
                                value={formData.totalArea}
                                onChange={e => handleTotalAreaChange(e.target.value)}
                                required
                                className="rounded-md"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Diện tích trống (m²)</Label>
                            <Input
                                type="number"
                                value={formData.availableArea}
                                onChange={e => setFormData({ ...formData,availableArea: e.target.value })}
                                required
                                className="rounded-md"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Chủ sở hữu</Label>
                            <select
                                className="w-full h-11 rounded-md border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-primary shadow-sm outline-none"
                                value={formData.ownerId}
                                onChange={e => setFormData({ ...formData,ownerId: e.target.value })}
                                required
                            >
                                <option value="" disabled>Chọn chủ kho</option>
                                {owners.map(o => (
                                    <option key={o.userId} value={o.userId}>{o.fullName}</option>
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
                                <option value="PENDING">Chờ duyệt</option>
                                <option value="APPROVED">Đã duyệt</option>
                                <option value="ACTIVE">Hoạt động</option>
                                <option value="INACTIVE">Ngưng hoạt động</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Tọa độ (Lat)</Label>
                            <Input
                                type="number" step="any"
                                value={formData.lat}
                                onChange={e => setFormData({ ...formData,lat: e.target.value })}
                                className="rounded-md"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tọa độ (Lng)</Label>
                            <Input
                                type="number" step="any"
                                value={formData.lng}
                                onChange={e => setFormData({ ...formData,lng: e.target.value })}
                                className="rounded-md"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label>Giờ hoạt động</Label>
                            <Input
                                placeholder="VD: 08:00 - 18:00"
                                value={formData.operatingHours}
                                onChange={e => setFormData({ ...formData,operatingHours: e.target.value })}
                                className="rounded-md"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label>Mô tả chi tiết</Label>
                            <textarea
                                className="w-full p-3 rounded-md border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-primary min-h-[100px] outline-none"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData,description: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label>Hình ảnh kho ({formData.mediaUrls.length})</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 bg-gray-50 flex flex-col items-center justify-center relative">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                <Upload className="text-gray-400 mb-2" size={24} />
                                <p className="text-sm font-medium text-gray-600">
                                    {uploading ? "Đang tải ảnh lên..." : "Click hoặc kéo thả file ảnh vào đây"}
                                </p>
                            </div>

                            {formData.mediaUrls.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-4">
                                    {formData.mediaUrls.map((url,index) => (
                                        <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-gray-200 group">
                                            <img src={url} alt={`img-${index}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </BaseModal>

                {/* Detail Modal: Clean and standard style */}
                <BaseModal
                    open={isDetailModalOpen}
                    onOpenChange={setIsDetailModalOpen}
                    title="Chi tiết kho bãi"
                    subtitle={warehouseDetail?.name}
                    onSubmit={(e) => { e.preventDefault(); setIsDetailModalOpen(false); }}
                    submitText="Đóng"
                >
                    {warehouseDetail && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                                <div>
                                    <Label className="text-gray-500 mb-1 block">Tên kho</Label>
                                    <p className="font-medium text-gray-900">{warehouseDetail.name}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500 mb-1 block">Trạng thái</Label>
                                    <p className="font-medium text-gray-900">{warehouseDetail.status}</p>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-gray-500 mb-1 block">Địa chỉ</Label>
                                    <p className="font-medium text-gray-900">{warehouseDetail.address}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500 mb-1 block">Tổng diện tích</Label>
                                    <p className="font-medium text-gray-900">{warehouseDetail.totalArea} m²</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500 mb-1 block">Diện tích trống</Label>
                                    <p className="font-medium text-gray-900">{warehouseDetail.availableArea} m²</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500 mb-1 block">Chủ sở hữu</Label>
                                    <p className="font-medium text-gray-900">{warehouseDetail.ownerName}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500 mb-1 block">Giờ hoạt động</Label>
                                    <p className="font-medium text-gray-900">{warehouseDetail.operatingHours || "Chưa cập nhật"}</p>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-gray-500 mb-1 block">Mô tả</Label>
                                    <p className="font-medium text-gray-900 whitespace-pre-wrap">{warehouseDetail.description || "Không có mô tả"}</p>
                                </div>
                            </div>

                            {warehouseDetail.media && warehouseDetail.media.length > 0 && (
                                <div className="border-t pt-4">
                                    <Label className="text-gray-500 mb-2 block">Hình ảnh ({warehouseDetail.media.length})</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {warehouseDetail.media.map((m,i) => (
                                            <div key={i} className="aspect-square rounded-md overflow-hidden border border-gray-200">
                                                <img src={m.mediaUrl} alt="Warehouse media" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </BaseModal>
            </div>
        </MainLayout>
    );
}
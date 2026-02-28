import React,{ useState,useEffect } from "react";
import { MainLayout } from "../../layouts/MainLayout";
import AdminService from "../../services/AdminService";
import {
    Users,
    Building2,
    BarChart3,
    TrendingUp,
    Package,
    CheckCircle2,
    Clock,
    AlertTriangle
} from "lucide-react";
import { cn } from "../../lib/utils";

const StatCard = ({ title,value,icon: Icon,color,trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md group">
        <div className="flex justify-between items-start mb-4">
            <div className={cn("p-3 rounded-xl transition-colors",color)}>
                <Icon className="h-6 w-6" />
            </div>
            {trend && (
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                    <TrendingUp size={12} /> {trend}
                </span>
            )}
        </div>
        <p className="text-gray-500 font-medium text-sm mb-1">{title}</p>
        <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
);

export default function DashboardPage() {
    const [reports,setReports] = useState(null);
    const [loading,setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    },[]);

    const fetchReports = async () => {
        try {
            const response = await AdminService.getReports();
            if (response.success) {
                setReports(response.data);
            }
        } catch (err) {
            console.error("Failed to fetch reports",err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </MainLayout>
        );
    }

    const stats = [
        {
            title: "Tổng người dùng",
            value: reports?.totalUsers || 0,
            icon: Users,
            color: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
            trend: "+12.5%"
        },
        {
            title: "Kho bãi hệ thống",
            value: reports?.totalWarehouses || 0,
            icon: Building2,
            color: "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white",
            trend: "+2"
        },
        {
            title: "Hợp đồng Active",
            value: reports?.activeContracts || 0,
            icon: CheckCircle2,
            color: "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white",
        },
        {
            title: "Kho chờ phê duyệt",
            value: reports?.pendingWarehouses || 0,
            icon: Clock,
            color: "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white",
        }
    ];

    return (
        <MainLayout>
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tổng quan hệ thống</h1>
                    <p className="text-gray-500 font-medium mt-1">Chào mừng bạn quay trở lại, đây là tình hình kinh doanh hôm nay.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat,i) => (stat && <StatCard key={i} {...stat} />))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-gray-900">Hoạt động gần đây</h3>
                            <BarChart3 className="text-gray-400 h-5 w-5" />
                        </div>
                        <div className="space-y-6">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Users size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800">Người dùng mới đăng ký</p>
                                        <p className="text-xs text-gray-500 font-medium">2 giờ trước • user_abc@email.com</p>
                                    </div>
                                    <span className="text-xs font-bold text-primary bg-primary/5 px-3 py-1 rounded-lg">Thêm mới</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary p-8 rounded-3xl shadow-xl shadow-primary/20 flex flex-col justify-between text-white relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[80px]" />
                        <div className="relative z-10">
                            <Package className="h-10 w-10 mb-6 opacity-80" />
                            <h3 className="text-2xl font-bold mb-2">Tỉ lệ lấp đầy</h3>
                            <p className="text-white/70 text-sm font-medium leading-relaxed">Hiện tại 75% diện tích kho đã được thuê. Bạn nên cân nhắc thêm kho mới.</p>
                        </div>
                        <div className="mt-10 relative z-10">
                            <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-white rounded-full w-[75%]" />
                            </div>
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                <span>75% Đã dùng</span>
                                <span>25% Trống</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

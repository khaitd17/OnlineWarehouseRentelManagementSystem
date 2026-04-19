import React, { useState, useEffect } from 'react';
import { getOccupancyStats } from '../services/warehouseService';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
    AlertTriangle, LayoutDashboard, Package, TrendingUp, 
    Layers, Clock, ArrowUpRight, ArrowDownRight,
    PieChart as PieIcon, BarChart3, Activity
} from 'lucide-react';

const OccupancyDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getOccupancyStats();
                setStats(data);
            } catch (error) {
                console.error("Error fetching occupancy stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-cyan-600 animate-spin"></div>
                    <div className="mt-4 text-slate-500 font-medium animate-pulse">Đang tải dữ liệu...</div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900">Không tìm thấy dữ liệu</h3>
                <p className="text-slate-500 mt-2">Vui lòng kiểm tra lại kết nối hoặc phân quyền của bạn.</p>
            </div>
        );
    }

    const { 
        totalWarehouses, totalGlobalArea, totalOccupiedArea, totalReservedArea, 
        totalAvailableArea, averageOccupancyRate, warehouses, occupancyTrends, 
        equipmentStats 
    } = stats;

    const KPI_CARDS = [
        { label: 'Tổng số kho', value: totalWarehouses, sub: 'Kho hàng đang quản lý', icon: <Package size={20} />, bg: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
        { label: 'Tỉ lệ lấp đầy TB', value: `${averageOccupancyRate.toFixed(1)}%`, sub: 'Toàn bộ hệ thống', icon: <Activity size={20} />, bg: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
        { label: 'Thể tích sử dụng', value: `${totalOccupiedArea.toLocaleString()} m³`, sub: 'Đang được thuê thực tế', icon: <Layers size={20} />, bg: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
        { label: 'Thể tích đặt trước', value: `${totalReservedArea.toLocaleString()} m³`, sub: 'Hợp đồng sắp hiệu lực', icon: <Clock size={20} />, bg: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
    ];

    // Data for Pie Chart
    const pieData = [
        { name: 'Đã sử dụng', value: totalOccupiedArea, color: '#10b981' }, // emerald-500
        { name: 'Đặt trước', value: totalReservedArea, color: '#f59e0b' },   // amber-500
        { name: 'Còn trống', value: totalAvailableArea, color: '#e2e8f0' },  // slate-200
    ].filter(d => d.value > 0);

    // Data for Bar Chart
    const barData = warehouses.map(wh => ({
        name: wh.name.length > 15 ? wh.name.substring(0, 15) + '...' : wh.name,
        'Hiệu suất': wh.occupancyRate
    })).sort((a, b) => b['Hiệu suất'] - a['Hiệu suất']);

    const getBarColor = (pct) => {
        if (pct >= 85) return '#f97316'; // orange - near capacity
        if (pct >= 40) return '#06b6d4'; // cyan - healthy
        return '#f43f5e';                // rose - critically low
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg">
                    <p className="text-sm font-bold text-slate-900 mb-1">{label}</p>
                    <p className="text-sm font-semibold" style={{ color: payload[0].fill || payload[0].color }}>
                        {payload[0].value.toFixed(1)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full flex-1 flex flex-col min-w-0 pb-10" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-cyan-600 rounded-lg text-white shadow-lg shadow-cyan-200">
                                <LayoutDashboard size={18} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-cyan-700">Analytics Dashboard</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">
                            Hiệu Suất Kho Hàng
                        </h1>
                        <p className="text-slate-500 text-base mt-2 max-w-2xl">
                            Thông tin chi tiết về công suất sử dụng, diện tích đặt trước và hiệu suất vận hành hệ thống kho.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                        <button className="px-5 py-2.5 text-sm font-bold bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all">Xuất báo cáo</button>
                        <button className="px-5 py-2.5 text-sm font-bold bg-cyan-600 text-white rounded-xl shadow-lg shadow-cyan-200 hover:bg-cyan-700 active:scale-95 transition-all">Làm mới dữ liệu</button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {KPI_CARDS.map((card) => (
                        <div key={card.label} className={`bg-white p-6 rounded-3xl border ${card.border} shadow-sm transition-all hover:shadow-md hover:-translate-y-1`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${card.bg}`}>
                                    {card.icon}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-slate-50 text-slate-400 rounded-full">30 ngày qua</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-bold text-slate-500">{card.label}</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</span>
                                </div>
                                <p className="text-[11px] font-medium text-slate-400">{card.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pie Chart: Space Distribution */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Phân bổ không gian</h3>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng hệ thống</p>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-xl text-slate-500">
                                <PieIcon size={20} />
                            </div>
                        </div>
                        <div className="h-[280px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        iconType="circle"
                                        formatter={(value) => <span className="text-xs font-bold text-slate-600 lowercase">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-[-10px]">
                                <span className="block text-sm font-bold text-slate-400">Trống</span>
                                <span className="block text-2xl font-black text-slate-900">
                                    {((totalAvailableArea / totalGlobalArea) * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart: Comparisons */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">So sánh công suất</h3>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Theo từng kho hàng</p>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-xl text-slate-500">
                                <BarChart3 size={20} />
                            </div>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                        domain={[0, 100]}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 10 }} />
                                    <Bar 
                                        dataKey="Hiệu suất" 
                                        radius={[8, 8, 8, 8]} 
                                        barSize={32}
                                    >
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getBarColor(entry['Hiệu suất'])} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Second Row: Trends & Equipment */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Line Chart: Occupancy Trend */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-3">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Xu hướng công suất</h3>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">30 ngày vừa qua</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 italic">
                                    <TrendingUp size={14} strokeWidth={3} />
                                    <span className="text-[10px] font-black">+2.4%</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={occupancyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0891b2" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        tickFormatter={(str) => {
                                            const parts = str.split('-');
                                            return `${parts[2]}/${parts[1]}`;
                                        }}
                                        dy={10}
                                        interval={4}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        tickFormatter={(val) => `${val.toFixed(0)}%`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val) => [`${val.toFixed(1)}%`, 'Công suất']}
                                        labelFormatter={(label) => `Ngày: ${label}`}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="rate" 
                                        stroke="#0891b2" 
                                        strokeWidth={4} 
                                        fillOpacity={1} 
                                        fill="url(#colorRate)" 
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#0891b2' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Equipment Status Widget */}
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col justify-between shadow-2xl shadow-indigo-100">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="p-3 bg-white/10 rounded-2xl">
                                    <Package size={22} className="text-cyan-400" />
                                </span>
                                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Thiết bị thuê</h3>
                                <p className="text-slate-400 text-sm font-medium mt-1">Trạng thái vận hành hiện tại</p>
                            </div>
                        </div>

                        <div className="py-10 space-y-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black">{equipmentStats.utilizationPercentage.toFixed(0)}</span>
                                <span className="text-2xl font-bold text-cyan-400">%</span>
                            </div>
                            <p className="text-sm font-bold text-slate-400 italic">hiệu suất sử dụng</p>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-white/10">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-400">Đang thuê</span>
                                <span className="text-base font-black text-white">{equipmentStats.rentedEquipment} / {equipmentStats.totalEquipment}</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-cyan-400 rounded-full" 
                                    style={{ width: `${equipmentStats.utilizationPercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                                Đang có <span className="text-cyan-400">{equipmentStats.availableEquipment}</span> linh kiện sẵn sàng trong kho.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Chi tiết công suất từng kho</h2>
                            <p className="text-sm text-slate-400 font-medium">Báo cáo tham số chi tiết diện tích sàn</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                             <AlertTriangle size={16} className="text-rose-500" />
                             <span className="text-xs font-bold text-slate-600">Phát hiện {warehouses.filter(w => w.occupancyRate < 40).length} kho hiệu suất thấp</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tên kho hàng</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Tổng Area</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Đã thuê</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Đặt trước</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Còn trống</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Hiệu suất</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {warehouses.map((wh) => {
                                    const isLow = wh.occupancyRate < 40;
                                    return (
                                        <tr key={wh.warehouseId} className={`group transition-all ${isLow ? 'bg-rose-50/20' : 'hover:bg-slate-50/50'}`}>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800 text-base">{wh.name}</span>
                                                    <span className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">ID: WH-{wh.warehouseId}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center font-bold text-slate-600">{wh.totalArea.toLocaleString()} m³</td>
                                            <td className="px-6 py-5 text-center text-emerald-600 font-black">{wh.occupiedArea.toLocaleString()} m³</td>
                                            <td className="px-6 py-5 text-center text-amber-500 font-bold">{wh.reservedArea.toLocaleString()} m³</td>
                                            <td className="px-6 py-5 text-center text-slate-400 font-medium italic">{wh.availableArea.toLocaleString()} m³</td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className={`text-sm font-black min-w-[35px] ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                                                            {wh.occupancyRate.toFixed(1)}%
                                                        </span>
                                                        {isLow && (
                                                            <div className="flex items-center gap-1 bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
                                                                <AlertTriangle size={8} /> Cảnh báo
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000"
                                                            style={{ 
                                                                width: `${wh.occupancyRate}%`, 
                                                                backgroundColor: getBarColor(wh.occupancyRate) 
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="p-2 text-slate-300 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all">
                                                    <ArrowUpRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-8 py-4 bg-slate-50/50 text-slate-400 text-xs font-bold border-t border-slate-100 italic">
                        * Hiệu suất được tính dựa trên diện tích đã được các hợp đồng thuê ACTIVE chiếm dụng.
                    </div>
                </div>
            </div>
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;500;600;700;800;900&display=swap');
            `}</style>
        </div>
    );
};

export default OccupancyDashboard;

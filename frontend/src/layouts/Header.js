import React,{ useState,useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut,User,CalendarDays,Clock,Building2,ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export const Header = () => {
    const { user,logout } = useAuth();
    const navigate = useNavigate();
    const [time,setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()),1000);
        return () => clearInterval(timer);
    },[]);

    const handleLogout = () => {
        logout();
        toast.success('Đăng xuất thành công');
        navigate('/login');
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('vi-VN',{
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    };

    const formatTime = (date) => {
        return new Intl.DateTimeFormat('vi-VN',{
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(date);
    };

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md bg-white/80">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 bg-primary/5 border border-primary/10 px-4 py-1.5 rounded-2xl text-primary">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 opacity-70" />
                        <span className="text-sm font-semibold capitalize">{formatDate(time)}</span>
                    </div>
                    <div className="w-[1px] h-4 bg-primary/10" />
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 opacity-70" />
                        <span className="text-sm font-bold tabular-nums tabular-nums tracking-wide">{formatTime(time)}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                    <div className="flex flex-col items-end">
                        <p className="text-sm font-bold text-gray-800 leading-tight">{user?.fullName || 'Admin'}</p>
                        <p className="text-[11px] text-primary font-bold uppercase tracking-wider">{user?.role || 'Administrator'}</p>
                    </div>
                    <div className="relative group">
                        <button className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                            {user?.fullName?.charAt(0).toUpperCase() || 'A'}
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1">
                            <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <User size={16} /> Hồ sơ cá nhân
                            </button>
                            <div className="h-[1px] bg-gray-100 my-1 mx-2" />
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <LogOut size={16} /> Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

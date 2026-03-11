import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from '../components/Dashboard/Sidebar';

const DashboardLayout = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || user.roleName || '').toUpperCase();
  const searchPlaceholder = userRole === 'OWNER' 
    ? 'Search warehouses...' 
    : userRole === 'RENTER' 
      ? 'Tìm kiếm kho hàng, nhà kho...' 
      : 'Tìm kiếm yêu cầu hoặc mặt hàng...';

  return (
    <div className="font-display" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all" placeholder={searchPlaceholder} type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-slate-100 relative text-slate-600 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            {userRole === 'RENTER' && (
              <button className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors">
                <span className="material-symbols-outlined">help</span>
              </button>
            )}
            {/* Avatar → sang Profile */}
            <Link
              to="/profile"
              title="Trang cá nhân"
              className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden cursor-pointer border border-primary/20 hover:opacity-80 transition-opacity ml-2"
            >
              <img src={user.avatarUrl || user.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.FullName || 'User')}&background=00b2d6&color=fff`} alt="Profile" className="h-full w-full object-cover" />
            </Link>
          </div>
        </header>

        {/* Nội dung chính của các màn Component */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default DashboardLayout;

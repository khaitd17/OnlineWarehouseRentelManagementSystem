import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Dashboard/Sidebar';

const DashboardLayout = () => {
<<<<<<< Updated upstream
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: '64px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  backgroundColor: '#f8fafc',
                  outline: 'none',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#64748b', position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            </button>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#e0f2fe' }}>
              <img
                src="https://ui-avatars.com/api/?name=User&background=0d9488&color=fff"
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </header>
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
=======
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
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden cursor-pointer border border-primary/20 hover:opacity-80 transition-opacity ml-2">
              <img src={user.avatarUrl || user.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.FullName || 'User')}&background=00b2d6&color=fff`} alt="Profile" className="h-full w-full object-cover" />
            </div>
          </div>
        </header>

        {/* Nội dung chính của các màn Component */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>

>>>>>>> Stashed changes
      </div>
    </div>
  );
};

export default DashboardLayout;

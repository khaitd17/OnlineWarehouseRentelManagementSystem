import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import Sidebar from '../components/Dashboard/Sidebar';
import notificationService from '../services/notificationService';

const DashboardLayout = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || user.roleName || '').toUpperCase();
  const searchPlaceholder = userRole === 'OWNER'
    ? 'Search warehouses...'
    : userRole === 'RENTER'
      ? 'Tìm kiếm kho hàng, nhà kho...'
      : 'Tìm kiếm yêu cầu hoặc mặt hàng...';

  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const connectionRef = useRef(null);

  // SignalR real-time connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5276/hubs/notifications', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    connection.start().catch(() => {});

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.data.count);
    } catch (err) {
      // silently fail
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.data);
    } catch (err) {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.notificationId);
        setNotifications(prev =>
          prev.map(n =>
            n.notificationId === notification.notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        // silently fail
      }
    }
    setShowNotifications(false);

    if (notification.type === 'CONTRACT_APPROVED' && notification.referenceId) {
      navigate(`/contracts/${notification.referenceId}`);
    } else if (notification.type === 'CONTRACT_REJECTED') {
      navigate('/my-rental-requests');
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

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
            {/* Notification Bell */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={handleBellClick}
                className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-slate-100 relative text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '4px', right: '4px',
                    minWidth: '18px', height: '18px', borderRadius: '9px',
                    backgroundColor: '#ef4444', color: '#fff', fontSize: '11px',
                    fontWeight: 600, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', border: '2px solid #fff',
                    padding: '0 4px', lineHeight: 1
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '48px', right: 0,
                  width: '380px', maxHeight: '480px', overflowY: 'auto',
                  backgroundColor: '#fff', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0', zIndex: 50
                }}>
                  <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '16px', color: '#1e293b' }}>Thông báo</span>
                    {unreadCount > 0 && (
                      <span style={{
                        backgroundColor: '#dbeafe', color: '#2563eb',
                        fontSize: '12px', fontWeight: 600, padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {unreadCount} mới
                      </span>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '40px', marginBottom: '8px', display: 'block' }}>
                        notifications_off
                      </span>
                      <p>Không có thông báo nào</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.notificationId}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '14px 20px', cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: n.isRead ? '#fff' : '#f0f9ff',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = n.isRead ? '#f8fafc' : '#e0f2fe'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.isRead ? '#fff' : '#f0f9ff'}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            backgroundColor: n.type === 'CONTRACT_APPROVED' ? '#dcfce7' : '#fee2e2'
                          }}>
                            <span className="material-symbols-outlined" style={{
                              fontSize: '18px',
                              color: n.type === 'CONTRACT_APPROVED' ? '#16a34a' : '#dc2626'
                            }}>
                              {n.type === 'CONTRACT_APPROVED' ? 'check_circle' : 'cancel'}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontWeight: n.isRead ? 400 : 600, fontSize: '13px',
                              color: '#1e293b', marginBottom: '4px'
                            }}>
                              {n.title}
                            </div>
                            <div style={{
                              fontSize: '12px', color: '#64748b',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                              {formatTime(n.createdAt)}
                            </div>
                          </div>
                          {!n.isRead && (
                            <div style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              backgroundColor: '#3b82f6', flexShrink: 0, marginTop: '6px'
                            }} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

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
